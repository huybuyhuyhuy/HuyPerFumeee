-- Admin Products CRUD: preserve referenced products while hiding deleted records.

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

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_products_admin_visibility' AND object_id = OBJECT_ID(N'dbo.products')
)
BEGIN
    CREATE INDEX IX_products_admin_visibility
    ON dbo.products(deleted_at, status, id_brand, id_category, stock);
END;
GO
