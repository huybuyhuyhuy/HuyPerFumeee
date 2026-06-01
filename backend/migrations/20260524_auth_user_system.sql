-- Phase 3: authentication, refresh token rotation, RBAC, profile, addresses.
-- Run after backing up the database.

UPDATE dbo.users
SET role = N'USER'
WHERE role IS NULL OR LTRIM(RTRIM(role)) = N'';
GO

UPDATE dbo.users
SET role = UPPER(role)
WHERE role IS NOT NULL AND role COLLATE Latin1_General_CS_AS <> UPPER(role);
GO

IF COL_LENGTH('dbo.users', 'status') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD status NVARCHAR(30) NOT NULL CONSTRAINT DF_users_status DEFAULT N'ACTIVE';
END;
GO

IF COL_LENGTH('dbo.users', 'email_verified_at') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD email_verified_at DATETIME2 NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'last_login_at') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD last_login_at DATETIME2 NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'password_changed_at') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD password_changed_at DATETIME2 NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'failed_login_count') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD failed_login_count INT NOT NULL CONSTRAINT DF_users_failed_login_count DEFAULT 0;
END;
GO

IF COL_LENGTH('dbo.users', 'locked_until') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD locked_until DATETIME2 NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD updated_at DATETIME2 NULL;
END;
GO

IF COL_LENGTH('dbo.users', 'deleted_at') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD deleted_at DATETIME2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = 'CK_users_role'
)
BEGIN
    ALTER TABLE dbo.users WITH CHECK
    ADD CONSTRAINT CK_users_role CHECK (role IN (N'USER', N'ADMIN', N'STAFF'));
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = 'CK_users_status'
)
BEGIN
    ALTER TABLE dbo.users WITH CHECK
    ADD CONSTRAINT CK_users_status CHECK (status IN (N'ACTIVE', N'PENDING_VERIFICATION', N'LOCKED', N'DISABLED'));
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_users_email_active' AND object_id = OBJECT_ID('dbo.users')
)
BEGIN
    CREATE UNIQUE INDEX UX_users_email_active
    ON dbo.users(email)
    WHERE email IS NOT NULL AND email <> N'' AND deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_users_phone_active' AND object_id = OBJECT_ID('dbo.users')
)
BEGIN
    CREATE UNIQUE INDEX UX_users_phone_active
    ON dbo.users(phone)
    WHERE phone IS NOT NULL AND phone <> N'' AND deleted_at IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.refresh_tokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.refresh_tokens (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        family_id UNIQUEIDENTIFIER NOT NULL,
        issued_jti UNIQUEIDENTIFIER NOT NULL,
        replaced_by_token_id BIGINT NULL,
        user_agent NVARCHAR(500) NULL,
        ip_address NVARCHAR(80) NULL,
        expires_at DATETIME2 NOT NULL,
        revoked_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_refresh_tokens_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_refresh_tokens_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_refresh_tokens_replaced_by FOREIGN KEY (replaced_by_token_id) REFERENCES dbo.refresh_tokens(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_refresh_tokens_hash' AND object_id = OBJECT_ID('dbo.refresh_tokens')
)
BEGIN
    CREATE UNIQUE INDEX UX_refresh_tokens_hash
    ON dbo.refresh_tokens(token_hash);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_refresh_tokens_user_active' AND object_id = OBJECT_ID('dbo.refresh_tokens')
)
BEGIN
    CREATE INDEX IX_refresh_tokens_user_active
    ON dbo.refresh_tokens(user_id, family_id, expires_at)
    INCLUDE (revoked_at, replaced_by_token_id);
END;
GO

IF OBJECT_ID(N'dbo.password_reset_tokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.password_reset_tokens (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_password_reset_tokens_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_password_reset_tokens_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_password_reset_tokens_hash' AND object_id = OBJECT_ID('dbo.password_reset_tokens')
)
BEGIN
    CREATE UNIQUE INDEX UX_password_reset_tokens_hash
    ON dbo.password_reset_tokens(token_hash);
END;
GO

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.email_verification_tokens (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_email_verification_tokens_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_email_verification_tokens_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_email_verification_tokens_hash' AND object_id = OBJECT_ID('dbo.email_verification_tokens')
)
BEGIN
    CREATE UNIQUE INDEX UX_email_verification_tokens_hash
    ON dbo.email_verification_tokens(token_hash);
END;
GO

IF OBJECT_ID(N'dbo.login_attempts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.login_attempts (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        identifier NVARCHAR(250) NOT NULL,
        user_id INT NULL,
        ip_address NVARCHAR(80) NULL,
        user_agent NVARCHAR(500) NULL,
        success BIT NOT NULL,
        failure_reason NVARCHAR(100) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_login_attempts_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_login_attempts_users FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_login_attempts_identifier_time' AND object_id = OBJECT_ID('dbo.login_attempts')
)
BEGIN
    CREATE INDEX IX_login_attempts_identifier_time
    ON dbo.login_attempts(identifier, created_at)
    INCLUDE (success, ip_address, user_id);
END;
GO

IF OBJECT_ID(N'dbo.user_addresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_addresses (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        label NVARCHAR(80) NULL,
        recipient_name NVARCHAR(250) NOT NULL,
        phone NVARCHAR(20) NOT NULL,
        line1 NVARCHAR(500) NOT NULL,
        line2 NVARCHAR(500) NULL,
        ward NVARCHAR(120) NULL,
        district NVARCHAR(120) NULL,
        city NVARCHAR(120) NULL,
        country NVARCHAR(120) NOT NULL CONSTRAINT DF_user_addresses_country DEFAULT N'VN',
        postal_code NVARCHAR(30) NULL,
        is_default BIT NOT NULL CONSTRAINT DF_user_addresses_default DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_user_addresses_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        deleted_at DATETIME2 NULL,
        CONSTRAINT FK_user_addresses_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_user_addresses_user_active' AND object_id = OBJECT_ID('dbo.user_addresses')
)
BEGIN
    CREATE INDEX IX_user_addresses_user_active
    ON dbo.user_addresses(user_id, is_default, id)
    WHERE deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_user_addresses_one_default' AND object_id = OBJECT_ID('dbo.user_addresses')
)
BEGIN
    CREATE UNIQUE INDEX UX_user_addresses_one_default
    ON dbo.user_addresses(user_id)
    WHERE is_default = 1 AND deleted_at IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.social_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.social_accounts (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        provider NVARCHAR(40) NOT NULL,
        provider_user_id NVARCHAR(180) NOT NULL,
        email NVARCHAR(250) NULL,
        display_name NVARCHAR(250) NULL,
        avatar_url NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_social_accounts_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        CONSTRAINT FK_social_accounts_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT CK_social_accounts_provider CHECK (provider IN (N'GOOGLE', N'FACEBOOK', N'APPLE'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_social_accounts_provider_user' AND object_id = OBJECT_ID('dbo.social_accounts')
)
BEGIN
    CREATE UNIQUE INDEX UX_social_accounts_provider_user
    ON dbo.social_accounts(provider, provider_user_id);
END;
GO
