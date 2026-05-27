-- Phase 3: Decant inventory system – sealed bottles + opened ml tracking.
-- Run after 20260524_checkout_inventory_consistency.sql

-- ============================================================
-- 1. PRODUCT_INVENTORY: physical bottle tracking per product
-- ============================================================
IF OBJECT_ID(N'dbo.product_inventory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_inventory (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        sealed_bottles INT NOT NULL CONSTRAINT DF_product_inventory_sealed DEFAULT 0,
        opened_ml INT NOT NULL CONSTRAINT DF_product_inventory_opened_ml DEFAULT 0,
        bottle_volume_ml INT NOT NULL CONSTRAINT DF_product_inventory_bottle_volume DEFAULT 100,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_product_inventory_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        CONSTRAINT FK_product_inventory_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
        CONSTRAINT CK_product_inventory_sealed_bottles CHECK (sealed_bottles >= 0),
        CONSTRAINT CK_product_inventory_opened_ml CHECK (opened_ml >= 0),
        CONSTRAINT CK_product_inventory_bottle_volume CHECK (bottle_volume_ml > 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_inventory_product'
)
BEGIN
    CREATE UNIQUE INDEX UX_product_inventory_product ON dbo.product_inventory(product_id);
END;
GO

-- ============================================================
-- 2. INVENTORY_MOVEMENTS: detailed bottle-level ledger
-- ============================================================
IF OBJECT_ID(N'dbo.inventory_movements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_movements (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        order_id INT NULL,
        order_item_id INT NULL,
        movement_type NVARCHAR(40) NOT NULL,
        sealed_bottles_before INT NOT NULL,
        sealed_bottles_after INT NOT NULL,
        opened_ml_before INT NOT NULL,
        opened_ml_after INT NOT NULL,
        quantity_ml INT NULL,
        quantity_bottles INT NULL,
        reference NVARCHAR(160) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_inventory_movements_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_inventory_movements_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT FK_inventory_movements_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT CK_inventory_movements_type CHECK (movement_type IN (
            N'BOTTLE_OPEN', N'DECANT_SALE', N'BOTTLE_SALE',
            N'BOTTLE_RESTOCK', N'DECANT_RESTOCK', N'ADJUSTMENT', N'CANCEL'
        ))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_inventory_movements_product'
)
BEGIN
    CREATE INDEX IX_inventory_movements_product ON dbo.inventory_movements(product_id, created_at DESC)
    INCLUDE (movement_type, quantity_ml, sealed_bottles_before, sealed_bottles_after, opened_ml_before, opened_ml_after);
END;
GO

-- ============================================================
-- 3. Seed product_inventory from existing products
--    Treat current product.stock as sealed_bottles count.
--    Use product.volume_ml as bottle_volume_ml.
-- ============================================================
INSERT INTO dbo.product_inventory (product_id, sealed_bottles, opened_ml, bottle_volume_ml)
SELECT
    p.id,
    ISNULL(p.stock, 0) AS sealed_bottles,
    0 AS opened_ml,
    CASE WHEN ISNULL(p.volume_ml, 0) > 0 THEN p.volume_ml ELSE 100 END AS bottle_volume_ml
FROM dbo.products p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.product_inventory pi WHERE pi.product_id = p.id);
GO

-- ============================================================
-- 4. Seed default FULL variant for products without variants
--    Ensures all products can go through variant-based checkout.
-- ============================================================
INSERT INTO dbo.product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order, status)
SELECT
    p.id,
    CONCAT(ISNULL(p.sku, CONCAT('PRD-', p.id)), '-FULL') AS sku,
    N'FULL' AS variant_type,
    ISNULL(p.volume_ml, 100) AS volume_ml,
    CONCAT(ISNULL(p.volume_ml, 100), 'ml') AS volume_label,
    p.price,
    p.discount_price,
    ISNULL(p.stock, 0) AS stock_quantity,
    0 AS sort_order,
    1 AS status
FROM dbo.products p
WHERE p.deleted_at IS NULL
  AND p.status = 1
  AND NOT EXISTS (SELECT 1 FROM dbo.product_variants pv WHERE pv.product_id = p.id AND pv.deleted_at IS NULL);
GO
