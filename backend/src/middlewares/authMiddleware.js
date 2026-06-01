import { verifyToken } from '../jwt.js';
import { errorResponse } from '../utils/response.js';
import { getPermissionsForRole, hasPermission, hasRole } from '../modules/auth/rbac.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return errorResponse(res, 401, 'Vui lòng đăng nhập để tiếp tục');
  }

  try {
    const payload = verifyToken(token);
    if (payload.tokenType && payload.tokenType !== 'access') {
      return errorResponse(res, 401, 'Token không hợp lệ');
    }
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : getPermissionsForRole(payload.role),
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
    if (payload.tokenType && payload.tokenType !== 'access') return next();
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : getPermissionsForRole(payload.role),
    };
  } catch {
    // Ignore invalid optional token and treat as guest
  }
  return next();
};

authMiddleware.requireRoles = function requireRoles(roles = []) {
  return function roleGuard(req, res, next) {
    if (!req.user) return errorResponse(res, 401, 'Vui lòng đăng nhập để tiếp tục');
    if (!hasRole(req.user, roles)) return errorResponse(res, 403, 'Không có quyền truy cập');
    return next();
  };
};

authMiddleware.requirePermissions = function requirePermissions(permissions = []) {
  return function permissionGuard(req, res, next) {
    if (!req.user) return errorResponse(res, 401, 'Vui lòng đăng nhập để tiếp tục');
    const allowed = permissions.every((permission) => hasPermission(req.user, permission));
    if (!allowed) return errorResponse(res, 403, 'Không có quyền truy cập');
    return next();
  };
};
