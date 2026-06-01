export const ROLES = {
  USER: 'USER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
};

export const PERMISSIONS = {
  PROFILE_READ: 'profile:read',
  PROFILE_WRITE: 'profile:write',
  ADDRESS_MANAGE: 'address:manage',
  ORDER_READ_OWN: 'order:read:own',
  ADMIN_ACCESS: 'admin:access',
  PRODUCT_MANAGE: 'product:manage',
  ORDER_MANAGE: 'order:manage',
  USER_MANAGE: 'user:manage',
};

const rolePermissions = {
  [ROLES.USER]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.ADDRESS_MANAGE,
    PERMISSIONS.ORDER_READ_OWN,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.ADDRESS_MANAGE,
    PERMISSIONS.ORDER_READ_OWN,
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.PRODUCT_MANAGE,
    PERMISSIONS.ORDER_MANAGE,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

export function normalizeRole(role) {
  const normalized = String(role || ROLES.USER).trim().toUpperCase();
  return Object.values(ROLES).includes(normalized) ? normalized : ROLES.USER;
}

export function getPermissionsForRole(role) {
  return rolePermissions[normalizeRole(role)] || rolePermissions[ROLES.USER];
}

export function hasPermission(user, permission) {
  if (!user) return false;
  const permissions = Array.isArray(user.permissions) && user.permissions.length > 0
    ? user.permissions
    : getPermissionsForRole(user.role);
  return permissions.includes(permission);
}

export function hasRole(user, roles = []) {
  return roles.map(normalizeRole).includes(normalizeRole(user?.role));
}
