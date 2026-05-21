import { errorResponse, successResponse } from '../utils/response.js';
import { getDashboardStats } from '../models/adminDashboardModel.js';

export async function stats(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
  }

  const data = await getDashboardStats();
  return successResponse(res, 'Lấy thống kê dashboard thành công', data);
}
