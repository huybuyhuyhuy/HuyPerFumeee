import { successResponse } from '../utils/response.js';
import { listUsers } from '../models/userModel.js';

export async function listAdminUsers(_req, res) {
  const users = await listUsers();
  return successResponse(res, 'Lấy danh sách người dùng thành công', users);
}
