import { useCallback, useEffect, useMemo, useState } from 'react';
import { cartService } from '../services/cartService';
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
      setCart(await cartService.getCart());
    } catch (err: any) {
      setCart(emptyCart);
      setError(err?.message || 'Không thể tải giỏ hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId: number, quantity: number, variantId?: number | string | null) => {
    const nextCart = quantity < 1
      ? await cartService.removeItem(productId, variantId)
      : await cartService.updateItem(productId, quantity, variantId);
    setCart(nextCart);
    setError('');
  }, []);

  const removeItem = useCallback(async (productId: number, variantId?: number | string | null) => {
    setCart(await cartService.removeItem(productId, variantId));
    setError('');
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setCart(await cartService.clear());
    } catch {
      // keep local cleanup resilient if the server already emptied the cart
      setCart(emptyCart);
    }
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
