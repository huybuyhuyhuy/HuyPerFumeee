-- Phase 1: persist carts in SQL Server for authenticated and guest customers.
-- This migration is additive and also upgrades the earlier user-only cart schema.

IF OBJECT_ID(N'dbo.carts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.carts (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NULL,
        cart_token NVARCHAR(120) NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_carts_status DEFAULT N'ACTIVE',
        created_at DATETIME NOT NULL CONSTRAINT DF_carts_created_at DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL CONSTRAINT DF_carts_updated_at DEFAULT GETDATE(),
        CONSTRAINT FK_carts_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT CK_carts_owner CHECK (user_id IS NOT NULL OR cart_token IS NOT NULL),
        CONSTRAINT CK_carts_status CHECK (status IN (N'ACTIVE', N'CHECKED_OUT', N'ABANDONED'))
    );
END;
GO

IF COL_LENGTH('dbo.carts', 'cart_token') IS NULL
BEGIN
    ALTER TABLE dbo.carts ADD cart_token NVARCHAR(120) NULL;
END;
GO

IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME = 'carts'
      AND COLUMN_NAME = 'user_id'
      AND IS_NULLABLE = 'NO'
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.key_constraints
        WHERE name = N'uq_carts_user' AND parent_object_id = OBJECT_ID(N'dbo.carts')
    )
    BEGIN
        ALTER TABLE dbo.carts DROP CONSTRAINT uq_carts_user;
    END
    ELSE IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'uq_carts_user' AND object_id = OBJECT_ID(N'dbo.carts')
    )
    BEGIN
        DROP INDEX uq_carts_user ON dbo.carts;
    END;

    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'UX_carts_active_user' AND object_id = OBJECT_ID(N'dbo.carts')
    )
    BEGIN
        DROP INDEX UX_carts_active_user ON dbo.carts;
    END;

    ALTER TABLE dbo.carts ALTER COLUMN user_id INT NULL;
END;
GO

IF COL_LENGTH('dbo.carts', 'status') IS NULL
BEGIN
    ALTER TABLE dbo.carts
    ADD status NVARCHAR(30) NOT NULL
        CONSTRAINT DF_carts_status_phase1 DEFAULT N'ACTIVE' WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.carts', 'created_at') IS NULL
BEGIN
    ALTER TABLE dbo.carts
    ADD created_at DATETIME NOT NULL
        CONSTRAINT DF_carts_created_at_phase1 DEFAULT GETDATE() WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.carts', 'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.carts
    ADD updated_at DATETIME NOT NULL
        CONSTRAINT DF_carts_updated_at_phase1 DEFAULT GETDATE() WITH VALUES;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_carts_owner' AND parent_object_id = OBJECT_ID(N'dbo.carts')
)
BEGIN
    ALTER TABLE dbo.carts WITH CHECK
    ADD CONSTRAINT CK_carts_owner CHECK (user_id IS NOT NULL OR cart_token IS NOT NULL);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_carts_status' AND parent_object_id = OBJECT_ID(N'dbo.carts')
)
BEGIN
    ALTER TABLE dbo.carts WITH CHECK
    ADD CONSTRAINT CK_carts_status CHECK (status IN (N'ACTIVE', N'CHECKED_OUT', N'ABANDONED'));
END;
GO

-- Replace user-only uniqueness with one active cart per user.
IF EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE name = N'uq_carts_user' AND parent_object_id = OBJECT_ID(N'dbo.carts')
)
BEGIN
    ALTER TABLE dbo.carts DROP CONSTRAINT uq_carts_user;
END
ELSE IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'uq_carts_user' AND object_id = OBJECT_ID(N'dbo.carts')
)
BEGIN
    DROP INDEX uq_carts_user ON dbo.carts;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_carts_active_user' AND object_id = OBJECT_ID(N'dbo.carts')
)
BEGIN
    CREATE UNIQUE INDEX UX_carts_active_user
    ON dbo.carts(user_id)
    WHERE user_id IS NOT NULL AND status = N'ACTIVE';
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_carts_active_token' AND object_id = OBJECT_ID(N'dbo.carts')
)
BEGIN
    CREATE UNIQUE INDEX UX_carts_active_token
    ON dbo.carts(cart_token)
    WHERE cart_token IS NOT NULL AND status = N'ACTIVE';
END;
GO

IF OBJECT_ID(N'dbo.cart_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cart_items (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        product_variant_id INT NULL,
        quantity INT NOT NULL,
        unit_price FLOAT NULL,
        created_at DATETIME NOT NULL CONSTRAINT DF_cart_items_created_at DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL CONSTRAINT DF_cart_items_updated_at DEFAULT GETDATE(),
        variant_key AS ISNULL(product_variant_id, 0) PERSISTED,
        CONSTRAINT FK_cart_items_carts FOREIGN KEY (cart_id) REFERENCES dbo.carts(id) ON DELETE CASCADE,
        CONSTRAINT FK_cart_items_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT CK_cart_items_quantity CHECK (quantity > 0)
    );
END;
GO

IF COL_LENGTH('dbo.cart_items', 'product_variant_id') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items ADD product_variant_id INT NULL;
END;
GO

IF COL_LENGTH('dbo.cart_items', 'unit_price') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items ADD unit_price FLOAT NULL;
END;
GO

IF COL_LENGTH('dbo.cart_items', 'created_at') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items
    ADD created_at DATETIME NOT NULL
        CONSTRAINT DF_cart_items_created_at_phase1 DEFAULT GETDATE() WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.cart_items', 'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items
    ADD updated_at DATETIME NOT NULL
        CONSTRAINT DF_cart_items_updated_at_phase1 DEFAULT GETDATE() WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.cart_items', 'variant_key') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items
    ADD variant_key AS ISNULL(product_variant_id, 0) PERSISTED;
END;
GO

-- Replace product-only uniqueness so full/decant variants can coexist.
IF EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE name = N'uq_cart_items_cart_product' AND parent_object_id = OBJECT_ID(N'dbo.cart_items')
)
BEGIN
    ALTER TABLE dbo.cart_items DROP CONSTRAINT uq_cart_items_cart_product;
END
ELSE IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'uq_cart_items_cart_product' AND object_id = OBJECT_ID(N'dbo.cart_items')
)
BEGIN
    DROP INDEX uq_cart_items_cart_product ON dbo.cart_items;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_cart_items_product_variant' AND object_id = OBJECT_ID(N'dbo.cart_items')
)
BEGIN
    CREATE UNIQUE INDEX UX_cart_items_product_variant
    ON dbo.cart_items(cart_id, product_id, variant_key);
END;
GO

IF OBJECT_ID(N'dbo.product_variants', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_cart_items_product_variants'
         AND parent_object_id = OBJECT_ID(N'dbo.cart_items')
   )
BEGIN
    ALTER TABLE dbo.cart_items WITH CHECK
    ADD CONSTRAINT FK_cart_items_product_variants
        FOREIGN KEY (product_variant_id) REFERENCES dbo.product_variants(id);
END;
GO
