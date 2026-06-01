-- Decant inventory by ml, with purchasable decant options.

IF OBJECT_ID(N'dbo.product_batches', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_batches (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        batch_code NVARCHAR(100) NULL,
        total_volume_ml INT NOT NULL,
        remaining_volume_ml INT NOT NULL,
        import_price FLOAT NULL,
        status NVARCHAR(50) NOT NULL CONSTRAINT DF_product_batches_status DEFAULT N'ACTIVE',
        created_at DATETIME NOT NULL CONSTRAINT DF_product_batches_created_at DEFAULT GETDATE(),
        CONSTRAINT FK_product_batches_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT CK_product_batches_volume CHECK (total_volume_ml >= 0 AND remaining_volume_ml >= 0 AND remaining_volume_ml <= total_volume_ml)
    );
END;
GO

IF OBJECT_ID(N'dbo.decant_options', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.decant_options (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        volume_ml INT NOT NULL,
        price FLOAT NOT NULL,
        status BIT NOT NULL CONSTRAINT DF_decant_options_status DEFAULT 1,
        CONSTRAINT FK_decant_options_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT CK_decant_options_volume CHECK (volume_ml > 0),
        CONSTRAINT CK_decant_options_price CHECK (price >= 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_product_batches_product_status'
      AND object_id = OBJECT_ID(N'dbo.product_batches')
)
BEGIN
    CREATE INDEX IX_product_batches_product_status
        ON dbo.product_batches(product_id, status, remaining_volume_ml);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_decant_options_product_volume'
      AND object_id = OBJECT_ID(N'dbo.decant_options')
)
BEGIN
    CREATE UNIQUE INDEX UX_decant_options_product_volume
        ON dbo.decant_options(product_id, volume_ml);
END;
GO

IF COL_LENGTH(N'dbo.order_items', N'item_type') IS NULL
BEGIN
    ALTER TABLE dbo.order_items
        ADD item_type NVARCHAR(30) NOT NULL CONSTRAINT DF_order_items_item_type DEFAULT N'FULL_BOTTLE';
END;
GO

IF COL_LENGTH(N'dbo.order_items', N'selected_volume_ml') IS NULL
BEGIN
    ALTER TABLE dbo.order_items
        ADD selected_volume_ml INT NULL;
END;
GO

IF COL_LENGTH(N'dbo.order_items', N'source_batch_id') IS NULL
BEGIN
    ALTER TABLE dbo.order_items
        ADD source_batch_id INT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_order_items_product_batches'
)
BEGIN
    ALTER TABLE dbo.order_items WITH CHECK ADD CONSTRAINT FK_order_items_product_batches
        FOREIGN KEY (source_batch_id) REFERENCES dbo.product_batches(id);
END;
GO

IF COL_LENGTH(N'dbo.cart_items', N'item_type') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items
        ADD item_type NVARCHAR(30) NOT NULL CONSTRAINT DF_cart_items_item_type DEFAULT N'FULL_BOTTLE';
END;
GO

IF COL_LENGTH(N'dbo.cart_items', N'selected_volume_ml') IS NULL
BEGIN
    ALTER TABLE dbo.cart_items
        ADD selected_volume_ml INT NULL;
END;
GO

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = N'dbo' AND TABLE_NAME = N'product_inventory'
)
BEGIN
    INSERT INTO dbo.product_batches (product_id, batch_code, total_volume_ml, remaining_volume_ml, status)
    SELECT
        pi.product_id,
        N'LEGACY-INV-' + CAST(pi.product_id AS NVARCHAR(20)),
        ISNULL(pi.sealed_bottles, 0) * ISNULL(NULLIF(pi.bottle_volume_ml, 0), 100) + ISNULL(pi.opened_ml, 0),
        ISNULL(pi.sealed_bottles, 0) * ISNULL(NULLIF(pi.bottle_volume_ml, 0), 100) + ISNULL(pi.opened_ml, 0),
        N'ACTIVE'
    FROM dbo.product_inventory pi
    WHERE (ISNULL(pi.sealed_bottles, 0) * ISNULL(NULLIF(pi.bottle_volume_ml, 0), 100) + ISNULL(pi.opened_ml, 0)) > 0
      AND NOT EXISTS (
          SELECT 1 FROM dbo.product_batches pb
          WHERE pb.product_id = pi.product_id
      );
END;
GO

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = N'dbo' AND TABLE_NAME = N'product_variants'
)
BEGIN
    INSERT INTO dbo.decant_options (product_id, volume_ml, price, status)
    SELECT pv.product_id, pv.volume_ml, pv.price, ISNULL(pv.status, 1)
    FROM dbo.product_variants pv
    WHERE UPPER(ISNULL(pv.variant_type, N'')) = N'DECANT'
      AND ISNULL(pv.volume_ml, 0) > 0
      AND ISNULL(pv.price, 0) >= 0
      AND NOT EXISTS (
          SELECT 1 FROM dbo.decant_options do
          WHERE do.product_id = pv.product_id AND do.volume_ml = pv.volume_ml
      );
END;
GO
