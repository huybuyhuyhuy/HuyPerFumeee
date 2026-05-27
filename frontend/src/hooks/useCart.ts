import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { unwrapApiData } from '../services/api';
import { normalizeCartSummary } from '../services/dataMappers';
import type { CartSummary } from '../types';

export const CART_UPDATED_EVENT = 'huyperfume:cart-updated';

const emptyCart: CartSummary = { items: [], total: 0, itemCount: 0 };

export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function useCart() {
  const [cart, setCart] = useState<CartSummary>(emptyCart);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/cart');
      setCart(normalizeCartSummary(unwrapApiData<CartSummary>(data)));
    } catch (err: any) {
      setCart(emptyCart);
      setError(err?.message || 'Không thể tải giỏ hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId: number, quantity: number, variantId?: number | string | null) => {
    if (quantity < 1) {
      await api.delete(`/cart/remove/${productId}`, { params: variantId ? { variantId } : undefined });
    } else {
      const body = variantId ? { productId, quantity, variantId } : { productId, quantity };
      await api.put('/cart/update', body);
    }
    await fetchCart();
    notifyCartChanged();
  }, [fetchCart]);

  const removeItem = useCallback(async (productId: number, variantId?: number | string | null) => {
    await api.delete(`/cart/remove/${productId}`, { params: variantId ? { variantId } : undefined });
    await fetchCart();
    notifyCartChanged();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await api.delete('/cart/clear');
    } catch {
      // keep local cleanup resilient if the server already emptied the cart
    }
    setCart(emptyCart);
    notifyCartChanged();
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const refresh = () => fetchCart();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CART_UPDATED_EVENT, refresh);
  }, [fetchCart]);

  return useMemo(
    () => ({ cart, loading, error, fetchCart, updateQuantity, removeItem, clearCart }),
    [cart, loading, error, fetchCart, updateQuantity, removeItem, clearCart]
  );
}
