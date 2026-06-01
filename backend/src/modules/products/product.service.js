import {
  findProductById,
  findProductImages,
  findProductVariants,
  findProductsByKeyword,
  findProductsPaged,
  findRandomProducts,
  isFavoriteProduct,
} from './product.repository.js';
import { createHash } from 'crypto';
import { getProductDecantData } from '../../models/decantModel.js';
import { getCache, invalidateProductCache, productCacheKeys, setCache } from './product.cache.js';
import { mapProductRow } from './product.mapper.js';
import { normalizeProductFilters, parsePositiveInt, resolvePurchasableSelection, validateProductResponse } from './product.validation.js';

function attachValidation(product) {
  const validation = validateProductResponse(product);
  if (validation.valid) return product;
  return {
    ...product,
    validationErrors: validation.errors,
  };
}

async function mapProductDetail(row, { userId = null } = {}) {
  const [variantRows, imageRows, isFavorite, decantData] = await Promise.all([
    findProductVariants(row.id),
    findProductImages(row.id),
    isFavoriteProduct(userId, row.id),
    getProductDecantData(row.id),
  ]);

  return attachValidation({
    ...mapProductRow(row, {
      variants: variantRows,
      imageRows,
      isFavorite,
      includeVariants: true,
    }),
    ...decantData,
  });
}

function cloneProduct(product) {
  return product ? JSON.parse(JSON.stringify(product)) : null;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function listFingerprint({ page, size, sort, filters }) {
  const canonical = {
    page: Number(page) || 1,
    size: Number(size) || 12,
    sort: String(sort || 'newest').trim().toLowerCase(),
    filters: normalizeProductFilters(filters),
  };
  return createHash('sha256').update(stableJson(canonical)).digest('hex').slice(0, 32);
}

export async function getProductsPaged({ page = 1, size = 12, sort = 'newest', filters = {} }) {
  const cacheKey = productCacheKeys.list(listFingerprint({ page, size, sort, filters }));
  const cached = await getCache(cacheKey);
  if (cached) return cloneProduct(cached);

  const pageResult = await findProductsPaged({ page, size, sort, filters });
  const result = {
    content: pageResult.rows.map((row) => attachValidation(mapProductRow(row))),
    page: pageResult.page,
    size: pageResult.size,
    totalElements: pageResult.totalElements,
    totalPages: pageResult.totalPages,
    first: pageResult.first,
    last: pageResult.last,
  };
  await setCache(cacheKey, result);
  return result;
}

export async function getProductById(id, options = {}) {
  const productId = parsePositiveInt(id);
  if (!productId) return null;

  const cacheKey = productCacheKeys.detail(productId);
  const cached = await getCache(cacheKey);
  if (cached) {
    const product = {
      ...cloneProduct(cached),
      ...(await getProductDecantData(productId)),
    };
    if (options.userId) {
      product.isFavorite = await isFavoriteProduct(options.userId, productId);
    }
    return product;
  }

  const row = await findProductById(productId);
  if (!row) return null;

  const product = await mapProductDetail(row, { userId: null });
  await setCache(cacheKey, product);

  if (options.userId) {
    return {
      ...cloneProduct(product),
      isFavorite: await isFavoriteProduct(options.userId, productId),
    };
  }

  return product;
}

export async function searchProducts(keyword, limit = 10) {
  const cacheKey = productCacheKeys.list(listFingerprint({
    page: 1,
    size: limit,
    sort: 'search',
    filters: { search: keyword },
  }));
  const cached = await getCache(cacheKey);
  if (cached) return cloneProduct(cached);

  const rows = await findProductsByKeyword(keyword, limit);
  const result = rows.map((row) => attachValidation(mapProductRow(row)));
  await setCache(cacheKey, result);
  return result;
}

export async function getRandomProducts(limit = 4) {
  const rows = await findRandomProducts(limit);
  return rows.map((row) => attachValidation(mapProductRow(row)));
}

export async function getProductPurchaseOption(productId, variantId = null, options = {}) {
  const product = await getProductById(productId);
  return resolvePurchasableSelection(product, variantId, options);
}

export { invalidateProductCache };
