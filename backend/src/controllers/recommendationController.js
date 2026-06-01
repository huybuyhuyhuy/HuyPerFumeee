import { errorResponse, successResponse } from '../utils/response.js';
import {
  getPersonalizedRecommendations,
  getRecentlyViewedProductList,
  getRelatedProducts,
  getTrendingProducts,
  recordProductView,
} from '../modules/recommendations/recommendation.service.js';

export function getViewTokenFromRequest(req) {
  const token = req.headers['x-view-token'] ||
    req.headers['x-session-id'] ||
    req.query.viewToken ||
    req.body?.viewToken;
  return token ? String(token).trim().slice(0, 160) : null;
}

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function relatedProducts(req, res, next) {
  try {
    const productId = parsePositiveId(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID san pham khong hop le');

    const products = await getRelatedProducts(productId, { limit: req.query.limit || 8 });
    return successResponse(res, 'Lay san pham lien quan thanh cong', products);
  } catch (error) {
    return next(error);
  }
}

export async function trendingProducts(req, res, next) {
  try {
    const products = await getTrendingProducts({
      limit: req.query.limit || 8,
      days: req.query.days || 30,
    });
    return successResponse(res, 'Lay san pham trending thanh cong', products);
  } catch (error) {
    return next(error);
  }
}

export async function personalizedRecommendations(req, res, next) {
  try {
    const products = await getPersonalizedRecommendations({
      userId: req.user?.id || null,
      viewToken: getViewTokenFromRequest(req),
      limit: req.query.limit || 8,
    });
    return successResponse(res, 'Lay goi y ca nhan hoa thanh cong', products);
  } catch (error) {
    return next(error);
  }
}

export async function recentlyViewedProducts(req, res, next) {
  try {
    const products = await getRecentlyViewedProductList({
      userId: req.user?.id || null,
      viewToken: getViewTokenFromRequest(req),
      limit: req.query.limit || 12,
    });
    return successResponse(res, 'Lay san pham da xem thanh cong', products);
  } catch (error) {
    return next(error);
  }
}

export async function recordView(req, res, next) {
  try {
    const productId = parsePositiveId(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID san pham khong hop le');

    const result = await recordProductView({
      productId,
      userId: req.user?.id || null,
      viewToken: getViewTokenFromRequest(req),
    });
    return successResponse(res, 'Ghi nhan san pham da xem thanh cong', result, result.recorded ? 201 : 200);
  } catch (error) {
    return next(error);
  }
}
