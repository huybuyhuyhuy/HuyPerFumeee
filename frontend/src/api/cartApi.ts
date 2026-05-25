import apiClient, { unwrapApiData } from './apiClient';
import type { CartSummary } from '../types';
import { normalizeCartSummary } from '../services/dataMappers';

export async function getCart() {
  const { data } = await apiClient.get<{ data: CartSummary }>('/cart');
  return normalizeCartSummary(unwrapApiData(data));
}

export async function addCartItem(productId: number, quantity = 1, variantId?: number | string | null) {
  const body = variantId ? { productId, quantity, variantId } : { productId, quantity };
  const { data } = await apiClient.post('/cart/add', body);
  return normalizeCartSummary(unwrapApiData(data));
}

export async function updateCartItem(productId: number, quantity: number, variantId?: number | string | null) {
  const body = variantId ? { productId, quantity, variantId } : { productId, quantity };
  const { data } = await apiClient.put('/cart/update', body);
  return normalizeCartSummary(unwrapApiData(data));
}

export async function removeCartItem(productId: number, variantId?: number | string | null) {
  const { data } = await apiClient.delete(`/cart/remove/${productId}`, {
    params: variantId ? { variantId } : undefined,
  });
  return normalizeCartSummary(unwrapApiData(data));
}

export async function clearCart() {
  const { data } = await apiClient.delete('/cart/clear');
  return normalizeCartSummary(unwrapApiData(data));
}
