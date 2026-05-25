import { successResponse, errorResponse } from '../utils/response.js';
import {
  listUsersEnhanced,
  getUserById,
  updateUserByAdmin,
  softDeleteUser,
  findUserByEmail,
} from '../models/userModel.js';
import { userUpdateSchema } from '../modules/admin/admin.validation.js';
import { auditLog } from '../config/logger.js';

export async function listAdminUsers(req, res) {
  try {
    const { page, pageSize, search, role, status } = req.query;
    const data = await listUsersEnhanced({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      search: search || null,
      role: role || null,
      status: status || null,
    });
    return successResponse(res, 'Lấy danh sách người dùng thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách người dùng', { message: err.message });
  }
}

export async function userDetail(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) return errorResponse(res, 400, 'ID người dùng không hợp lệ');

    const user = await getUserById(userId);
    if (!user) return errorResponse(res, 404, 'Không tìm thấy người dùng');

    return successResponse(res, 'Lấy thông tin người dùng thành công', user);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy thông tin người dùng', { message: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) return errorResponse(res, 400, 'ID người dùng không hợp lệ');

    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }

    // Validate email uniqueness if changing email
    if (parsed.data.email) {
      const existing = await findUserByEmail(parsed.data.email);
      if (existing && Number(existing.id) !== userId) {
        return errorResponse(res, 409, 'Email đã được sử dụng bởi người dùng khác');
      }
    }

    const result = await updateUserByAdmin(userId, parsed.data);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy người dùng');

    auditLog('USER_UPDATE', req.user?.id, { targetUserId: userId, changes: parsed.data });
    return successResponse(res, 'Cập nhật người dùng thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật người dùng', { message: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) return errorResponse(res, 400, 'ID người dùng không hợp lệ');

    // Prevent self-deletion
    if (req.user?.id === userId) {
      return errorResponse(res, 400, 'Không thể vô hiệu hóa chính tài khoản của bạn');
    }

    const result = await softDeleteUser(userId);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy người dùng');
    if (result.code) return errorResponse(res, result.code, result.message);

    auditLog('USER_DISABLE', req.user?.id, { targetUserId: userId });
    return successResponse(res, 'Vô hiệu hóa người dùng thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi vô hiệu hóa người dùng', { message: err.message });
  }
}
