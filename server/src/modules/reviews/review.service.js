import { getProductById, invalidateProductCache } from '../products/product.service.js';
import { getCache, productCacheKeys, setCache } from '../products/product.cache.js';
import { hasPermission } from '../auth/rbac.js';
import { mapReviewRow, mapReviewSummary } from './review.mapper.js';
import {
  findReviewById,
  findReviewByUserProduct,
  getReviewSummary,
  hasReviewStorage,
  insertReview,
  listReviewsByProduct,
  moderateReviewById,
  recalculateProductRating,
  softDeleteReviewById,
  updateReviewById,
} from './review.repository.js';
import { normalizeReviewStatus, REVIEW_STATUSES, validateReviewInput } from './review.validation.js';

function serviceError(status, message, details = {}) {
  return { error: { status, message, details } };
}

function canModerate(user) {
  return hasPermission(user, 'admin:access');
}

function canMutateReview(user, review) {
  return canModerate(user) || Number(review.user_id) === Number(user?.id);
}

async function ensureStorage() {
  if (await hasReviewStorage()) return null;
  return serviceError(503, 'Review storage chua san sang. Hay chay migration Phase 5 truoc.');
}

async function refreshRating(productId) {
  await recalculateProductRating(productId);
  await invalidateProductCache(productId);
}

export async function getProductReviewPage({ productId, page = 1, size = 10, status = 'APPROVED', viewer = null }) {
  const storageError = await ensureStorage();
  if (storageError) {
    return {
      content: [],
      page: Number(page) || 1,
      size: Number(size) || 10,
      totalElements: 0,
      totalPages: 1,
      first: true,
      last: true,
      summary: mapReviewSummary({}),
    };
  }

  const requestedStatus = String(status || 'APPROVED').trim().toUpperCase();
  const safeStatus = canModerate(viewer) && requestedStatus === 'ALL'
    ? 'ALL'
    : canModerate(viewer)
      ? normalizeReviewStatus(status, 'APPROVED')
      : REVIEW_STATUSES.APPROVED;
  const cacheKey = productCacheKeys.reviewList(productId, `${Number(page) || 1}:${Number(size) || 10}:${safeStatus}`);
  const cached = await getCache(cacheKey);
  if (cached) return JSON.parse(JSON.stringify(cached));

  const pageResult = await listReviewsByProduct({ productId, page, size, status: safeStatus });
  const summary = await getReviewSummary(productId);
  const result = {
    content: pageResult.rows.map(mapReviewRow),
    page: pageResult.page,
    size: pageResult.size,
    totalElements: pageResult.totalElements,
    totalPages: pageResult.totalPages,
    first: pageResult.first,
    last: pageResult.last,
    summary: mapReviewSummary(summary),
  };
  await setCache(cacheKey, result, 120);
  return result;
}

export async function createProductReview({ productId, userId, input }) {
  const storageError = await ensureStorage();
  if (storageError) return storageError;

  const product = await getProductById(productId);
  if (!product) return serviceError(404, 'Khong tim thay san pham');

  const validation = validateReviewInput(input);
  if (!validation.valid) return serviceError(400, 'Du lieu review khong hop le', { errors: validation.errors });

  const existing = await findReviewByUserProduct(userId, productId);
  if (existing) return serviceError(409, 'Ban da review san pham nay roi');

  const row = await insertReview({
    productId,
    userId,
    orderId: validation.value.orderId,
    rating: validation.value.rating,
    title: validation.value.title,
    comment: validation.value.comment,
  });
  await refreshRating(productId);

  return {
    review: mapReviewRow(row),
    moderation: {
      status: REVIEW_STATUSES.PENDING,
      message: 'Review da duoc ghi nhan va dang cho duyet.',
    },
  };
}

export async function updateProductReview({ reviewId, user, input }) {
  const storageError = await ensureStorage();
  if (storageError) return storageError;

  const existing = await findReviewById(reviewId);
  if (!existing) return serviceError(404, 'Khong tim thay review');
  if (!canMutateReview(user, existing)) return serviceError(403, 'Khong co quyen cap nhat review nay');

  const validation = validateReviewInput(input, { partial: true });
  if (!validation.valid) return serviceError(400, 'Du lieu review khong hop le', { errors: validation.errors });

  const nextRating = validation.value.rating ?? Number(existing.rating);
  const nextTitle = input.title === undefined ? existing.title : validation.value.title;
  const nextComment = (input.comment === undefined && input.content === undefined) ? existing.comment : validation.value.comment;
  const nextStatus = canModerate(user) ? normalizeReviewStatus(input.status, existing.status) : REVIEW_STATUSES.PENDING;

  const row = await updateReviewById({
    reviewId,
    rating: nextRating,
    title: nextTitle,
    comment: nextComment,
    status: nextStatus,
  });
  await refreshRating(existing.product_id);

  return { review: mapReviewRow(row) };
}

export async function deleteProductReview({ reviewId, user }) {
  const storageError = await ensureStorage();
  if (storageError) return storageError;

  const existing = await findReviewById(reviewId);
  if (!existing) return serviceError(404, 'Khong tim thay review');
  if (!canMutateReview(user, existing)) return serviceError(403, 'Khong co quyen xoa review nay');

  const deleted = await softDeleteReviewById(reviewId);
  await refreshRating(existing.product_id);
  return { removed: Boolean(deleted), productId: Number(existing.product_id) };
}

export async function moderateProductReview({ reviewId, moderator, status, note = '' }) {
  const storageError = await ensureStorage();
  if (storageError) return storageError;

  const existing = await findReviewById(reviewId);
  if (!existing) return serviceError(404, 'Khong tim thay review');

  const nextStatus = normalizeReviewStatus(status, null);
  if (!nextStatus) return serviceError(400, 'Trang thai review khong hop le');

  const row = await moderateReviewById({
    reviewId,
    status: nextStatus,
    note: String(note || '').trim().slice(0, 500),
    moderatorId: moderator?.id,
  });
  await refreshRating(existing.product_id);

  return { review: mapReviewRow(row) };
}
