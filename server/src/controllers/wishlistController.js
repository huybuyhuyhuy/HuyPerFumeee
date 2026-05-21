import { errorResponse, successResponse } from '../utils/response.js';
import { addWishlistItem, listWishlist, removeWishlistItem } from '../models/wishlistModel.js';
import { getProductById } from '../models/productModel.js';

export async function getWishlist(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để xem wishlist');
  }

  const items = await listWishlist(userId);
  return successResponse(res, 'Lấy wishlist thành công', items);
}

export async function addToWishlist(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để thêm wishlist');
  }

  const productId = Number(req.params.productId);
  if (!productId) {
    return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');
  }

  const product = await getProductById(productId);
  if (!product) {
    return errorResponse(res, 404, 'Không tìm thấy sản phẩm');
  }

  const result = await addWishlistItem(userId, productId);
  return successResponse(
    res,
    result.alreadyExists ? 'Sản phẩm đã có trong wishlist' : 'Thêm vào wishlist thành công',
    result.items,
    result.alreadyExists ? 200 : 201
  );
}

export async function deleteFromWishlist(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để xóa wishlist');
  }

  const productId = Number(req.params.productId);
  if (!productId) {
    return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');
  }

  const result = await removeWishlistItem(userId, productId);
  return successResponse(res, 'Xóa khỏi wishlist thành công', { removed: result.deletedCount > 0 });
}
