import api, { unwrapApiData } from './api';
import { normalizeProduct, normalizeProductPage } from './dataMappers';
import type { ProductReview } from '../types';

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asString(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value);
}

function normalizeReview(raw: any): ProductReview {
  return {
    id: asNumber(raw?.id),
    productId: asNumber(raw?.productId ?? raw?.product_id),
    userId: asNumber(raw?.userId ?? raw?.user_id),
    rating: asNumber(raw?.rating),
    title: asString(raw?.title),
    comment: asString(raw?.comment),
    status: asString(raw?.status),
    user: raw?.user ? { id: asNumber(raw.user.id), name: asString(raw.user.name) } : null,
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? null,
  };
}

function normalizeCategoryName(value: unknown) {
  return asString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isHiddenPublicCategory(category: any) {
  const name = normalizeCategoryName(category?.name);
  return name.includes('mini') && name.includes('5ml') && name.includes('10ml');
}

export const productService = {
  async getProducts(params: Record<string, unknown>) {
    const { data } = await api.get('/products', { params });
    return normalizeProductPage(unwrapApiData(data));
  },
  async getCategories() {
    const { data } = await api.get('/categories');
    const payload = unwrapApiData<any>(data);
    return Array.isArray(payload) ? payload.filter((category) => !isHiddenPublicCategory(category)) : [];
  },
  async getBrands() {
    const { data } = await api.get('/brands');
    const payload = unwrapApiData<any>(data);
    return Array.isArray(payload) ? payload : [];
  },
  async getProduct(id: number) {
    const { data } = await api.get(`/products/${id}`);
    return normalizeProduct(unwrapApiData(data));
  },
  async getRelatedProducts(id: number, params: Record<string, unknown> = { limit: 8 }) {
    const { data } = await api.get(`/products/${id}/related`, { params });
    const payload = unwrapApiData<any>(data);
    return Array.isArray(payload) ? payload.map(normalizeProduct) : [];
  },
  async getProductReviews(id: number, params: Record<string, unknown> = { page: 1, size: 5 }) {
    const { data } = await api.get(`/products/${id}/reviews`, { params });
    const payload = unwrapApiData<any>(data);
    return {
      ...payload,
      content: Array.isArray(payload?.content) ? payload.content.map(normalizeReview) : [],
    };
  },
  async getTrendingProducts(params: Record<string, unknown> = { limit: 8 }) {
    const { data } = await api.get('/products/recommendations/trending', { params });
    const payload = unwrapApiData<any>(data);
    return Array.isArray(payload) ? payload.map(normalizeProduct) : [];
  },
  async getPersonalizedRecommendations(params: Record<string, unknown> = { limit: 8 }) {
    const { data } = await api.get('/products/recommendations/personalized', { params });
    const payload = unwrapApiData<any>(data);
    return Array.isArray(payload) ? payload.map(normalizeProduct) : [];
  },
  async getRecentlyViewed(params: Record<string, unknown> = { limit: 12 }) {
    const { data } = await api.get('/products/recently-viewed', { params });
    const payload = unwrapApiData<any>(data);
    return Array.isArray(payload) ? payload.map(normalizeProduct) : [];
  },
  async createReview(id: number, payload: { rating: number; title?: string; comment?: string }) {
    const { data } = await api.post(`/products/${id}/reviews`, payload);
    return unwrapApiData(data);
  },
};
