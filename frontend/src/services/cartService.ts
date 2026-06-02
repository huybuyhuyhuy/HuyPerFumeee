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
  async addOrderItems(items: any[] = []) {
    const added: any[] = [];
    const failed: Array<{ item: any; reason: string }> = [];

    for (const item of items) {
      try {
        const productId = Number(item.productId ?? item.product_id);
        if (!productId) {
          failed.push({ item, reason: 'Sản phẩm không hợp lệ.' });
          continue;
        }
        await this.addItem(productId, Number(item.quantity || 1), item.variantId ?? item.product_variant_id ?? null, {
          itemType: item.itemType ?? item.item_type ?? 'FULL_BOTTLE',
          volumeMl: item.selectedVolumeMl ?? item.selected_volume_ml ?? null,
        });
        added.push(item);
      } catch (error: any) {
        failed.push({
          item,
          reason: error?.response?.data?.message || error?.message || 'Sản phẩm không còn khả dụng.',
        });
      }
    }

    return { added, failed };
  },
};
