import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../types';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  items: Product[];
  count: number;
  loading: boolean;
  error: string;
  isWishlisted: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
  addToWishlist: (product: Product) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<boolean>;
  toggleWishlist: (product: Product) => Promise<boolean>;
  clearWishlist: () => Promise<void>;
}

const STORAGE_KEY = 'wishlist';
const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

function sameProductId(left: unknown, right: unknown) {
  return String(left) === String(right);
}

function readStoredWishlist(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredWishlist(items: Product[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function uniqueProducts(items: Product[]) {
  const map = new Map<string, Product>();
  for (const item of items) {
    if (!item?.id) continue;
    map.set(String(item.id), item);
  }
  return Array.from(map.values());
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const [items, setItems] = useState<Product[]>(readStoredWishlist);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const syncedUserIdRef = useRef<number | null>(null);

  const persistLocal = useCallback((nextItems: Product[]) => {
    const normalized = uniqueProducts(nextItems);
    setItems(normalized);
    writeStoredWishlist(normalized);
  }, []);

  const replaceWithBackendItems = useCallback((nextItems: Product[]) => {
    const normalized = uniqueProducts(nextItems);
    setItems(normalized);
    writeStoredWishlist([]);
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setError('');
      setItems(readStoredWishlist);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const remoteItems = await wishlistService.getWishlist();
      replaceWithBackendItems(remoteItems.map((item: { product: Product }) => item.product));
    } catch (err: any) {
      const localItems = readStoredWishlist();
      setItems(localItems);
      setError(err?.message || 'Không tải được wishlist từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, replaceWithBackendItems]);

  useEffect(() => {
    if (!isLoggedIn) {
      syncedUserIdRef.current = null;
      setItems(readStoredWishlist);
      setError('');
      return;
    }

    if (syncedUserIdRef.current === user?.id) return;
    syncedUserIdRef.current = user?.id ?? null;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const localWishlist = readStoredWishlist();
        const remoteWishlist = await wishlistService.getWishlist();
        const remoteProducts = remoteWishlist.map((item: { product: Product }) => item.product);
        const merged = uniqueProducts([...remoteProducts, ...localWishlist]);

        if (!cancelled && localWishlist.length > 0) {
          for (const product of localWishlist) {
            if (!product?.id) continue;
            try {
              await wishlistService.addToWishlist(Number(product.id));
            } catch {
              // keep syncing the rest without breaking login flow
            }
          }
          const refreshed = await wishlistService.getWishlist();
          if (!cancelled) {
            replaceWithBackendItems(refreshed.map((item: { product: Product }) => item.product));
          }
        } else if (!cancelled) {
          replaceWithBackendItems(merged);
        }
      } catch (err: any) {
        if (!cancelled) {
          setItems(readStoredWishlist());
          setError(err?.message || 'Không đồng bộ được wishlist.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id, replaceWithBackendItems]);

  const isWishlisted = useCallback(
    (productId: number) => items.some((item) => sameProductId(item.id, productId)),
    [items]
  );

  const addToWishlist = useCallback(
    async (product: Product) => {
      if (!product?.id) return false;
      setError('');
      if (!isLoggedIn) {
        persistLocal([product, ...items]);
        return true;
      }

      try {
        const responseItems = await wishlistService.addToWishlist(Number(product.id));
        replaceWithBackendItems(responseItems.map((item: { product: Product }) => item.product));
        return true;
      } catch (err: any) {
        setError(err?.message || 'Không thể thêm vào wishlist.');
        return false;
      }
    },
    [isLoggedIn, items, persistLocal, replaceWithBackendItems]
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      setError('');
      if (!isLoggedIn) {
        persistLocal(items.filter((item) => !sameProductId(item.id, productId)));
        return true;
      }

      try {
        const responseItems = await wishlistService.removeFromWishlist(Number(productId));
        replaceWithBackendItems(responseItems.map((item: { product: Product }) => item.product));
        return true;
      } catch (err: any) {
        setError(err?.message || 'Không thể xóa khỏi wishlist.');
        return false;
      }
    },
    [isLoggedIn, items, persistLocal, replaceWithBackendItems]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (items.some((item) => sameProductId(item.id, product.id))) {
        return removeFromWishlist(Number(product.id));
      }
      return addToWishlist(product);
    },
    [addToWishlist, items, removeFromWishlist]
  );

  const clearWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      persistLocal([]);
      return;
    }
    try {
      persistLocal([]);
    } catch {
      setError('Không thể xóa wishlist.');
    }
  }, [isLoggedIn, persistLocal]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      loading,
      error,
      isWishlisted,
      refreshWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [items, loading, error, isWishlisted, refreshWishlist, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
