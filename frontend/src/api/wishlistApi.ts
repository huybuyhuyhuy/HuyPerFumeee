import apiClient, { unwrapApiData } from './apiClient';
import type { Product } from '../types';
import { normalizeProduct } from '../services/dataMappers';

export async function getWishlist() {
  const { data } = await apiClient.get<{ data: Array<{ product: Product }> }>('/wishlist');
  return unwrapApiData(data).map((item: any) => ({
    ...item,
    product: normalizeProduct(item.product),
  }));
}

export async function addWishlistItem(productId: number) {
  const { data } = await apiClient.post(`/wishlist/${productId}`);
  return data;
}

export async function removeWishlistItem(productId: number) {
  const { data } = await apiClient.delete(`/wishlist/${productId}`);
  return data;
}
