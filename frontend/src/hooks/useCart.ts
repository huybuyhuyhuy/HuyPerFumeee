import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { unwrapApiData } from '../services/api';
import { normalizeCartSummary } from '../services/dataMappers';
import type { CartSummary } from '../types';

const emptyCart: CartSummary = { items: [], total: 0, itemCount: 0 };

export function useCart() {
  const [cart, setCart] = useState<CartSummary>(emptyCart);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(normalizeCartSummary(unwrapApiData<CartSummary>(data)));
    } catch {
      setCart(emptyCart);
    }
  }, []);

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) {
      await api.delete(`/cart/remove/${productId}`);
    } else {
      await api.put('/cart/update', { productId, quantity });
    }
    await fetchCart();
  };

  const removeItem = async (productId: number) => {
    await api.delete(`/cart/remove/${productId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
    } catch {
      // ignore
    }
    setCart(emptyCart);
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      fetchCart();
    }
  }, [fetchCart]);

  return useMemo(
    () => ({ cart, loading: false, error: '', fetchCart, updateQuantity, removeItem, clearCart }),
    [cart]
  );
}
