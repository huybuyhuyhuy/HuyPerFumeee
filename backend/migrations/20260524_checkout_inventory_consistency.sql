-- Phase 2: durable cart, checkout reservations, and inventory ledger.
-- Run after 20260524_product_inventory_enterprise.sql and after backing up the database.

IF OBJECT_ID(N'dbo.carts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.carts (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NULL,
        cart_token NVARCHAR(120) NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_carts_status DEFAULT N'ACTIVE',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_carts_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        expires_at DATETIME2 NULL,
        row_version ROWVERSION NOT NULL,
        CONSTRAINT FK_carts_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT CK_carts_owner CHECK (user_id IS NOT NULL OR cart_token IS NOT NULL),
        CONSTRAINT CK_carts_status CHECK (status IN (N'ACTIVE', N'CHECKED_OUT', N'ABANDONED'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_carts_active_user' AND object_id = OBJECT_ID('dbo.carts')
)
BEGIN
    CREATE UNIQUE INDEX UX_carts_active_user
    ON dbo.carts(user_id)
    WHERE user_id IS NOT NULL AND status = N'ACTIVE';
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_carts_active_token' AND object_id = OBJECT_ID('dbo.carts')
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
        created_at DATETIME2 NOT NULL CONSTRAINT DF_cart_items_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        row_version ROWVERSION NOT NULL,
        variant_key AS ISNULL(product_variant_id, 0) PERSISTED,
        CONSTRAINT FK_cart_items_carts FOREIGN KEY (cart_id) REFERENCES dbo.carts(id) ON DELETE CASCADE,
        CONSTRAINT FK_cart_items_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT FK_cart_items_product_variants FOREIGN KEY (product_variant_id) REFERENCES dbo.product_variants(id),
        CONSTRAINT CK_cart_items_quantity CHECK (quantity > 0),
        CONSTRAINT CK_cart_items_unit_price CHECK (unit_price IS NULL OR unit_price > 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_cart_items_product_variant' AND object_id = OBJECT_ID('dbo.cart_items')
)
BEGIN
    CREATE UNIQUE INDEX UX_cart_items_product_variant
    ON dbo.cart_items(cart_id, product_id, variant_key);
END;
GO

IF OBJECT_ID(N'dbo.inventory_reservations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_reservations (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        reservation_key NVARCHAR(160) NOT NULL,
        cart_id INT NULL,
        order_id INT NULL,
        user_id INT NULL,
        product_id INT NOT NULL,
        product_variant_id INT NULL,
        quantity INT NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_inventory_reservations_status DEFAULT N'RESERVED',
        expires_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_inventory_reservations_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        CONSTRAINT FK_inventory_reservations_carts FOREIGN KEY (cart_id) REFERENCES dbo.carts(id),
        CONSTRAINT FK_inventory_reservations_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT FK_inventory_reservations_users FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_inventory_reservations_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT FK_inventory_reservations_product_variants FOREIGN KEY (product_variant_id) REFERENCES dbo.product_variants(id),
        CONSTRAINT CK_inventory_reservations_quantity CHECK (quantity > 0),
        CONSTRAINT CK_inventory_reservations_status CHECK (status IN (N'RESERVED', N'CONFIRMED', N'RELEASED', N'EXPIRED'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_inventory_reservations_key' AND object_id = OBJECT_ID('dbo.inventory_reservations')
)
BEGIN
    CREATE UNIQUE INDEX UX_inventory_reservations_key
    ON dbo.inventory_reservations(reservation_key);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_inventory_reservations_active_stock' AND object_id = OBJECT_ID('dbo.inventory_reservations')
)
BEGIN
    CREATE INDEX IX_inventory_reservations_active_stock
    ON dbo.inventory_reservations(product_id, product_variant_id, status, expires_at)
    INCLUDE (quantity, order_id, cart_id);
END;
GO

IF OBJECT_ID(N'dbo.inventory_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_transactions (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        product_variant_id INT NULL,
        order_id INT NULL,
        cart_id INT NULL,
        reservation_id INT NULL,
        transaction_type NVARCHAR(40) NOT NULL,
        quantity INT NOT NULL,
        stock_before INT NULL,
        stock_after INT NULL,
        metadata NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_inventory_transactions_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_inventory_transactions_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT FK_inventory_transactions_product_variants FOREIGN KEY (product_variant_id) REFERENCES dbo.product_variants(id),
        CONSTRAINT FK_inventory_transactions_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT FK_inventory_transactions_carts FOREIGN KEY (cart_id) REFERENCES dbo.carts(id),
        CONSTRAINT FK_inventory_transactions_reservations FOREIGN KEY (reservation_id) REFERENCES dbo.inventory_reservations(id),
        CONSTRAINT CK_inventory_transactions_type CHECK (transaction_type IN (N'RESERVE', N'COMMIT', N'RELEASE', N'RESTORE', N'ADJUST'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_inventory_transactions_stock' AND object_id = OBJECT_ID('dbo.inventory_transactions')
)
BEGIN
    CREATE INDEX IX_inventory_transactions_stock
    ON dbo.inventory_transactions(product_id, product_variant_id, created_at)
    INCLUDE (transaction_type, quantity, stock_before, stock_after, order_id);
END;
GO

IF COL_LENGTH('dbo.orders', 'checkout_idempotency_key') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD checkout_idempotency_key NVARCHAR(160) NULL;
END;
GO

IF COL_LENGTH('dbo.orders', 'inventory_status') IS NULL
BEGIN
    ALTER TABLE dbo.orders ADD inventory_status NVARCHAR(30) NULL;
END;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes i
    WHERE i.name = 'UX_orders_checkout_idempotency'
      AND i.object_id = OBJECT_ID('dbo.orders')
      AND (
      NOT EXISTS (
          SELECT 1
          FROM sys.index_columns ic
          INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          WHERE ic.object_id = i.object_id
            AND ic.index_id = i.index_id
            AND ic.key_ordinal = 1
            AND c.name = 'user_id'
      )
      OR NOT EXISTS (
          SELECT 1
          FROM sys.index_columns ic
          INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          WHERE ic.object_id = i.object_id
            AND ic.index_id = i.index_id
            AND ic.key_ordinal = 2
            AND c.name = 'checkout_idempotency_key'
      )
      )
)
BEGIN
    DROP INDEX UX_orders_checkout_idempotency ON dbo.orders;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_orders_checkout_idempotency' AND object_id = OBJECT_ID('dbo.orders')
)
BEGIN
    CREATE UNIQUE INDEX UX_orders_checkout_idempotency
    ON dbo.orders(user_id, checkout_idempotency_key)
    WHERE checkout_idempotency_key IS NOT NULL;
END;
GO
