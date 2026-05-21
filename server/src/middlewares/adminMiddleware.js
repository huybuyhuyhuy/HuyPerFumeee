import { verifyToken } from '../jwt.js';
import { errorResponse } from '../utils/response.js';

export function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
  }

  try {
    const payload = verifyToken(token);
    const role = String(payload?.role || '').toLowerCase();

    if (role !== 'admin') {
      return errorResponse(res, 403, 'Không có quyền truy cập');
    }

    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return errorResponse(res, 401, 'Token không hợp lệ hoặc đã hết hạn');
  }
}
