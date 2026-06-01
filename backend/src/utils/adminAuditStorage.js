import { query } from '../config/database.js';

let auditLogTableReadyPromise = null;

export async function ensureAdminAuditLogTable() {
  if (!auditLogTableReadyPromise) {
    auditLogTableReadyPromise = query(`
      IF OBJECT_ID(N'dbo.admin_audit_logs', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.admin_audit_logs (
          id INT IDENTITY PRIMARY KEY,
          admin_id INT NULL,
          action NVARCHAR(100) NOT NULL,
          target_type NVARCHAR(100) NULL,
          target_id INT NULL,
          old_value NVARCHAR(MAX) NULL,
          new_value NVARCHAR(MAX) NULL,
          ip_address NVARCHAR(100) NULL,
          user_agent NVARCHAR(500) NULL,
          created_at DATETIME NOT NULL CONSTRAINT DF_admin_audit_logs_created_at DEFAULT GETDATE()
        );
      END

      IF COL_LENGTH(N'dbo.admin_audit_logs', N'admin_id') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD admin_id INT NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'action') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD action NVARCHAR(100) NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'target_type') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD target_type NVARCHAR(100) NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'target_id') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD target_id INT NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'old_value') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD old_value NVARCHAR(MAX) NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'new_value') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD new_value NVARCHAR(MAX) NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'ip_address') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD ip_address NVARCHAR(100) NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'user_agent') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD user_agent NVARCHAR(500) NULL;
      IF COL_LENGTH(N'dbo.admin_audit_logs', N'created_at') IS NULL
        ALTER TABLE dbo.admin_audit_logs ADD created_at DATETIME NOT NULL CONSTRAINT DF_admin_audit_logs_created_at_late DEFAULT GETDATE();
    `);
  }
  return auditLogTableReadyPromise;
}
