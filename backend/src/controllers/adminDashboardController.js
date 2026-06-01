import { errorResponse, successResponse } from '../utils/response.js';
import { getStats, getSummary, getCharts } from '../modules/admin/dashboard.service.js';
import { dashboardSummaryQuerySchema, dashboardChartQuerySchema } from '../modules/admin/admin.validation.js';

export async function stats(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
    }

    const data = await getStats();
    return successResponse(res, 'Lấy thống kê dashboard thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy thống kê dashboard', { message: err.message });
  }
}

export async function summary(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
    }

    const parsed = dashboardSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return errorResponse(res, 400, 'Tham số không hợp lệ', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await getSummary(parsed.data);
    return successResponse(res, 'Lấy dữ liệu dashboard thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy dữ liệu dashboard', { message: err.message });
  }
}

export async function charts(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
    }

    const parsed = dashboardChartQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return errorResponse(res, 400, 'Tham số không hợp lệ', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await getCharts(parsed.data);
    return successResponse(res, 'Lấy dữ liệu biểu đồ thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy dữ liệu biểu đồ', { message: err.message });
  }
}
