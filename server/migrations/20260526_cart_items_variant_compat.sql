-- Upgrade existing legacy cart/order line tables for product variant checkout.
-- This migration is additive so existing cart and order data remains intact.

IF OBJECT_ID(N'dbo.cart_items', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.cart_items', 'product_variant_id') IS NULL
    BEGIN
        ALTER TABLE dbo.cart_items ADD product_variant_id INT NULL;
    END;

    IF COL_LENGTH('dbo.cart_items', 'unit_price') IS NULL
    BEGIN
        ALTER TABLE dbo.cart_items ADD unit_price FLOAT NULL;
    END;

    IF COL_LENGTH('dbo.cart_items', 'updated_at') IS NULL
    BEGIN
        ALTER TABLE dbo.cart_items ADD updated_at DATETIME2 NULL;
    END;
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.order_items', 'product_variant_id') IS NULL
    BEGIN
        ALTER TABLE dbo.order_items ADD product_variant_id INT NULL;
    END;
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.product_variants', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.order_items', 'product_variant_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_order_items_product_variants'
         AND parent_object_id = OBJECT_ID(N'dbo.order_items')
   )
BEGIN
    ALTER TABLE dbo.order_items WITH CHECK
    ADD CONSTRAINT FK_order_items_product_variants
        FOREIGN KEY (product_variant_id) REFERENCES dbo.product_variants(id);
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.order_items', 'product_variant_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_order_items_product_variant_id'
         AND object_id = OBJECT_ID(N'dbo.order_items')
   )
BEGIN
    CREATE INDEX IX_order_items_product_variant_id
    ON dbo.order_items(product_variant_id)
    WHERE product_variant_id IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.cart_items', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.product_variants', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.cart_items', 'product_variant_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_cart_items_product_variants'
         AND parent_object_id = OBJECT_ID(N'dbo.cart_items')
   )
BEGIN
    ALTER TABLE dbo.cart_items WITH CHECK
    ADD CONSTRAINT FK_cart_items_product_variants
        FOREIGN KEY (product_variant_id) REFERENCES dbo.product_variants(id);
END;
GO

IF OBJECT_ID(N'dbo.cart_items', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.cart_items', 'product_variant_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_cart_items_cart_product_variant'
         AND object_id = OBJECT_ID(N'dbo.cart_items')
   )
BEGIN
    CREATE INDEX IX_cart_items_cart_product_variant
    ON dbo.cart_items(cart_id, product_id, product_variant_id);
END;
GO
