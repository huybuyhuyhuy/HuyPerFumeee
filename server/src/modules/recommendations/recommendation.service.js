import { createHash } from 'crypto';
import {
  findPersonalizedProducts,
  findRecentlyViewedProducts,
  findRelatedProducts,
  findTrendingProducts,
  saveProductView,
} from '../products/product.repository.js';
import { getCache, productCacheKeys, setCache } from '../products/product.cache.js';
import { mapProductRow } from '../products/product.mapper.js';

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function parseLimit(limit, fallback = 8, max = 24) {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.min(max, parsed));
}

function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}

function mapRows(rows) {
  return rows.map((row) => mapProductRow(row));
}

export async function getRelatedProducts(productId, { limit = 8 } = {}) {
  const safeLimit = parseLimit(limit, 8);
  const cacheKey = productCacheKeys.recommendations('related', `${productId}:${safeLimit}`);
  const cached = await getCache(cacheKey);
  if (cached) return clone(cached);

  const result = mapRows(await findRelatedProducts(productId, safeLimit));
  await setCache(cacheKey, result, 180);
  return result;
}

export async function getTrendingProducts({ limit = 8, days = 30 } = {}) {
  const safeLimit = parseLimit(limit, 8);
  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));
  const cacheKey = productCacheKeys.recommendations('trending', `${safeLimit}:${safeDays}`);
  const cached = await getCache(cacheKey);
  if (cached) return clone(cached);

  const result = mapRows(await findTrendingProducts({ limit: safeLimit, days: safeDays }));
  await setCache(cacheKey, result, 180);
  return result;
}

export async function getPersonalizedRecommendations({ userId = null, viewToken = null, limit = 8 } = {}) {
  const safeLimit = parseLimit(limit, 8);
  const owner = userId ? `u:${userId}` : viewToken ? `v:${String(viewToken).slice(0, 160)}` : 'guest';
  const cacheKey = productCacheKeys.recommendations('personalized', fingerprint({ owner, limit: safeLimit }));
  const cached = await getCache(cacheKey);
  if (cached) return clone(cached);

  let rows = await findPersonalizedProducts({ userId, viewToken, limit: safeLimit });
  if (!rows.length) rows = await findTrendingProducts({ limit: safeLimit, days: 30 });
  const result = mapRows(rows);
  await setCache(cacheKey, result, 90);
  return result;
}

export async function getRecentlyViewedProductList({ userId = null, viewToken = null, limit = 12 } = {}) {
  const safeLimit = parseLimit(limit, 12, 50);
  const rows = await findRecentlyViewedProducts({ userId, viewToken, limit: safeLimit });
  return mapRows(rows);
}

export async function recordProductView({ productId, userId = null, viewToken = null } = {}) {
  return saveProductView({ productId, userId, viewToken });
}
