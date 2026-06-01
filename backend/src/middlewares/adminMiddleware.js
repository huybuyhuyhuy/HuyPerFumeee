import { authMiddleware } from './authMiddleware.js';
import { PERMISSIONS } from '../modules/auth/rbac.js';

export const adminMiddleware = [
  authMiddleware,
  authMiddleware.requirePermissions([PERMISSIONS.ADMIN_ACCESS]),
];
