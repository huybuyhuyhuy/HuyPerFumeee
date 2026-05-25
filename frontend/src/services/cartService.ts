import api, { unwrapApiData } from './api';
import { normalizeCartSummary } from './dataMappers';

export const cartService = {
  async addItem(productId: number, quantity: number, variantId?: number | string | null) {
    const body = variantId ? { productId, quantity, variantId } : { productId, quantity };
    const { data } = await api.post('/cart/add', body);
    return normalizeCartSummary(unwrapApiData(data));
  },
};
