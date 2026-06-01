IF COL_LENGTH('users', 'status') IS NULL
BEGIN
  ALTER TABLE users
  ADD status NVARCHAR(30) NOT NULL CONSTRAINT DF_users_status DEFAULT 'ACTIVE';
END;
GO

IF COL_LENGTH('users', 'note') IS NULL
BEGIN
  ALTER TABLE users
  ADD note NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('users', 'last_login_at') IS NULL
BEGIN
  ALTER TABLE users
  ADD last_login_at DATETIME NULL;
END;
GO
