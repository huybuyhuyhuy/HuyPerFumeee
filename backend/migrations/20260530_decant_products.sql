-- Phase 5: Decant products automation.
-- Adds a canonical decant product variant for each active decant option.
-- Run after 20260526_decant_inventory.sql.

IF OBJECT_ID(N'dbo.product_variants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_variants (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        sku NVARCHAR(120) NOT NULL,
        barcode NVARCHAR(120) NULL,
        variant_type NVARCHAR(40) NOT NULL CONSTRAINT DF_product_variants_variant_type DEFAULT N'STANDARD',
        volume_ml INT NULL,
        volume_label NVARCHAR(60) NULL,
        price FLOAT NOT NULL,
        sale_price FLOAT NULL,
        stock_quantity INT NOT NULL CONSTRAINT DF_product_variants_stock_quantity DEFAULT 0,
        image NVARCHAR(255) NULL,
        sort_order INT NOT NULL CONSTRAINT DF_product_variants_sort_order DEFAULT 0,
        status BIT NOT NULL CONSTRAINT DF_product_variants_status DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_product_variants_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        deleted_at DATETIME2 NULL,
        CONSTRAINT FK_product_variants_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
        CONSTRAINT UQ_product_variants_sku UNIQUE (sku)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_variants_product_volume' AND object_id = OBJECT_ID('dbo.product_variants')
)
BEGIN
    CREATE UNIQUE INDEX UX_product_variants_product_volume
    ON dbo.product_variants(product_id, variant_type, volume_ml)
    WHERE deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_product_variants_product_active' AND object_id = OBJECT_ID('dbo.product_variants')
)
BEGIN
    CREATE INDEX IX_product_variants_product_active
    ON dbo.product_variants(product_id, status, deleted_at, sort_order)
    INCLUDE (price, sale_price, stock_quantity, volume_ml, volume_label, variant_type, sku);
END;
GO

-- Align decant category to ID 5 in catalogs.
IF NOT EXISTS (
    SELECT 1 FROM dbo.categories WHERE id = 5
)
BEGIN
    INSERT INTO dbo.categories (id, name, status, created_at, updated_at)
    VALUES (5, N'Decant', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
END;
GO

-- Backfill decant variants from active decant options.
INSERT INTO dbo.product_variants (
    product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order, status
)
SELECT
    d.product_id,
    CONCAT(ISNULL(p.sku, CONCAT('PRD-', p.id)), N'-DECANT-', d.volume_ml),
    N'DECANT',
    d.volume_ml,
    CONCAT(d.volume_ml, N'ml'),
    d.price,
    NULL,
    0,
    999,
    d.status
FROM dbo.decant_options d
INNER JOIN dbo.products p ON p.id = d.product_id
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.product_variants pv
    WHERE pv.product_id = d.product_id
      AND pv.variant_type = N'DECANT'
      AND pv.volume_ml = d.volume_ml
      AND pv.deleted_at IS NULL
);
GO
