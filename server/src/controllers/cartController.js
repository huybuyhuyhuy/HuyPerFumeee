import { errorResponse, successResponse } from '../utils/response.js';
import {
  addToCart,
  clearCart,
  getCart,
  mergeGuestCartToUser,
  removeCartItem,
  updateCartItem,
} from '../models/cartModel.js';

function getScope(req) {
  if (req.user?.id) {
    return { type: 'user', key: req.user.id };
  }

  const cartToken = String(req.headers['x-cart-token'] || req.body?.cartToken || req.query?.cartToken || '').trim();
  return cartToken ? { type: 'guest', key: cartToken } : null;
}

function publicCartResponse(cart) {
  return {
    items: Array.isArray(cart?.items) ? cart.items : [],
    total: Number(cart?.total || 0),
    itemCount: Number(cart?.itemCount || 0),
  };
}

export async function listCart(req, res) {
  try {
    const scope = getScope(req);
    if (!scope) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
    }

    const cart = await getCart(scope);
    return successResponse(res, 'Lấy giỏ hàng thành công', publicCartResponse(cart));
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Không lấy được giỏ hàng');
  }
}

export async function addCart(req, res) {
  try {
    const scope = getScope(req);
    if (!scope) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
    }

    const productId = Number(req.body?.productId);
    const quantity = req.body?.quantity ?? 1;
    const variantId = req.body?.variantId ?? req.body?.productVariantId ?? null;
    if (!productId) {
      return errorResponse(res, 400, 'productId không hợp lệ');
    }

    const result = await addToCart(scope, productId, quantity, variantId);
    if (result.code) {
      return errorResponse(res, result.code, result.message);
    }
    return successResponse(res, 'Thêm vào giỏ hàng thành công', publicCartResponse(result));
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Không thêm được sản phẩm vào giỏ hàng');
  }
}

export async function updateCart(req, res) {
  try {
    const scope = getScope(req);
    if (!scope) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
    }

    const productId = Number(req.body?.productId);
    const quantity = req.body?.quantity;
    const variantId = req.body?.variantId ?? req.body?.productVariantId ?? null;
    if (!productId) {
      return errorResponse(res, 400, 'productId không hợp lệ');
    }

    const result = await updateCartItem(scope, productId, quantity, variantId);
    if (result.code) {
      return errorResponse(res, result.code, result.message);
    }
    return successResponse(res, 'Cập nhật giỏ hàng thành công', publicCartResponse(result));
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Không cập nhật được giỏ hàng');
  }
}

export async function removeCart(req, res) {
  try {
    const scope = getScope(req);
    if (!scope) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
    }

    const productId = Number(req.params.productId);
    if (!productId) {
      return errorResponse(res, 400, 'productId không hợp lệ');
    }

    const variantId = req.query?.variantId ?? req.body?.variantId ?? null;
    const result = await removeCartItem(scope, productId, variantId);
    return successResponse(res, 'Xóa sản phẩm khỏi giỏ hàng thành công', publicCartResponse(result));
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Không xóa được sản phẩm khỏi giỏ hàng');
  }
}

export async function clearCartController(req, res) {
  try {
    const scope = getScope(req);
    if (!scope) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập hoặc gửi cartToken cho khách vãng lai');
    }

    const result = await clearCart(scope);
    return successResponse(res, 'Xóa toàn bộ giỏ hàng thành công', publicCartResponse(result));
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Không xóa được giỏ hàng');
  }
}

export async function mergeCart(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập để đồng bộ giỏ hàng');
    }

    const cartToken = String(req.headers['x-cart-token'] || req.body?.cartToken || '').trim();
    const result = await mergeGuestCartToUser(userId, cartToken);
    if (result.code) {
      return errorResponse(res, result.code, result.message);
    }
    return successResponse(res, 'Đồng bộ giỏ hàng thành công', publicCartResponse(result));
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Không đồng bộ được giỏ hàng');
  }
}
