import api, { unwrapApiData } from './api';
import { normalizeCartSummary } from './dataMappers';

const CART_UPDATED_EVENT = 'huyperfume:cart-updated';

export type CartSelectionOptions = {
  itemType?: 'FULL_BOTTLE' | 'DECANT' | string | null;
  volumeMl?: number | string | null;
};

function notifyCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function buildSelectionPayload(productId: number, quantity?: number, variantId?: number | string | null, options: CartSelectionOptions = {}) {
  const body: any = { productId };
  if (quantity !== undefined) body.quantity = quantity;
  if (variantId !== null && variantId !== undefined && variantId !== '') body.variantId = variantId;
  if (options.itemType) body.itemType = options.itemType;
  if (options.volumeMl !== null && options.volumeMl !== undefined && options.volumeMl !== '') body.volumeMl = options.volumeMl;
  return body;
}

export const cartService = {
  async getCart() {
    const { data } = await api.get('/cart');
    return normalizeCartSummary(unwrapApiData(data));
  },
  async addItem(productId: number, quantity: number, variantId?: number | string | null, options: CartSelectionOptions = {}) {
    const body = buildSelectionPayload(productId, quantity, variantId, options);
    const { data } = await api.post('/cart/add', body);
    const cart = normalizeCartSummary(unwrapApiData(data));
    notifyCartUpdated();
    return cart;
  },
  async updateItem(productId: number, quantity: number, variantId?: number | string | null, options: CartSelectionOptions = {}) {
    const body = buildSelectionPayload(productId, quantity, variantId, options);
    const { data } = await api.put('/cart/update', body);
    const cart = normalizeCartSummary(unwrapApiData(data));
    notifyCartUpdated();
    return cart;
  },
  async removeItem(productId: number, variantId?: number | string | null, options: CartSelectionOptions = {}) {
    const params = buildSelectionPayload(productId, undefined, variantId, options);
    delete params.productId;
    const { data } = await api.delete(`/cart/remove/${productId}`, {
      params: Object.keys(params).length ? params : undefined,
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
