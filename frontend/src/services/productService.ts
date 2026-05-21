import api, { unwrapApiData } from './api';
import { normalizeProduct, normalizeProductPage } from './dataMappers';

export const productService = {
  async getProducts(params: Record<string, unknown>) {
    const { data } = await api.get('/products', { params });
    return normalizeProductPage(unwrapApiData(data));
  },
  async getProduct(id: number) {
    const { data } = await api.get(`/products/${id}`);
    return normalizeProduct(unwrapApiData(data));
  },
};
