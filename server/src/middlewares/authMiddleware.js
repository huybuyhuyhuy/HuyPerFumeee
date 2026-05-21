import { verifyToken } from '../jwt.js';
import { errorResponse } from '../utils/response.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để tiếp tục');
  }

  try {
    const payload = verifyToken(token);
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

authMiddleware.optional = function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Ignore invalid optional token and treat as guest
  }
  return next();
};
