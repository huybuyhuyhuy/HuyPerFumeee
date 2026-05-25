-- Phase 4: product discovery filters, search, and sort indexes.
-- Run after 20260524_product_inventory_enterprise.sql.

IF COL_LENGTH('dbo.products', 'scent_group') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD scent_group NVARCHAR(120) NULL;
END;
GO

IF COL_LENGTH('dbo.products', 'scent_family') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD scent_family NVARCHAR(120) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_products_discovery_active' AND object_id = OBJECT_ID('dbo.products')
)
BEGIN
    CREATE INDEX IX_products_discovery_active
    ON dbo.products(status, id_brand, id_category, gender, created_at DESC, id DESC)
    INCLUDE (name, slug, sku, batch_code, price, discount_price, stock, volume_ml, scent_group, scent_family, scent_notes, rating_average, review_count, deleted_at)
    WHERE deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_products_price_filter' AND object_id = OBJECT_ID('dbo.products')
)
BEGIN
    CREATE INDEX IX_products_price_filter
    ON dbo.products(status, price, discount_price, id DESC)
    INCLUDE (id_brand, id_category, gender, volume_ml, created_at, deleted_at)
    WHERE deleted_at IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.product_variants', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_product_variants_discovery' AND object_id = OBJECT_ID('dbo.product_variants')
)
BEGIN
    CREATE INDEX IX_product_variants_discovery
    ON dbo.product_variants(product_id, status, volume_ml, price, sale_price)
    INCLUDE (sku, barcode, volume_label, variant_type, stock_quantity, deleted_at)
    WHERE deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_order_items_sales_product' AND object_id = OBJECT_ID('dbo.order_items')
)
BEGIN
    CREATE INDEX IX_order_items_sales_product
    ON dbo.order_items(product_id)
    INCLUDE (quantity, product_variant_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_brand_name_lookup' AND object_id = OBJECT_ID('dbo.brand')
)
BEGIN
    CREATE INDEX IX_brand_name_lookup
    ON dbo.brand(name)
    INCLUDE (status);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_categories_name_lookup' AND object_id = OBJECT_ID('dbo.categories')
)
BEGIN
    CREATE INDEX IX_categories_name_lookup
    ON dbo.categories(name);
END;
GO
