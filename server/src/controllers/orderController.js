import { authMiddleware } from '../middlewares/authMiddleware.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { cancelOrder, checkoutOrder, getOrderByIdForUser, listOrderHistory } from '../models/orderModel.js';

function validateCheckout(body) {
  const errors = {};
  const shippingAddress = String(body.address || body.shippingAddress || '').trim();
  const phone = String(body.phone || '').trim();
  const paymentMethod = String(body.paymentMethod || '').trim().toUpperCase();

  if (!shippingAddress) errors.address = 'Địa chỉ giao hàng không được để trống';
  if (!/^\d{10}$/.test(phone)) errors.phone = 'Số điện thoại phải có 10 chữ số';
  if (!['COD', 'VNPAY', 'BANKING', 'MOMO', 'ZALOPAY'].includes(paymentMethod)) {
    errors.paymentMethod = 'Phương thức thanh toán không hợp lệ';
  }

  return { errors, data: { shippingAddress, phone, paymentMethod } };
}

export async function checkout(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để checkout');
  }

  const { errors, data } = validateCheckout(req.body || {});
  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Dữ liệu không hợp lệ', errors);
  }

  const result = await checkoutOrder({
    userId,
    shippingAddress: data.shippingAddress,
    phone: data.phone,
    paymentMethod: data.paymentMethod,
  });

  if (result.code) {
    return errorResponse(res, result.code, result.message);
  }

  return successResponse(res, 'Đặt hàng thành công', result.order);
}

export async function history(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để xem lịch sử mua hàng');
  }

  const orders = await listOrderHistory(userId);
  return successResponse(res, 'Lấy lịch sử mua hàng thành công', orders);
}

export async function detail(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để xem đơn hàng');
  }

  const orderId = Number(req.params.id);
  if (!orderId) {
    return errorResponse(res, 400, 'ID đơn hàng không hợp lệ');
  }

  const order = await getOrderByIdForUser(orderId, userId);
  if (!order) {
    return errorResponse(res, 404, 'Không tìm thấy đơn hàng');
  }

  return successResponse(res, 'Lấy chi tiết đơn hàng thành công', order);
}

export async function cancel(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để hủy đơn');
  }

  const orderId = Number(req.params.id);
  if (!orderId) {
    return errorResponse(res, 400, 'ID đơn hàng không hợp lệ');
  }

  const result = await cancelOrder(userId, orderId);
  if (result.code) {
    return errorResponse(res, result.code, result.message);
  }

  return successResponse(res, 'Hủy đơn hàng thành công', {});
}
