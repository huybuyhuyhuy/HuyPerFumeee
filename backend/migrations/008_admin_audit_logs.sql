IF OBJECT_ID('dbo.admin_audit_logs', 'U') IS NULL
BEGIN
  CREATE TABLE admin_audit_logs (
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
END;
GO
