import { query } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ensureAdminAuditLogTable } from '../utils/adminAuditStorage.js';

export async function listAuditLogs(req, res) {
  try {
    await ensureAdminAuditLogTable();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    if (req.query.action) { conditions.push('al.action = ?'); params.push(req.query.action); }
    if (req.query.adminId) { conditions.push('al.admin_id = ?'); params.push(Number(req.query.adminId)); }
    if (req.query.targetType) { conditions.push('al.target_type = ?'); params.push(req.query.targetType); }
    if (req.query.from) { conditions.push('al.created_at >= ?'); params.push(new Date(req.query.from)); }
    if (req.query.to) { conditions.push('al.created_at < ?'); params.push(new Date(req.query.to)); }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const totalRows = await query(`SELECT COUNT(*) AS total FROM admin_audit_logs al ${whereSql}`, params);
    const total = Number(totalRows[0]?.total || 0);

    const rows = await query(
      `SELECT al.id, al.admin_id, al.action, al.target_type, al.target_id, al.old_value, al.new_value, al.ip_address, al.user_agent, al.created_at,
              u.name AS admin_name, u.email AS admin_email
       FROM admin_audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       ${whereSql}
       ORDER BY al.id DESC
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      [...params, offset, pageSize]
    );

    return successResponse(res, 'Lấy danh sách audit log thành công', {
      content: rows.map((row) => ({
        id: row.id,
        adminId: row.admin_id,
        adminName: row.admin_name,
        adminEmail: row.admin_email,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        oldValue: row.old_value,
        newValue: row.new_value,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      })),
      page,
      size: pageSize,
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      first: page === 1,
      last: page * pageSize >= total,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi lấy audit logs', { message: error.message });
  }
}
