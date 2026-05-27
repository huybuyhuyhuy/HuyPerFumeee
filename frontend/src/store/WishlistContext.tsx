import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Product } from '../types';

interface WishlistContextValue {
  items: Product[];
  count: number;
  isWishlisted: (productId: number) => boolean;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  toggleWishlist: (product: Product) => boolean;
  clearWishlist: () => void;
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

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>(readStoredWishlist);

  const persist = useCallback((nextItems: Product[]) => {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  }, []);

  const isWishlisted = useCallback(
    (productId: number) => items.some((item) => sameProductId(item.id, productId)),
    [items]
  );

  const addToWishlist = useCallback(
    (product: Product) => {
      if (items.some((item) => sameProductId(item.id, product.id))) return;
      persist([product, ...items]);
    },
    [items, persist]
  );

  const removeFromWishlist = useCallback(
    (productId: number) => {
      persist(items.filter((item) => !sameProductId(item.id, productId)));
    },
    [items, persist]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (items.some((item) => sameProductId(item.id, product.id))) {
        persist(items.filter((item) => !sameProductId(item.id, product.id)));
        return false;
      }
      persist([product, ...items]);
      return true;
    },
    [items, persist]
  );

  const clearWishlist = useCallback(() => {
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [items, isWishlisted, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
