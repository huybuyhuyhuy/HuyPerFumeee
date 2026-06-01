-- ============================================================
-- Decant Setup: creates missing tables + seeds 3 decant products
-- Run against huyperfume database
-- ============================================================

-- 1. product_variants (if not exists)
IF OBJECT_ID(N'dbo.product_variants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_variants (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        sku NVARCHAR(100) NULL,
        barcode NVARCHAR(120) NULL,
        volume_ml INT NULL,
        volume_label NVARCHAR(80) NULL,
        variant_type NVARCHAR(40) NOT NULL CONSTRAINT DF_product_variants_type DEFAULT N'STANDARD',
        price FLOAT NOT NULL,
        sale_price FLOAT NULL,
        stock_quantity INT NOT NULL CONSTRAINT DF_product_variants_stock DEFAULT 0,
        image NVARCHAR(500) NULL,
        sort_order INT NOT NULL CONSTRAINT DF_product_variants_sort DEFAULT 0,
        status BIT NOT NULL CONSTRAINT DF_product_variants_status DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_product_variants_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        deleted_at DATETIME2 NULL,
        CONSTRAINT FK_product_variants_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
        CONSTRAINT CK_product_variants_price_positive CHECK (price > 0),
        CONSTRAINT CK_product_variants_sale_price_valid CHECK (sale_price IS NULL OR sale_price <= price),
        CONSTRAINT CK_product_variants_stock_non_negative CHECK (stock_quantity >= 0),
        CONSTRAINT CK_product_variants_volume_valid CHECK (volume_ml IS NULL OR volume_ml > 0)
    );
    CREATE INDEX IX_product_variants_product_sort ON dbo.product_variants(product_id, sort_order, id);
    CREATE INDEX IX_product_variants_discovery ON dbo.product_variants(product_id, status, volume_ml, price, sale_price);
END;
GO

-- 2. product_inventory (if not exists)
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
    CREATE UNIQUE INDEX UX_product_inventory_product ON dbo.product_inventory(product_id);
END;
GO

-- 3. inventory_movements (if not exists)
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
    CREATE INDEX IX_inventory_movements_product ON dbo.inventory_movements(product_id, created_at DESC)
    INCLUDE (movement_type, quantity_ml, sealed_bottles_before, sealed_bottles_after, opened_ml_before, opened_ml_after);
END;
GO

-- ============================================================
-- SEED 3 Decant Products
-- ============================================================

-- Product 1: Dior Sauvage EDT -- 5 bottles, 100ml each, price gốc 2,950,000
UPDATE products SET volume_ml = 100, stock = 5 WHERE id = 1;
DELETE FROM product_inventory WHERE product_id = 1;
INSERT INTO product_inventory (product_id, sealed_bottles, opened_ml, bottle_volume_ml) VALUES (1, 5, 0, 100);
DELETE FROM product_variants WHERE product_id = 1;
-- Full 100ml: 2,950,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order) VALUES (1, 'SAUVAGE-EDT-FULL', N'FULL', 100, N'100ml', 2950000, 2550000, 5, 0);
-- Decant 5ml: 180,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (1, 'SAUVAGE-EDT-D5', N'DECANT', 5, N'5ml', 180000, 100, 1);
-- Decant 10ml: 320,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (1, 'SAUVAGE-EDT-D10', N'DECANT', 10, N'10ml', 320000, 50, 2);
-- Decant 20ml: 600,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (1, 'SAUVAGE-EDT-D20', N'DECANT', 20, N'20ml', 600000, 25, 3);

-- Product 3: Versace Dylan Blue -- 3 bottles, 100ml each, price gốc 2,200,000
UPDATE products SET volume_ml = 100, stock = 3 WHERE id = 3;
DELETE FROM product_inventory WHERE product_id = 3;
INSERT INTO product_inventory (product_id, sealed_bottles, opened_ml, bottle_volume_ml) VALUES (3, 3, 0, 100);
DELETE FROM product_variants WHERE product_id = 3;
-- Full 100ml: 2,200,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order) VALUES (3, 'DYLAN-BLUE-FULL', N'FULL', 100, N'100ml', 2200000, 1900000, 3, 0);
-- Decant 5ml: 140,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (3, 'DYLAN-BLUE-D5', N'DECANT', 5, N'5ml', 140000, 60, 1);
-- Decant 10ml: 250,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (3, 'DYLAN-BLUE-D10', N'DECANT', 10, N'10ml', 250000, 30, 2);
-- Decant 20ml: 470,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (3, 'DYLAN-BLUE-D20', N'DECANT', 20, N'20ml', 470000, 15, 3);

-- Product 5: YSL Y EDP -- 6 bottles, 100ml each, price gốc 3,100,000
UPDATE products SET volume_ml = 100, stock = 6 WHERE id = 5;
DELETE FROM product_inventory WHERE product_id = 5;
INSERT INTO product_inventory (product_id, sealed_bottles, opened_ml, bottle_volume_ml) VALUES (5, 6, 0, 100);
DELETE FROM product_variants WHERE product_id = 5;
-- Full 100ml: 3,100,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order) VALUES (5, 'YSL-Y-EDP-FULL', N'FULL', 100, N'100ml', 3100000, 2700000, 6, 0);
-- Decant 5ml: 200,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (5, 'YSL-Y-EDP-D5', N'DECANT', 5, N'5ml', 200000, 120, 1);
-- Decant 10ml: 350,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (5, 'YSL-Y-EDP-D10', N'DECANT', 10, N'10ml', 350000, 60, 2);
-- Decant 20ml: 650,000
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, stock_quantity, sort_order) VALUES (5, 'YSL-Y-EDP-D20', N'DECANT', 20, N'20ml', 650000, 30, 3);

-- Seed inventory for remaining products so all have product_inventory rows
INSERT INTO product_inventory (product_id, sealed_bottles, opened_ml, bottle_volume_ml)
SELECT p.id, ISNULL(p.stock, 1), 0, CASE WHEN ISNULL(p.volume_ml, 0) > 0 THEN p.volume_ml ELSE 100 END
FROM products p
WHERE p.status = 1
  AND NOT EXISTS (SELECT 1 FROM product_inventory pi WHERE pi.product_id = p.id);

-- Seed default FULL variant for products that don't have any variant yet
INSERT INTO product_variants (product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order, status)
SELECT p.id, CONCAT(p.sku, '-FULL'), N'FULL', ISNULL(p.volume_ml, 100), CONCAT(ISNULL(p.volume_ml, 100), 'ml'), p.price, p.discount_price, ISNULL(p.stock, 0), 0, 1
FROM products p
WHERE p.status = 1
  AND NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id);
GO

PRINT '=== DECANT SETUP COMPLETE ===';
PRINT 'Products 1, 3, 5 now have: FULL 100ml + Decant 5ml/10ml/20ml';
PRINT 'Product 1 (Dior Sauvage): 5 sealed bottles, 100ml';
PRINT 'Product 3 (Versace Dylan Blue): 3 sealed bottles, 100ml';
PRINT 'Product 5 (YSL Y EDP): 6 sealed bottles, 100ml';
