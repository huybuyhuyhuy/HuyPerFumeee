import { errorResponse, successResponse } from '../utils/response.js';
import { getAdminOrderAnalytics, getAdminOrderById, listAdminOrders, updateAdminOrderStatus } from '../models/adminOrderModel.js';
import { auditLog } from '../config/logger.js';

const ALLOWED_ORDER_STATUSES = new Set(['Waiting', 'Paid', 'Processing', 'Delivered', 'Completed', 'Cancelled', 'refunded']);

export async function listOrders(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
    }

    const { page, pageSize, userId, status, paymentMethod, dateFrom, dateTo, search } = req.query;
    const data = await listAdminOrders({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      userId: userId || null,
      status: status || null,
      paymentMethod: paymentMethod || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      search: search || null,
    });
    return successResponse(res, 'Lấy danh sách đơn hàng thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách đơn hàng', { message: err.message });
  }
}

export async function orderAnalytics(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
    }

    const { userId, status, paymentMethod, dateFrom, dateTo, search } = req.query;
    const data = await getAdminOrderAnalytics({
      userId: userId || null,
      status: status || null,
      paymentMethod: paymentMethod || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      search: search || null,
    });
    return successResponse(res, 'Lấy phân tích đơn hàng thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy phân tích đơn hàng', { message: err.message });
  }
}

export async function orderDetail(req, res) {
  try {
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
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy chi tiết đơn hàng', { message: err.message });
  }
}

export async function changeStatus(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
    }

    const orderId = Number(req.params.id);
    const status = String(req.body?.status || '').trim();
    if (!orderId || !status) {
      return errorResponse(res, 400, 'Dữ liệu cập nhật không hợp lệ');
    }
    if (!ALLOWED_ORDER_STATUSES.has(status)) {
      return errorResponse(res, 400, 'Trạng thái đơn hàng không hợp lệ');
    }

    const result = await updateAdminOrderStatus(orderId, status);
    if (result.code) {
      return errorResponse(res, result.code, result.message);
    }

    auditLog('ORDER_STATUS_CHANGE', req.user?.id, { orderId, newStatus: status });
    return successResponse(res, 'Cập nhật trạng thái đơn hàng thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật trạng thái đơn hàng', { message: err.message });
  }
}
