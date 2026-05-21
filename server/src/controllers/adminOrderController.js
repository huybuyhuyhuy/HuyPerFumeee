import { errorResponse, successResponse } from '../utils/response.js';
import { getAdminOrderById, listAdminOrders, updateAdminOrderStatus } from '../models/adminOrderModel.js';

export async function listOrders(req, res) {
  if (!req.user?.id) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
  }

  const page = req.query.page || 1;
  const pageSize = req.query.pageSize || 10;
  const userId = req.query.userId || null;
  const data = await listAdminOrders({ page, pageSize, userId });
  return successResponse(res, 'Lấy danh sách đơn hàng thành công', data);
}

export async function orderDetail(req, res) {
  if (!req.user?.id) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
  }

  const orderId = Number(req.params.id);
  if (!orderId) {
    return errorResponse(res, 400, 'ID đơn hàng không hợp lệ');
  }

  const order = await getAdminOrderById(orderId);
  if (!order) {
    return errorResponse(res, 404, 'Không tìm thấy đơn hàng');
  }

  return successResponse(res, 'Lấy chi tiết đơn hàng thành công', order);
}

export async function changeStatus(req, res) {
  if (!req.user?.id) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
  }

  const orderId = Number(req.params.id);
  const status = String(req.body?.status || '').trim();
  if (!orderId || !status) {
    return errorResponse(res, 400, 'Dữ liệu cập nhật không hợp lệ');
  }

  const result = await updateAdminOrderStatus(orderId, status);
  return successResponse(res, 'Cập nhật trạng thái đơn hàng thành công', result);
}
