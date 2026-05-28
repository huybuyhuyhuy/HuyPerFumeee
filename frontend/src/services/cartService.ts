import api, { unwrapApiData } from './api';
import { normalizeCartSummary } from './dataMappers';

const CART_UPDATED_EVENT = 'huyperfume:cart-updated';

function notifyCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export const cartService = {
  async getCart() {
    const { data } = await api.get('/cart');
    return normalizeCartSummary(unwrapApiData(data));
  },
  async addItem(productId: number, quantity: number, variantId?: number | string | null) {
    const body = variantId !== null && variantId !== undefined ? { productId, quantity, variantId } : { productId, quantity };
    const { data } = await api.post('/cart/add', body);
    const cart = normalizeCartSummary(unwrapApiData(data));
    notifyCartUpdated();
    return cart;
  },
  async updateItem(productId: number, quantity: number, variantId?: number | string | null) {
    const body = variantId !== null && variantId !== undefined ? { productId, quantity, variantId } : { productId, quantity };
    const { data } = await api.put('/cart/update', body);
    const cart = normalizeCartSummary(unwrapApiData(data));
    notifyCartUpdated();
    return cart;
  },
  async removeItem(productId: number, variantId?: number | string | null) {
    const { data } = await api.delete(`/cart/remove/${productId}`, {
      params: variantId !== null && variantId !== undefined ? { variantId } : undefined,
    });
    const cart = normalizeCartSummary(unwrapApiData(data));
    notifyCartUpdated();
    return cart;
  },
  async clear() {
    const { data } = await api.delete('/cart/clear');
    const cart = normalizeCartSummary(unwrapApiData(data));
    notifyCartUpdated();
    return cart;
  },
  async mergeGuestCart() {
    const { data } = await api.post('/cart/merge');
    const cart = normalizeCartSummary(unwrapApiData(data));
    notifyCartUpdated();
    return cart;
  },
};
