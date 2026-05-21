import api, { unwrapApiData } from './api';
import { normalizeCartSummary } from './dataMappers';

export const cartService = {
  async addItem(productId: number, quantity: number) {
    const { data } = await api.post('/cart/add', { productId, quantity });
    return normalizeCartSummary(unwrapApiData(data));
  },
};
