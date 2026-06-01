import { query } from '../config/database.js';
import { ensureAdminAuditLogTable } from './adminAuditStorage.js';

function safeJson(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string') return value.slice(0, 4000);
  try {
    return JSON.stringify(value).slice(0, 4000);
  } catch {
    return String(value).slice(0, 4000);
  }
}

export async function writeAdminAuditLog({ adminId = null, action, targetType = null, targetId = null, oldValue = null, newValue = null, ipAddress = null, userAgent = null }) {
  try {
    await ensureAdminAuditLogTable();
    await query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, old_value, new_value, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE())`,
      [
        adminId,
        action,
        targetType,
        targetId,
        safeJson(oldValue),
        safeJson(newValue),
        ipAddress,
        userAgent,
      ]
    );
  } catch {
    // Never block primary action
  }
}

export function buildAuditContext(req) {
  return {
    adminId: req?.user?.id || null,
    ipAddress: req?.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim() || req?.ip || null,
    userAgent: req?.headers?.['user-agent'] || null,
  };
}
