import apiClient, { unwrapApiData } from './apiClient';
import type { CartSummary } from '../types';
import { normalizeCartSummary } from '../services/dataMappers';

export async function getCart() {
  const { data } = await apiClient.get<{ data: CartSummary }>('/cart');
  return normalizeCartSummary(unwrapApiData(data));
}

export async function addCartItem(productId: number, quantity = 1) {
  const { data } = await apiClient.post('/cart/add', { productId, quantity });
  return normalizeCartSummary(unwrapApiData(data));
}

export async function updateCartItem(productId: number, quantity: number) {
  const { data } = await apiClient.put('/cart/update', { productId, quantity });
  return normalizeCartSummary(unwrapApiData(data));
}

export async function removeCartItem(productId: number) {
  const { data } = await apiClient.delete(`/cart/remove/${productId}`);
  return normalizeCartSummary(unwrapApiData(data));
}

export async function clearCart() {
  const { data } = await apiClient.delete('/cart/clear');
  return normalizeCartSummary(unwrapApiData(data));
}
