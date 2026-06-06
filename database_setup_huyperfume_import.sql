-- Huy Perfume SQL Server 2014 import-safe seed script
-- Target database: huyperfume on LAPTOP-IHIDSGRV
-- Purpose: create missing tables/constraints and seed missing data without dropping existing user data.

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF DB_ID(N'huyperfume') IS NULL
BEGIN
    CREATE DATABASE [huyperfume];
END
GO

USE [huyperfume];
GO

IF OBJECT_ID(N'dbo.[brand]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[brand] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [status] BIT NOT NULL CONSTRAINT [DF_brand_status] DEFAULT (1)
    );
END
GO

IF OBJECT_ID(N'dbo.[categories]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[categories] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(250) NOT NULL
    );
END
GO

IF OBJECT_ID(N'dbo.[users]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[users] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(250) NOT NULL,
        [email] NVARCHAR(250) NOT NULL,
        [phone] NVARCHAR(15) NOT NULL,
        [dob] DATE NULL,
        [password] NVARCHAR(255) NOT NULL,
        [address] NVARCHAR(MAX) NULL,
        [role] NVARCHAR(20) NOT NULL,
        [total_spent] FLOAT NOT NULL CONSTRAINT [DF_users_total_spent] DEFAULT (0),
        [membership_tier] NVARCHAR(30) NOT NULL CONSTRAINT [DF_users_membership_tier] DEFAULT (N'NORMAL'),
        [membership_updated_at] DATETIME NULL,
        [created_at] DATETIME NOT NULL CONSTRAINT [DF_users_created_at] DEFAULT (GETDATE())
    );
END
GO

IF COL_LENGTH(N'dbo.users', N'total_spent') IS NULL
BEGIN
    ALTER TABLE dbo.[users]
    ADD [total_spent] FLOAT NOT NULL CONSTRAINT [DF_users_total_spent_existing] DEFAULT (0);
END
GO

IF COL_LENGTH(N'dbo.users', N'membership_tier') IS NULL
BEGIN
    ALTER TABLE dbo.[users]
    ADD [membership_tier] NVARCHAR(30) NOT NULL CONSTRAINT [DF_users_membership_tier_existing] DEFAULT (N'NORMAL');
END
GO

IF COL_LENGTH(N'dbo.users', N'membership_updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.[users]
    ADD [membership_updated_at] DATETIME NULL;
END
GO

IF OBJECT_ID(N'dbo.[products]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[products] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [sku] NVARCHAR(100) NULL,
        [batch_code] NVARCHAR(100) NULL,
        [name] NVARCHAR(250) NOT NULL,
        [image] NVARCHAR(250) NOT NULL,
        [price] FLOAT NOT NULL CONSTRAINT [DF_products_price] DEFAULT (0),
        [discount_price] FLOAT NULL CONSTRAINT [DF_products_discount_price] DEFAULT (0),
        [quantity] INT NOT NULL CONSTRAINT [DF_products_quantity] DEFAULT (0),
        [status] BIT NOT NULL CONSTRAINT [DF_products_status] DEFAULT (1),
        [id_category] INT NULL,
        [id_brand] INT NOT NULL CONSTRAINT [DF_products_brand] DEFAULT (1),
        [stock] INT NULL CONSTRAINT [DF_products_stock] DEFAULT (0),
        [volume_ml] INT NULL CONSTRAINT [DF_products_volume_ml] DEFAULT (0),
        [description] NVARCHAR(MAX) NULL,
        [created_at] DATETIME NOT NULL CONSTRAINT [DF_products_created_at] DEFAULT (GETDATE()),
        [scent_notes] NVARCHAR(MAX) NULL,
        [is_decant] BIT NULL CONSTRAINT [DF_products_is_decant] DEFAULT (0)
    );
END
GO

IF OBJECT_ID(N'dbo.[orders]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[orders] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NULL,
        [created_at] DATETIME NULL CONSTRAINT [DF_orders_created_at] DEFAULT (GETDATE()),
        [total] FLOAT NULL,
        [shipping_address] NVARCHAR(MAX) NULL,
        [phone] NVARCHAR(20) NULL,
        [payment_method] NVARCHAR(50) NULL,
        [momo_order_id] NVARCHAR(120) NULL,
        [momo_trans_id] NVARCHAR(120) NULL,
        [status] NVARCHAR(50) NULL CONSTRAINT [DF_orders_status] DEFAULT (N'Waiting'),
        [zalopay_app_trans_id] NVARCHAR(120) NULL
    );
END
GO

IF OBJECT_ID(N'dbo.[order_items]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[order_items] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [order_id] INT NULL,
        [product_id] INT NULL,
        [quantity] INT NULL,
        [price] FLOAT NULL,
        [selected_batch_code] NVARCHAR(100) NULL,
        [price_at_purchase] FLOAT NULL,
        [status] NVARCHAR(50) NULL CONSTRAINT [DF_order_items_status] DEFAULT (N'Normal')
    );
END
GO

IF OBJECT_ID(N'dbo.[wishlist]', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.[wishlist] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [product_id] INT NOT NULL,
        [created_at] DATETIME NOT NULL CONSTRAINT [DF_wishlist_created_at] DEFAULT (GETDATE())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_products_sku_not_null' AND object_id = OBJECT_ID(N'dbo.[products]'))
BEGIN
    CREATE UNIQUE INDEX [UX_products_sku_not_null]
    ON dbo.[products] ([sku])
    WHERE [sku] IS NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_products_categories')
BEGIN
    ALTER TABLE dbo.[products]
    ADD CONSTRAINT [FK_products_categories]
    FOREIGN KEY ([id_category]) REFERENCES dbo.[categories]([id])
    ON DELETE CASCADE ON UPDATE CASCADE;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_products_brand')
BEGIN
    ALTER TABLE dbo.[products]
    ADD CONSTRAINT [FK_products_brand]
    FOREIGN KEY ([id_brand]) REFERENCES dbo.[brand]([id]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_orders_users')
BEGIN
    ALTER TABLE dbo.[orders]
    ADD CONSTRAINT [FK_orders_users]
    FOREIGN KEY ([user_id]) REFERENCES dbo.[users]([id]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_order_items_orders')
BEGIN
    ALTER TABLE dbo.[order_items]
    ADD CONSTRAINT [FK_order_items_orders]
    FOREIGN KEY ([order_id]) REFERENCES dbo.[orders]([id]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_order_items_products')
BEGIN
    ALTER TABLE dbo.[order_items]
    ADD CONSTRAINT [FK_order_items_products]
    FOREIGN KEY ([product_id]) REFERENCES dbo.[products]([id]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_wishlist_users')
BEGIN
    ALTER TABLE dbo.[wishlist]
    ADD CONSTRAINT [FK_wishlist_users]
    FOREIGN KEY ([user_id]) REFERENCES dbo.[users]([id])
    ON DELETE CASCADE;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_wishlist_products')
BEGIN
    ALTER TABLE dbo.[wishlist]
    ADD CONSTRAINT [FK_wishlist_products]
    FOREIGN KEY ([product_id]) REFERENCES dbo.[products]([id])
    ON DELETE CASCADE;
END
GO

SET IDENTITY_INSERT dbo.[brand] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 1) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (1, N'Dior', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 2) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (2, N'Versace', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 3) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (3, N'YSL', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 4) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (4, N'Lancome', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 5) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (5, N'CK', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 6) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (6, N'Maison Margiela', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 7) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (7, N'Mont Blanc', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[brand] WHERE [id] = 8) INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES (8, N'Tom Ford', 1);
SET IDENTITY_INSERT dbo.[brand] OFF;
GO

SET IDENTITY_INSERT dbo.[categories] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[categories] WHERE [id] = 1) INSERT INTO dbo.[categories] ([id], [name]) VALUES (1, N'Nước hoa nam');
IF NOT EXISTS (SELECT 1 FROM dbo.[categories] WHERE [id] = 2) INSERT INTO dbo.[categories] ([id], [name]) VALUES (2, N'Nước hoa nữ');
IF NOT EXISTS (SELECT 1 FROM dbo.[categories] WHERE [id] = 3) INSERT INTO dbo.[categories] ([id], [name]) VALUES (3, N'Nước hoa unisex');
IF NOT EXISTS (SELECT 1 FROM dbo.[categories] WHERE [id] = 4) INSERT INTO dbo.[categories] ([id], [name]) VALUES (4, N'Nước hoa cao cấp');
IF NOT EXISTS (SELECT 1 FROM dbo.[categories] WHERE [id] = 5) INSERT INTO dbo.[categories] ([id], [name]) VALUES (5, N'Mini 5 ml - 10 ml');
SET IDENTITY_INSERT dbo.[categories] OFF;
GO

SET IDENTITY_INSERT dbo.[users] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[users] WHERE [id] = 1) INSERT INTO dbo.[users] ([id], [name], [email], [phone], [dob], [password], [address], [role], [created_at]) VALUES (1, N'Quốc Huy', N'huyperfume@gmail.com', N'0906530794', NULL, N'$2a$12$Vbnsgc5FTNC6iE0x5YL.de8AIRpeh6AWwgbZ13SNIcDvJfcRSj8yq', NULL, N'admin', N'2026-05-01 02:41:58');
IF NOT EXISTS (SELECT 1 FROM dbo.[users] WHERE [id] = 2) INSERT INTO dbo.[users] ([id], [name], [email], [phone], [dob], [password], [address], [role], [created_at]) VALUES (2, N'Quốc Hải', N'haii@gmail.com', N'0906550550', NULL, N'202cb962ac59075b964b07152d234b70', NULL, N'user', N'2026-05-01 02:41:58');
IF NOT EXISTS (SELECT 1 FROM dbo.[users] WHERE [id] = 10) INSERT INTO dbo.[users] ([id], [name], [email], [phone], [dob], [password], [address], [role], [created_at]) VALUES (10, N'Admin', N'admin@huyperfume.com', N'0123456789', NULL, N'$2a$10$OXvw7z3sEBjIiZug5JYgFOJ0qk.Q7NZbP3tunYHRncPEOfsAUkqt.', N'Hà Nội', N'admin', N'2026-05-01 15:13:59');
SET IDENTITY_INSERT dbo.[users] OFF;
GO

SET IDENTITY_INSERT dbo.[products] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[products] WHERE [id] = 1) INSERT INTO dbo.[products] ([id], [sku], [batch_code], [name], [image], [price], [discount_price], [quantity], [status], [id_category], [id_brand], [stock], [volume_ml], [description], [created_at], [scent_notes], [is_decant]) VALUES (1, NULL, NULL, N'Dior Sauvage EDT', N'1.png', 2950000, 0, 20, 1, 1, 1, 20, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vàng, táo xanh, bạch đậu khấu|Hoa hồng, nhẫn hương, hoa cam|Gỗ đàn hương, vanilla, vetiver', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.[products] WHERE [id] = 2) INSERT INTO dbo.[products] ([id], [sku], [batch_code], [name], [image], [price], [discount_price], [quantity], [status], [id_category], [id_brand], [stock], [volume_ml], [description], [created_at], [scent_notes], [is_decant]) VALUES (2, NULL, NULL, N'Bleu de Chanel EDP', N'2.png', 3300000, 0, 15, 1, 1, 1, 15, 0, NULL, N'2026-05-01 02:22:21', N'Bưởi chùm, quả lê, lá tím|Hoa mẫu đơn, lily, hoa sữa|Patchouli, amber, xạ hương', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.[products] WHERE [id] = 3) INSERT INTO dbo.[products] ([id], [sku], [batch_code], [name], [image], [price], [discount_price], [quantity], [status], [id_category], [id_brand], [stock], [volume_ml], [description], [created_at], [scent_notes], [is_decant]) VALUES (3, NULL, NULL, N'Versace Dylan Blue', N'3.png', 2200000, 0, 94, 1, 1, 2, 94, 0, NULL, N'2026-05-01 02:22:21', N'Bạch quả, tiêu đen, mandarin|Iris, geranium, hoa linh lan|Tonka bean, oud nhẹ, gỗ guaiac', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.[products] WHERE [id] = 4) INSERT INTO dbo.[products] ([id], [sku], [batch_code], [name], [image], [price], [discount_price], [quantity], [status], [id_category], [id_brand], [stock], [volume_ml], [description], [created_at], [scent_notes], [is_decant]) VALUES (4, NULL, NULL, N'Aventus Creed', N'4.png', 8200000, 0, 5, 1, 1, 4, 5, 0, NULL, N'2026-05-01 02:22:21', N'Cam bergamot, quýt xanh, tiêu hồng|Hoa oải hương, hoa phong lữ, nhũ hương|Gỗ tuyết tùng, xạ hương trắng, hổ phách', 0);
SET IDENTITY_INSERT dbo.[products] OFF;
GO

SET IDENTITY_INSERT dbo.[orders] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[orders] WHERE [id] = 1) INSERT INTO dbo.[orders] ([id], [user_id], [created_at], [total], [shipping_address], [phone], [payment_method], [momo_order_id], [momo_trans_id], [status], [zalopay_app_trans_id]) VALUES (1, 6, N'2026-03-07 23:45:37', 3300000, NULL, NULL, N'CreditCard', NULL, NULL, N'Đã giao hàng', NULL);
IF NOT EXISTS (SELECT 1 FROM dbo.[orders] WHERE [id] = 68) INSERT INTO dbo.[orders] ([id], [user_id], [created_at], [total], [shipping_address], [phone], [payment_method], [momo_order_id], [momo_trans_id], [status], [zalopay_app_trans_id]) VALUES (68, 6, N'2026-05-02 22:06:54', 5900000, N'Chưa cập nhật', N'0981234567', N'Banking', NULL, NULL, N'Đang chờ xử lý', NULL);
SET IDENTITY_INSERT dbo.[orders] OFF;
GO

SET IDENTITY_INSERT dbo.[order_items] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[order_items] WHERE [id] = 1) INSERT INTO dbo.[order_items] ([id], [order_id], [product_id], [quantity], [price], [selected_batch_code], [price_at_purchase], [status]) VALUES (1, 1, 2, 1, 3300000, NULL, NULL, N'Bình thường');
IF NOT EXISTS (SELECT 1 FROM dbo.[order_items] WHERE [id] = 81) INSERT INTO dbo.[order_items] ([id], [order_id], [product_id], [quantity], [price], [selected_batch_code], [price_at_purchase], [status]) VALUES (81, 68, 1, 2, 2950000, NULL, 2950000, N'Bình thường');
SET IDENTITY_INSERT dbo.[order_items] OFF;
GO

IF OBJECT_ID(N'dbo.[products]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.products', 'sku') IS NULL ALTER TABLE dbo.[products] ADD [sku] NVARCHAR(100) NULL;
    IF COL_LENGTH('dbo.products', 'batch_code') IS NULL ALTER TABLE dbo.[products] ADD [batch_code] NVARCHAR(100) NULL;
    IF COL_LENGTH('dbo.products', 'discount_price') IS NULL ALTER TABLE dbo.[products] ADD [discount_price] FLOAT NULL CONSTRAINT [DF_products_discount_price_fix] DEFAULT (0);
    IF COL_LENGTH('dbo.products', 'stock') IS NULL ALTER TABLE dbo.[products] ADD [stock] INT NULL CONSTRAINT [DF_products_stock_fix] DEFAULT (0);
    IF COL_LENGTH('dbo.products', 'quantity') IS NULL ALTER TABLE dbo.[products] ADD [quantity] INT NOT NULL CONSTRAINT [DF_products_quantity_fix] DEFAULT (0);
END
GO

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

PRINT N'Đã hoàn tất script import.';
GO
