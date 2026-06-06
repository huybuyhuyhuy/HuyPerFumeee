import { successResponse, errorResponse } from '../utils/response.js';
import { getAuthStorageCapabilities } from '../modules/auth/auth.storage.js';
import {
  listUsersEnhanced,
  getUserById,
  updateUserByAdmin,
  softDeleteUser,
  findUserByEmail,
} from '../models/userModel.js';
import { userUpdateSchema } from '../modules/admin/admin.validation.js';
import { auditLog } from '../config/logger.js';
import { buildAuditContext, writeAdminAuditLog } from '../utils/adminAuditLogger.js';

function canManageUserStatus(user, targetUserId) {
  return Number(user?.id) !== Number(targetUserId);
}

async function getAdminCount() {
  const { userColumns } = await getAuthStorageCapabilities();
  if (!userColumns.has('role')) return 0;
  const rows = await (await import('../config/database.js')).query(
    `SELECT COUNT(*) AS total
     FROM users
     WHERE UPPER(role) = 'ADMIN'`
  );
  return Number(rows[0]?.total || 0);
}

export async function listAdminUsers(req, res) {
  try {
    const { page, pageSize, search, role, status, membershipTier } = req.query;
    const data = await listUsersEnhanced({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      search: search || null,
      role: role || null,
      status: status || null,
      membershipTier: membershipTier || null,
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
    const data = await getUserById(userId);
    if (!data) return errorResponse(res, 404, 'Không tìm thấy người dùng');
    return successResponse(res, 'Lấy thông tin người dùng thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy thông tin người dùng', { message: err.message });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const nextStatus = String(req.body?.status || '').trim().toUpperCase();
    if (!userId) return errorResponse(res, 400, 'ID người dùng không hợp lệ');
    if (!canManageUserStatus(req.user, userId)) return errorResponse(res, 400, 'Không thể khóa chính tài khoản của bạn');
    if (!['ACTIVE', 'LOCKED'].includes(nextStatus)) return errorResponse(res, 400, 'Trạng thái không hợp lệ');
    const result = await updateUserByAdmin(userId, { status: nextStatus });
    if (!result) return errorResponse(res, 404, 'Không tìm thấy người dùng');
    const auditContext = buildAuditContext(req);
    auditLog('USER_STATUS_UPDATE', req.user?.id, { targetUserId: userId, status: nextStatus });
    writeAdminAuditLog({ ...auditContext, action: 'USER_STATUS_UPDATE', targetType: 'user', targetId: userId, newValue: { status: nextStatus } });
    return successResponse(res, 'Cập nhật trạng thái người dùng thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật trạng thái người dùng', { message: err.message });
  }
}

export async function updateUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) return errorResponse(res, 400, 'ID người dùng không hợp lệ');
    const nextRole = String(req.body?.role || '').trim().toUpperCase();
    if (!['USER', 'STAFF', 'ADMIN'].includes(nextRole)) return errorResponse(res, 400, 'Vai trò không hợp lệ');
    if (Number(req.user?.id) === userId && nextRole !== 'ADMIN') {
      const adminCount = await getAdminCount();
      if (adminCount <= 1) return errorResponse(res, 400, 'Không thể tự hạ role khi là admin cuối cùng');
    }
    const result = await updateUserByAdmin(userId, { role: nextRole });
    if (!result) return errorResponse(res, 404, 'Không tìm thấy người dùng');
    const auditContext = buildAuditContext(req);
    auditLog('USER_ROLE_UPDATE', req.user?.id, { targetUserId: userId, role: nextRole });
    writeAdminAuditLog({ ...auditContext, action: 'USER_ROLE_UPDATE', targetType: 'user', targetId: userId, newValue: { role: nextRole } });
    return successResponse(res, 'Cập nhật vai trò người dùng thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật vai trò người dùng', { message: err.message });
  }
}

export async function updateUserNote(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) return errorResponse(res, 400, 'ID người dùng không hợp lệ');
    const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : null;
    const result = await updateUserByAdmin(userId, { note });
    if (!result) return errorResponse(res, 404, 'Không tìm thấy người dùng');
    auditLog('USER_NOTE_UPDATE', req.user?.id, { targetUserId: userId });
    return successResponse(res, 'Cập nhật ghi chú người dùng thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật ghi chú người dùng', { message: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!userId) return errorResponse(res, 400, 'ID người dùng không hợp lệ');
    if (req.user?.id === userId) return errorResponse(res, 400, 'Không thể vô hiệu hóa chính tài khoản của bạn');
    const result = await softDeleteUser(userId);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy người dùng');
    if (result.code) return errorResponse(res, result.code, result.message);
    auditLog('USER_DISABLE', req.user?.id, { targetUserId: userId });
    return successResponse(res, 'Vô hiệu hóa người dùng thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi vô hiệu hóa người dùng', { message: err.message });
  }
}
