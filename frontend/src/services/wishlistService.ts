import api, { unwrapApiData } from './api';
import { normalizeProduct } from './dataMappers';

function normalizeWishlistItem(raw: any) {
  return {
    id: Number(raw?.id ?? raw?.wishlistId ?? 0),
    productId: Number(raw?.productId ?? raw?.product_id ?? raw?.product?.id ?? 0),
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    product: raw?.product ? normalizeProduct(raw.product) : normalizeProduct(raw),
  };
}

export const wishlistService = {
  async getWishlist() {
    const { data } = await api.get('/wishlist');
    const payload = unwrapApiData<any>(data);
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    return items.map(normalizeWishlistItem).filter((item) => item.productId > 0 && item.product?.id > 0);
  },
  async addToWishlist(productId: number) {
    const { data } = await api.post(`/wishlist/${productId}`);
    const payload = unwrapApiData<any>(data);
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    return items.map(normalizeWishlistItem).filter((item) => item.productId > 0 && item.product?.id > 0);
  },
  async removeFromWishlist(productId: number) {
    const { data } = await api.delete(`/wishlist/${productId}`);
    const payload = unwrapApiData<any>(data);
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    return items.map(normalizeWishlistItem).filter((item) => item.productId > 0 && item.product?.id > 0);
  },
};
