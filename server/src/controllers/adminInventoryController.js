import { successResponse, errorResponse } from '../utils/response.js';
import {
  listInventory,
  getLowStockAlerts,
  adjustStock,
  getTransactionHistory,
} from '../models/adminInventoryModel.js';
import { stockAdjustmentSchema } from '../modules/admin/admin.validation.js';
import { auditLog } from '../config/logger.js';

export async function list(req, res) {
  try {
    const { page, pageSize, lowStock, categoryId } = req.query;
    const data = await listInventory({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      lowStock: lowStock === 'true',
      categoryId: categoryId ? Number(categoryId) : null,
    });
    return successResponse(res, 'Lấy danh sách tồn kho thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách tồn kho', { message: err.message });
  }
}

export async function alerts(req, res) {
  try {
    const data = await getLowStockAlerts();
    return successResponse(res, 'Lấy cảnh báo tồn kho thấp thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy cảnh báo tồn kho', { message: err.message });
  }
}

export async function adjust(req, res) {
  try {
    const parsed = stockAdjustmentSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }

    const result = await adjustStock({
      ...parsed.data,
      userId: req.user?.id,
    });

    if (result.error) {
      return errorResponse(res, result.error.status, result.error.message);
    }

    auditLog('STOCK_ADJUST', req.user?.id, parsed.data);
    return successResponse(res, 'Điều chỉnh tồn kho thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi điều chỉnh tồn kho', { message: err.message });
  }
}

export async function transactions(req, res) {
  try {
    const { page, pageSize, productId } = req.query;
    const data = await getTransactionHistory({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      productId: productId ? Number(productId) : null,
    });
    return successResponse(res, 'Lấy lịch sử giao dịch thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy lịch sử giao dịch', { message: err.message });
  }
}
