-- Supplier, purchase receipt, and inventory import ledger workflow.
-- This migration is intentionally upgrade-safe for databases that already
-- received the earlier partial suppliers module.

IF OBJECT_ID(N'dbo.Suppliers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Suppliers (
    SupplierId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SupplierCode NVARCHAR(30) NOT NULL,
    SupplierName NVARCHAR(255) NOT NULL,
    RepresentativeName NVARCHAR(255) NULL,
    Phone NVARCHAR(30) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Address NVARCHAR(500) NULL,
    Note NVARCHAR(MAX) NULL,
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Suppliers_Status DEFAULT N'ACTIVE',
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Suppliers_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    IsDeleted BIT NOT NULL CONSTRAINT DF_Suppliers_IsDeleted DEFAULT 0
  );
END;
GO

IF COL_LENGTH('dbo.Suppliers', 'SupplierCode') IS NULL
  ALTER TABLE dbo.Suppliers ADD SupplierCode NVARCHAR(30) NULL;
GO
IF COL_LENGTH('dbo.Suppliers', 'RepresentativeName') IS NULL
  ALTER TABLE dbo.Suppliers ADD RepresentativeName NVARCHAR(255) NULL;
GO
IF COL_LENGTH('dbo.Suppliers', 'Note') IS NULL
  ALTER TABLE dbo.Suppliers ADD Note NVARCHAR(MAX) NULL;
GO
IF COL_LENGTH('dbo.Suppliers', 'Status') IS NULL
  ALTER TABLE dbo.Suppliers ADD Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Suppliers_Status_Late DEFAULT N'ACTIVE';
GO
IF COL_LENGTH('dbo.Suppliers', 'CreatedAt') IS NULL
  ALTER TABLE dbo.Suppliers ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Suppliers_CreatedAt_Late DEFAULT SYSDATETIME();
GO
IF COL_LENGTH('dbo.Suppliers', 'UpdatedAt') IS NULL
  ALTER TABLE dbo.Suppliers ADD UpdatedAt DATETIME2 NULL;
GO
IF COL_LENGTH('dbo.Suppliers', 'IsDeleted') IS NULL
  ALTER TABLE dbo.Suppliers ADD IsDeleted BIT NOT NULL CONSTRAINT DF_Suppliers_IsDeleted_Late DEFAULT 0;
GO

;WITH MissingCodes AS (
  SELECT SupplierId, ROW_NUMBER() OVER (ORDER BY SupplierId) AS rn
  FROM dbo.Suppliers
  WHERE SupplierCode IS NULL OR LTRIM(RTRIM(SupplierCode)) = N''
)
UPDATE s
SET SupplierCode = CONCAT(N'NCC', RIGHT(CONCAT(N'0000', CONVERT(NVARCHAR(20), m.rn)), 4))
FROM dbo.Suppliers s
JOIN MissingCodes m ON m.SupplierId = s.SupplierId;
GO

IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.Suppliers')
    AND name = N'SupplierCode'
    AND is_nullable = 1
)
BEGIN
  ALTER TABLE dbo.Suppliers ALTER COLUMN SupplierCode NVARCHAR(30) NOT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Suppliers_Status')
BEGIN
  ALTER TABLE dbo.Suppliers WITH CHECK ADD CONSTRAINT CK_Suppliers_Status
  CHECK (Status IN (N'ACTIVE', N'INACTIVE'));
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Suppliers_Code' AND object_id = OBJECT_ID(N'dbo.Suppliers'))
  CREATE UNIQUE INDEX UX_Suppliers_Code ON dbo.Suppliers(SupplierCode);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Suppliers_Email_Active' AND object_id = OBJECT_ID(N'dbo.Suppliers'))
  CREATE UNIQUE INDEX UX_Suppliers_Email_Active ON dbo.Suppliers(Email) WHERE IsDeleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Suppliers_Phone_Active' AND object_id = OBJECT_ID(N'dbo.Suppliers'))
  CREATE UNIQUE INDEX UX_Suppliers_Phone_Active ON dbo.Suppliers(Phone) WHERE IsDeleted = 0;
GO

IF OBJECT_ID(N'dbo.SupplierUpdateHistory', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.SupplierUpdateHistory (
    HistoryId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SupplierId INT NOT NULL,
    ActionType NVARCHAR(50) NOT NULL,
    OldValue NVARCHAR(MAX) NULL,
    NewValue NVARCHAR(MAX) NULL,
    UpdatedBy INT NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_SupplierUpdateHistory_UpdatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT FK_SupplierUpdateHistory_Suppliers FOREIGN KEY (SupplierId) REFERENCES dbo.Suppliers(SupplierId)
  );
END;
GO

IF OBJECT_ID(N'dbo.PurchaseReceipts', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.PurchaseReceipts (
    PurchaseReceiptId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ReceiptCode NVARCHAR(30) NOT NULL,
    SupplierId INT NOT NULL,
    ImportDate DATETIME2 NOT NULL CONSTRAINT DF_PurchaseReceipts_ImportDate DEFAULT SYSDATETIME(),
    ReceiptDate DATETIME2 NOT NULL CONSTRAINT DF_PurchaseReceipts_ReceiptDate DEFAULT SYSDATETIME(),
    TotalAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_PurchaseReceipts_TotalAmount DEFAULT 0,
    Note NVARCHAR(MAX) NULL,
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_PurchaseReceipts_Status DEFAULT N'COMPLETED',
    CreatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PurchaseReceipts_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NULL,
    IsDeleted BIT NOT NULL CONSTRAINT DF_PurchaseReceipts_IsDeleted DEFAULT 0,
    CONSTRAINT FK_PurchaseReceipts_Suppliers FOREIGN KEY (SupplierId) REFERENCES dbo.Suppliers(SupplierId)
  );
END;
GO

IF COL_LENGTH('dbo.PurchaseReceipts', 'ReceiptCode') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD ReceiptCode NVARCHAR(30) NULL;
GO
IF COL_LENGTH('dbo.PurchaseReceipts', 'ImportDate') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD ImportDate DATETIME2 NULL;
GO
IF COL_LENGTH('dbo.PurchaseReceipts', 'ReceiptDate') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD ReceiptDate DATETIME2 NULL;
GO
IF COL_LENGTH('dbo.PurchaseReceipts', 'Note') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD Note NVARCHAR(MAX) NULL;
GO
IF COL_LENGTH('dbo.PurchaseReceipts', 'CreatedBy') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD CreatedBy INT NULL;
GO
IF COL_LENGTH('dbo.PurchaseReceipts', 'CreatedAt') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD CreatedAt DATETIME2 NULL;
GO
IF COL_LENGTH('dbo.PurchaseReceipts', 'UpdatedAt') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD UpdatedAt DATETIME2 NULL;
GO
IF COL_LENGTH('dbo.PurchaseReceipts', 'IsDeleted') IS NULL
  ALTER TABLE dbo.PurchaseReceipts ADD IsDeleted BIT NOT NULL CONSTRAINT DF_PurchaseReceipts_IsDeleted_Late DEFAULT 0;
GO

UPDATE dbo.PurchaseReceipts
SET ImportDate = COALESCE(ImportDate, ReceiptDate, SYSDATETIME()),
    ReceiptDate = COALESCE(ReceiptDate, ImportDate, SYSDATETIME()),
    CreatedAt = COALESCE(CreatedAt, ReceiptDate, ImportDate, SYSDATETIME()),
    Status = COALESCE(NULLIF(Status, N''), N'COMPLETED');
GO

;WITH MissingCodes AS (
  SELECT PurchaseReceiptId, ROW_NUMBER() OVER (ORDER BY PurchaseReceiptId) AS rn
  FROM dbo.PurchaseReceipts
  WHERE ReceiptCode IS NULL OR LTRIM(RTRIM(ReceiptCode)) = N''
)
UPDATE pr
SET ReceiptCode = CONCAT(N'PN', RIGHT(CONCAT(N'0000', CONVERT(NVARCHAR(20), m.rn)), 4))
FROM dbo.PurchaseReceipts pr
JOIN MissingCodes m ON m.PurchaseReceiptId = pr.PurchaseReceiptId;
GO

IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.PurchaseReceipts')
    AND name = N'ReceiptCode'
    AND is_nullable = 1
)
  ALTER TABLE dbo.PurchaseReceipts ALTER COLUMN ReceiptCode NVARCHAR(30) NOT NULL;
GO
IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.PurchaseReceipts')
    AND name = N'ImportDate'
    AND is_nullable = 1
)
  ALTER TABLE dbo.PurchaseReceipts ALTER COLUMN ImportDate DATETIME2 NOT NULL;
GO
IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.PurchaseReceipts')
    AND name = N'ReceiptDate'
    AND is_nullable = 1
)
  ALTER TABLE dbo.PurchaseReceipts ALTER COLUMN ReceiptDate DATETIME2 NOT NULL;
GO
IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.PurchaseReceipts')
    AND name = N'CreatedAt'
    AND is_nullable = 1
)
  ALTER TABLE dbo.PurchaseReceipts ALTER COLUMN CreatedAt DATETIME2 NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PurchaseReceipts_Status')
BEGIN
  ALTER TABLE dbo.PurchaseReceipts WITH CHECK ADD CONSTRAINT CK_PurchaseReceipts_Status
  CHECK (Status IN (N'DRAFT', N'COMPLETED', N'CANCELLED'));
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PurchaseReceipts_Code' AND object_id = OBJECT_ID(N'dbo.PurchaseReceipts'))
  CREATE UNIQUE INDEX UX_PurchaseReceipts_Code ON dbo.PurchaseReceipts(ReceiptCode);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseReceipts_Supplier' AND object_id = OBJECT_ID(N'dbo.PurchaseReceipts'))
  CREATE INDEX IX_PurchaseReceipts_Supplier ON dbo.PurchaseReceipts(SupplierId, IsDeleted, ImportDate);
GO

IF OBJECT_ID(N'dbo.PurchaseReceiptItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.PurchaseReceiptItems (
    PurchaseReceiptItemId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PurchaseReceiptId INT NOT NULL,
    ProductId INT NOT NULL,
    VariantId INT NULL,
    Quantity INT NOT NULL,
    ImportPrice DECIMAL(18,2) NOT NULL,
    TotalPrice DECIMAL(18,2) NOT NULL,
    Note NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PurchaseReceiptItems_CreatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT FK_PurchaseReceiptItems_Receipts FOREIGN KEY (PurchaseReceiptId) REFERENCES dbo.PurchaseReceipts(PurchaseReceiptId),
    CONSTRAINT FK_PurchaseReceiptItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.products(id),
    CONSTRAINT CK_PurchaseReceiptItems_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_PurchaseReceiptItems_ImportPrice CHECK (ImportPrice >= 0),
    CONSTRAINT CK_PurchaseReceiptItems_TotalPrice CHECK (TotalPrice = CONVERT(DECIMAL(18,2), Quantity * ImportPrice))
  );
END;
GO

IF OBJECT_ID(N'dbo.product_variants', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PurchaseReceiptItems_ProductVariants')
BEGIN
  ALTER TABLE dbo.PurchaseReceiptItems WITH CHECK ADD CONSTRAINT FK_PurchaseReceiptItems_ProductVariants
  FOREIGN KEY (VariantId) REFERENCES dbo.product_variants(id);
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseReceiptItems_Receipt' AND object_id = OBJECT_ID(N'dbo.PurchaseReceiptItems'))
  CREATE INDEX IX_PurchaseReceiptItems_Receipt ON dbo.PurchaseReceiptItems(PurchaseReceiptId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseReceiptItems_Product' AND object_id = OBJECT_ID(N'dbo.PurchaseReceiptItems'))
  CREATE INDEX IX_PurchaseReceiptItems_Product ON dbo.PurchaseReceiptItems(ProductId, VariantId);
GO

IF OBJECT_ID(N'dbo.inventory_transactions', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.inventory_transactions (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    product_id INT NOT NULL,
    variant_id INT NULL,
    product_variant_id INT NULL,
    order_id INT NULL,
    cart_id INT NULL,
    reservation_id INT NULL,
    transaction_type NVARCHAR(40) NULL,
    delta INT NULL,
    quantity INT NULL,
    stock_before INT NULL,
    stock_after INT NULL,
    reason NVARCHAR(500) NULL,
    reference_type NVARCHAR(50) NULL,
    reference_id INT NULL,
    performed_by INT NULL,
    metadata NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_inventory_transactions_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_inventory_transactions_products FOREIGN KEY (product_id) REFERENCES dbo.products(id)
  );
END;
GO

IF COL_LENGTH('dbo.inventory_transactions', 'variant_id') IS NULL
  ALTER TABLE dbo.inventory_transactions ADD variant_id INT NULL;
GO
IF COL_LENGTH('dbo.inventory_transactions', 'product_variant_id') IS NULL
  ALTER TABLE dbo.inventory_transactions ADD product_variant_id INT NULL;
GO
IF COL_LENGTH('dbo.inventory_transactions', 'delta') IS NULL
  ALTER TABLE dbo.inventory_transactions ADD delta INT NULL;
GO
IF COL_LENGTH('dbo.inventory_transactions', 'reason') IS NULL
  ALTER TABLE dbo.inventory_transactions ADD reason NVARCHAR(500) NULL;
GO
IF COL_LENGTH('dbo.inventory_transactions', 'reference_type') IS NULL
  ALTER TABLE dbo.inventory_transactions ADD reference_type NVARCHAR(50) NULL;
GO
IF COL_LENGTH('dbo.inventory_transactions', 'reference_id') IS NULL
  ALTER TABLE dbo.inventory_transactions ADD reference_id INT NULL;
GO
IF COL_LENGTH('dbo.inventory_transactions', 'performed_by') IS NULL
  ALTER TABLE dbo.inventory_transactions ADD performed_by INT NULL;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_inventory_transactions_type')
  ALTER TABLE dbo.inventory_transactions DROP CONSTRAINT CK_inventory_transactions_type;
GO
IF COL_LENGTH('dbo.inventory_transactions', 'transaction_type') IS NOT NULL
BEGIN
  ALTER TABLE dbo.inventory_transactions WITH NOCHECK ADD CONSTRAINT CK_inventory_transactions_type
  CHECK (
    transaction_type IS NULL OR transaction_type IN (
      N'RESERVE', N'COMMIT', N'RELEASE', N'RESTORE', N'ADJUST',
      N'IMPORT', N'IMPORT_CANCEL', N'SALE', N'ORDER_CANCEL', N'ADJUSTMENT'
    )
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventory_transactions_reference' AND object_id = OBJECT_ID(N'dbo.inventory_transactions'))
  CREATE INDEX IX_inventory_transactions_reference ON dbo.inventory_transactions(reference_type, reference_id, created_at);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.PurchaseReceipts WHERE IsDeleted = 0)
   AND EXISTS (SELECT 1 FROM dbo.Suppliers WHERE IsDeleted = 0 AND Status = N'ACTIVE')
   AND (SELECT COUNT(*) FROM dbo.products) >= 3
BEGIN
  DECLARE @SeedSupplierId INT;
  SELECT TOP 1 @SeedSupplierId = SupplierId
  FROM dbo.Suppliers
  WHERE IsDeleted = 0 AND Status = N'ACTIVE'
  ORDER BY SupplierId;

  DECLARE @SeedProducts TABLE (
    RowNumber INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL
  );

  INSERT INTO @SeedProducts (ProductId)
  SELECT TOP 4 id
  FROM dbo.products
  ORDER BY id;

  DECLARE @SeedReceipts TABLE (
    ReceiptCode NVARCHAR(30) NOT NULL PRIMARY KEY,
    PurchaseReceiptId INT NOT NULL
  );

  INSERT INTO dbo.PurchaseReceipts
    (ReceiptCode, SupplierId, ImportDate, ReceiptDate, TotalAmount, Note, Status, CreatedAt, IsDeleted)
  OUTPUT inserted.ReceiptCode, inserted.PurchaseReceiptId INTO @SeedReceipts
  VALUES
    (N'PN0001', @SeedSupplierId, DATEADD(day, -10, SYSDATETIME()), DATEADD(day, -10, SYSDATETIME()), 0, N'Phieu nhap mau ban dau', N'COMPLETED', DATEADD(day, -10, SYSDATETIME()), 0),
    (N'PN0002', @SeedSupplierId, DATEADD(day, -3, SYSDATETIME()), DATEADD(day, -3, SYSDATETIME()), 0, N'Bo sung ton kho mau', N'COMPLETED', DATEADD(day, -3, SYSDATETIME()), 0);

  INSERT INTO dbo.PurchaseReceiptItems
    (PurchaseReceiptId, ProductId, VariantId, Quantity, ImportPrice, TotalPrice, Note)
  SELECT r.PurchaseReceiptId, p.ProductId, NULL, 2, CONVERT(DECIMAL(18,2), 2500000), CONVERT(DECIMAL(18,2), 5000000), N'Nhap hang mau'
  FROM @SeedReceipts r
  JOIN @SeedProducts p ON p.RowNumber = 1
  WHERE r.ReceiptCode = N'PN0001'
  UNION ALL
  SELECT r.PurchaseReceiptId, p.ProductId, NULL, 3, CONVERT(DECIMAL(18,2), 1800000), CONVERT(DECIMAL(18,2), 5400000), N'Nhap hang mau'
  FROM @SeedReceipts r
  JOIN @SeedProducts p ON p.RowNumber = 2
  WHERE r.ReceiptCode = N'PN0001'
  UNION ALL
  SELECT r.PurchaseReceiptId, p.ProductId, NULL, 4, CONVERT(DECIMAL(18,2), 1250000), CONVERT(DECIMAL(18,2), 5000000), N'Nhap hang mau'
  FROM @SeedReceipts r
  JOIN @SeedProducts p ON p.RowNumber = 3
  WHERE r.ReceiptCode = N'PN0002'
  UNION ALL
  SELECT r.PurchaseReceiptId, p.ProductId, NULL, 2, CONVERT(DECIMAL(18,2), 3200000), CONVERT(DECIMAL(18,2), 6400000), N'Nhap hang mau'
  FROM @SeedReceipts r
  JOIN @SeedProducts p ON p.RowNumber = 4
  WHERE r.ReceiptCode = N'PN0002';

  UPDATE pr
  SET TotalAmount = totals.TotalAmount
  FROM dbo.PurchaseReceipts pr
  JOIN (
    SELECT PurchaseReceiptId, SUM(TotalPrice) AS TotalAmount
    FROM dbo.PurchaseReceiptItems
    GROUP BY PurchaseReceiptId
  ) totals ON totals.PurchaseReceiptId = pr.PurchaseReceiptId
  JOIN @SeedReceipts seeded ON seeded.PurchaseReceiptId = pr.PurchaseReceiptId;

  INSERT INTO dbo.inventory_transactions
    (product_id, variant_id, product_variant_id, transaction_type, delta, quantity,
     stock_before, stock_after, reason, reference_type, reference_id, metadata, created_at)
  SELECT pri.ProductId, pri.VariantId, pri.VariantId, N'IMPORT', pri.Quantity, pri.Quantity,
         NULL, NULL, CONCAT(N'Nhap hang ', pr.ReceiptCode), N'PURCHASE_RECEIPT',
         pr.PurchaseReceiptId,
         CONCAT(N'{"receiptCode":"', pr.ReceiptCode, N'","seed":true}'),
         pr.ImportDate
  FROM dbo.PurchaseReceiptItems pri
  JOIN dbo.PurchaseReceipts pr ON pr.PurchaseReceiptId = pri.PurchaseReceiptId
  JOIN @SeedReceipts seeded ON seeded.PurchaseReceiptId = pr.PurchaseReceiptId;
END;
GO
