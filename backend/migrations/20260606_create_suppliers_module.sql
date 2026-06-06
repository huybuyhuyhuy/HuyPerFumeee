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

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Suppliers_Status')
BEGIN
  ALTER TABLE dbo.Suppliers WITH CHECK ADD CONSTRAINT CK_Suppliers_Status
  CHECK (Status IN (N'ACTIVE', N'INACTIVE'));
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Suppliers_Code' AND object_id = OBJECT_ID(N'dbo.Suppliers'))
BEGIN
  CREATE UNIQUE INDEX UX_Suppliers_Code ON dbo.Suppliers(SupplierCode);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Suppliers_Email_Active' AND object_id = OBJECT_ID(N'dbo.Suppliers'))
BEGIN
  CREATE UNIQUE INDEX UX_Suppliers_Email_Active ON dbo.Suppliers(Email) WHERE IsDeleted = 0;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Suppliers_Phone_Active' AND object_id = OBJECT_ID(N'dbo.Suppliers'))
BEGIN
  CREATE UNIQUE INDEX UX_Suppliers_Phone_Active ON dbo.Suppliers(Phone) WHERE IsDeleted = 0;
END;
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
    SupplierId INT NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_PurchaseReceipts_TotalAmount DEFAULT 0,
    ReceiptDate DATETIME2 NOT NULL CONSTRAINT DF_PurchaseReceipts_ReceiptDate DEFAULT SYSDATETIME(),
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_PurchaseReceipts_Status DEFAULT N'COMPLETED',
    IsDeleted BIT NOT NULL CONSTRAINT DF_PurchaseReceipts_IsDeleted DEFAULT 0,
    CONSTRAINT FK_PurchaseReceipts_Suppliers FOREIGN KEY (SupplierId) REFERENCES dbo.Suppliers(SupplierId)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Suppliers_Search' AND object_id = OBJECT_ID(N'dbo.Suppliers'))
BEGIN
  CREATE INDEX IX_Suppliers_Search ON dbo.Suppliers(IsDeleted, Status, SupplierName, Email, Phone);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseReceipts_Supplier' AND object_id = OBJECT_ID(N'dbo.PurchaseReceipts'))
BEGIN
  CREATE INDEX IX_PurchaseReceipts_Supplier ON dbo.PurchaseReceipts(SupplierId, IsDeleted, ReceiptDate);
END;
GO
