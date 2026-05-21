import { errorResponse, successResponse } from '../utils/response.js';
import { addToCart, clearCart, getCart, removeCartItem, updateCartItem } from '../models/cartModel.js';

function getScope(req) {
  if (req.user?.id) {
    return { type: 'user', key: req.user.id };
  }

  const cartToken = String(req.headers['x-cart-token'] || req.body?.cartToken || req.query?.cartToken || '').trim();
  return cartToken ? { type: 'guest', key: cartToken } : null;
}

export async function listCart(req, res) {
  const scope = getScope(req);
  if (!scope) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
  }

  const cart = await getCart(scope);
  return successResponse(res, 'Lấy giỏ hàng thành công', cart);
}

export async function addCart(req, res) {
  const scope = getScope(req);
  if (!scope) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
  }

  const productId = Number(req.body?.productId);
  const quantity = req.body?.quantity ?? 1;
  if (!productId) {
    return errorResponse(res, 400, 'productId không hợp lệ');
  }

  const result = await addToCart(scope, productId, quantity);
  if (result.code) {
    return errorResponse(res, result.code, result.message);
  }
  return successResponse(res, 'Thêm vào giỏ hàng thành công', result);
}

export async function updateCart(req, res) {
  const scope = getScope(req);
  if (!scope) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
  }

  const productId = Number(req.body?.productId);
  const quantity = req.body?.quantity;
  if (!productId) {
    return errorResponse(res, 400, 'productId không hợp lệ');
  }

  const result = await updateCartItem(scope, productId, quantity);
  if (result.code) {
    return errorResponse(res, result.code, result.message);
  }
  return successResponse(res, 'Cập nhật giỏ hàng thành công', result);
}

export async function removeCart(req, res) {
  const scope = getScope(req);
  if (!scope) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
  }

  const productId = Number(req.params.productId);
  if (!productId) {
    return errorResponse(res, 400, 'productId không hợp lệ');
  }

  const result = await removeCartItem(scope, productId);
  return successResponse(res, 'Xóa sản phẩm khỏi giỏ hàng thành công', result);
}

export async function clearCartController(req, res) {
  const scope = getScope(req);
  if (!scope) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
  }

  const result = await clearCart(scope);
  return successResponse(res, 'Xóa toàn bộ giỏ hàng thành công', result);
}
