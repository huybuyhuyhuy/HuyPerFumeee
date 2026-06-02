import { errorResponse, successResponse } from '../utils/response.js';
import {
  createProductReview,
  deleteProductReview,
  getProductReviewEligibility,
  getProductReviewPage,
  moderateProductReview,
  updateProductReview,
} from '../modules/reviews/review.service.js';

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendServiceResult(res, successMessage, result, status = 200) {
  if (result?.error) {
    return errorResponse(res, result.error.status, result.error.message, result.error.details);
  }
  return successResponse(res, successMessage, result, status);
}

export async function listProductReviews(req, res, next) {
  try {
    const productId = parsePositiveId(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID san pham khong hop le');

    const result = await getProductReviewPage({
      productId,
      page: req.query.page || 1,
      size: req.query.size || 10,
      status: req.query.status || 'APPROVED',
      viewer: req.user || null,
    });
    return successResponse(res, 'Lay danh sach review thanh cong', result);
  } catch (error) {
    return next(error);
  }
}

export async function reviewEligibility(req, res, next) {
  try {
    const productId = parsePositiveId(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID san pham khong hop le');

    const result = await getProductReviewEligibility({
      productId,
      userId: req.user?.id || null,
      orderId: req.query.orderId || null,
    });
    return successResponse(res, 'Kiem tra quyen review thanh cong', result);
  } catch (error) {
    return next(error);
  }
}

export async function createReview(req, res, next) {
  try {
    const productId = parsePositiveId(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID san pham khong hop le');

    const result = await createProductReview({
      productId,
      userId: req.user.id,
      input: req.body || {},
    });
    return sendServiceResult(res, 'Tao review thanh cong', result, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateReview(req, res, next) {
  try {
    const reviewId = parsePositiveId(req.params.id);
    if (!reviewId) return errorResponse(res, 400, 'ID review khong hop le');

    const result = await updateProductReview({
      reviewId,
      user: req.user,
      input: req.body || {},
    });
    return sendServiceResult(res, 'Cap nhat review thanh cong', result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const reviewId = parsePositiveId(req.params.id);
    if (!reviewId) return errorResponse(res, 400, 'ID review khong hop le');

    const result = await deleteProductReview({ reviewId, user: req.user });
    return sendServiceResult(res, 'Xoa review thanh cong', result);
  } catch (error) {
    return next(error);
  }
}

export async function moderateReview(req, res, next) {
  try {
    const reviewId = parsePositiveId(req.params.id);
    if (!reviewId) return errorResponse(res, 400, 'ID review khong hop le');

    const result = await moderateProductReview({
      reviewId,
      moderator: req.user,
      status: req.body?.status,
      note: req.body?.note || req.body?.moderationNote || '',
    });
    return sendServiceResult(res, 'Duyet review thanh cong', result);
  } catch (error) {
    return next(error);
  }
}
