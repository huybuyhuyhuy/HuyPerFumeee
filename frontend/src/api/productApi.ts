import apiClient from './apiClient';
import type { PagedResponse, Product } from '../types';
import { normalizeProduct, normalizeProductPage } from '../services/dataMappers';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export async function getProducts(params: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<PagedResponse<Product> | ApiEnvelope<PagedResponse<Product>>>('/products', { params });
  return normalizeProductPage(unwrapApiData(data));
}

export async function getProductDetail(id: number) {
  const { data } = await apiClient.get<Product | ApiEnvelope<Product>>(`/products/${id}`);
  return normalizeProduct(unwrapApiData(data));
}

export async function getRandomProducts() {
  const { data } = await apiClient.get<Product[] | ApiEnvelope<Product[]>>('/products/random');
  return unwrapApiData(data).map(normalizeProduct);
}
