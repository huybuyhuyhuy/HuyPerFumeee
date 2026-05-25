-- Product, variant, image, inventory hardening for the current SQL Server backend.
-- Run after backing up the database.

IF EXISTS (
    SELECT 1
    FROM dbo.products
    WHERE status = 1 AND (price IS NULL OR price <= 0)
)
BEGIN
    RAISERROR('Active products with invalid price exist. Fix price or deactivate them before applying this migration.', 16, 1);
    RETURN;
END;
GO

IF EXISTS (
    SELECT 1
    FROM dbo.products
    WHERE stock IS NOT NULL AND stock < 0
)
BEGIN
    RAISERROR('Products with negative stock exist. Fix stock before applying this migration.', 16, 1);
    RETURN;
END;
GO

IF COL_LENGTH('dbo.products', 'slug') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD slug NVARCHAR(280) NULL;
END;
GO

IF COL_LENGTH('dbo.products', 'gender') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD gender NVARCHAR(20) NULL;
END;
GO

IF COL_LENGTH('dbo.products', 'concentration') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD concentration NVARCHAR(80) NULL;
END;
GO

IF COL_LENGTH('dbo.products', 'rating_average') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD rating_average FLOAT NOT NULL CONSTRAINT DF_products_rating_average DEFAULT 0;
END;
GO

IF COL_LENGTH('dbo.products', 'review_count') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD review_count INT NOT NULL CONSTRAINT DF_products_review_count DEFAULT 0;
END;
GO

IF COL_LENGTH('dbo.products', 'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD updated_at DATETIME2 NULL;
END;
GO

IF COL_LENGTH('dbo.products', 'deleted_at') IS NULL
BEGIN
    ALTER TABLE dbo.products ADD deleted_at DATETIME2 NULL;
END;
GO

UPDATE dbo.products
SET slug = CONCAT('product-', id)
WHERE slug IS NULL OR LTRIM(RTRIM(slug)) = '';
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_products_slug_active' AND object_id = OBJECT_ID('dbo.products')
)
BEGIN
    CREATE UNIQUE INDEX UX_products_slug_active
    ON dbo.products(slug)
    WHERE slug IS NOT NULL AND deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = 'CK_products_active_price_positive'
)
BEGIN
    ALTER TABLE dbo.products WITH CHECK
    ADD CONSTRAINT CK_products_active_price_positive
    CHECK (status = 0 OR (price IS NOT NULL AND price > 0));
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = 'CK_products_discount_price_valid'
)
BEGIN
    ALTER TABLE dbo.products WITH CHECK
    ADD CONSTRAINT CK_products_discount_price_valid
    CHECK (
        discount_price IS NULL
        OR discount_price = 0
        OR (price IS NOT NULL AND price > 0 AND discount_price > 0 AND discount_price <= price)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = 'CK_products_stock_non_negative'
)
BEGIN
    ALTER TABLE dbo.products WITH CHECK
    ADD CONSTRAINT CK_products_stock_non_negative
    CHECK (stock IS NULL OR stock >= 0);
END;
GO

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
        CONSTRAINT CK_product_variants_sale_price_valid CHECK (sale_price IS NULL OR (sale_price > 0 AND sale_price <= price)),
        CONSTRAINT CK_product_variants_stock_non_negative CHECK (stock_quantity >= 0),
        CONSTRAINT CK_product_variants_volume_valid CHECK (volume_ml IS NULL OR volume_ml > 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_variants_sku_active' AND object_id = OBJECT_ID('dbo.product_variants')
)
BEGIN
    CREATE UNIQUE INDEX UX_product_variants_sku_active
    ON dbo.product_variants(sku)
    WHERE sku IS NOT NULL AND deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_product_variants_product_sort' AND object_id = OBJECT_ID('dbo.product_variants')
)
BEGIN
    CREATE INDEX IX_product_variants_product_sort
    ON dbo.product_variants(product_id, sort_order, id)
    INCLUDE (stock_quantity, price, sale_price, status);
END;
GO

IF OBJECT_ID(N'dbo.product_images', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_images (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        product_id INT NOT NULL,
        image_url NVARCHAR(500) NOT NULL,
        alt_text NVARCHAR(280) NULL,
        sort_order INT NOT NULL CONSTRAINT DF_product_images_sort DEFAULT 0,
        is_thumbnail BIT NOT NULL CONSTRAINT DF_product_images_thumbnail DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_product_images_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        deleted_at DATETIME2 NULL,
        CONSTRAINT FK_product_images_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
    );
END;
GO

INSERT INTO dbo.product_images (product_id, image_url, alt_text, sort_order, is_thumbnail)
SELECT p.id,
       p.image,
       p.name,
       0,
       CASE WHEN EXISTS (
           SELECT 1
           FROM dbo.product_images thumb
           WHERE thumb.product_id = p.id
             AND thumb.is_thumbnail = 1
             AND thumb.deleted_at IS NULL
       ) THEN 0 ELSE 1 END
FROM dbo.products p
WHERE p.image IS NOT NULL
  AND LTRIM(RTRIM(p.image)) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.product_images pi
      WHERE pi.product_id = p.id AND LOWER(pi.image_url) = LOWER(p.image)
  );
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_images_url_active' AND object_id = OBJECT_ID('dbo.product_images')
)
BEGIN
    CREATE UNIQUE INDEX UX_product_images_url_active
    ON dbo.product_images(product_id, image_url)
    WHERE deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_images_one_thumbnail' AND object_id = OBJECT_ID('dbo.product_images')
)
BEGIN
    CREATE UNIQUE INDEX UX_product_images_one_thumbnail
    ON dbo.product_images(product_id)
    WHERE is_thumbnail = 1 AND deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_product_images_product_sort' AND object_id = OBJECT_ID('dbo.product_images')
)
BEGIN
    CREATE INDEX IX_product_images_product_sort
    ON dbo.product_images(product_id, sort_order, id);
END;
GO

IF COL_LENGTH('dbo.order_items', 'product_variant_id') IS NULL
BEGIN
    ALTER TABLE dbo.order_items ADD product_variant_id INT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_order_items_product_variants'
)
BEGIN
    ALTER TABLE dbo.order_items
    ADD CONSTRAINT FK_order_items_product_variants
    FOREIGN KEY (product_variant_id) REFERENCES dbo.product_variants(id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_order_items_product_variant_id' AND object_id = OBJECT_ID('dbo.order_items')
)
BEGIN
    CREATE INDEX IX_order_items_product_variant_id
    ON dbo.order_items(product_variant_id)
    WHERE product_variant_id IS NOT NULL;
END;
GO
