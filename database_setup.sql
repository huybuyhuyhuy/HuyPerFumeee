-- Huy Perfume SQL Server 2014 full setup + seed data
-- Source: C:/Users/huyle/Downloads/huyperfume.sql
-- Note: this script resets huyperfume tables before inserting the seed data.

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

IF OBJECT_ID(N'dbo.[wishlist]', N'U') IS NOT NULL DROP TABLE dbo.[wishlist];
IF OBJECT_ID(N'dbo.[order_items]', N'U') IS NOT NULL DROP TABLE dbo.[order_items];
IF OBJECT_ID(N'dbo.[orders]', N'U') IS NOT NULL DROP TABLE dbo.[orders];
IF OBJECT_ID(N'dbo.[products]', N'U') IS NOT NULL DROP TABLE dbo.[products];
IF OBJECT_ID(N'dbo.[users]', N'U') IS NOT NULL DROP TABLE dbo.[users];
IF OBJECT_ID(N'dbo.[categories]', N'U') IS NOT NULL DROP TABLE dbo.[categories];
IF OBJECT_ID(N'dbo.[brand]', N'U') IS NOT NULL DROP TABLE dbo.[brand];
GO

CREATE TABLE dbo.[brand] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [status] BIT NOT NULL
);

CREATE TABLE dbo.[categories] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] NVARCHAR(250) NOT NULL
);

CREATE TABLE dbo.[users] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] NVARCHAR(250) NOT NULL,
    [email] NVARCHAR(250) NOT NULL,
    [phone] NVARCHAR(15) NOT NULL,
    [dob] DATE NULL,
    [password] NVARCHAR(255) NOT NULL,
    [address] NVARCHAR(MAX) NULL,
    [role] NVARCHAR(20) NOT NULL,
    [total_spent] FLOAT NOT NULL DEFAULT 0,
    [membership_tier] NVARCHAR(30) NOT NULL DEFAULT N'NORMAL',
    [membership_updated_at] DATETIME NULL,
    [created_at] DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE dbo.[products] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [sku] NVARCHAR(100) NULL,
    [batch_code] NVARCHAR(100) NULL,
    [name] NVARCHAR(250) NOT NULL,
    [image] NVARCHAR(250) NOT NULL,
    [price] FLOAT NOT NULL DEFAULT 0,
    [discount_price] FLOAT NULL DEFAULT 0,
    [quantity] INT NOT NULL DEFAULT 0,
    [status] BIT NOT NULL DEFAULT 1,
    [id_category] INT NULL,
    [id_brand] INT NOT NULL DEFAULT 1,
    [stock] INT NULL DEFAULT 0,
    [volume_ml] INT NULL DEFAULT 0,
    [description] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
    [scent_notes] NVARCHAR(MAX) NULL,
    [is_decant] BIT NULL DEFAULT 0
);

CREATE TABLE dbo.[orders] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] INT NULL,
    [created_at] DATETIME NULL DEFAULT GETDATE(),
    [total] FLOAT NULL,
    [shipping_address] NVARCHAR(MAX) NULL,
    [phone] NVARCHAR(20) NULL,
    [payment_method] NVARCHAR(50) NULL,
    [momo_order_id] NVARCHAR(120) NULL,
    [momo_trans_id] NVARCHAR(120) NULL,
    [status] NVARCHAR(50) NULL DEFAULT N'Waiting',
    [zalopay_app_trans_id] NVARCHAR(120) NULL
);

CREATE TABLE dbo.[order_items] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [order_id] INT NULL,
    [product_id] INT NULL,
    [quantity] INT NULL,
    [price] FLOAT NULL,
    [selected_batch_code] NVARCHAR(100) NULL,
    [price_at_purchase] FLOAT NULL,
    [status] NVARCHAR(50) NULL DEFAULT N'Normal'
);

CREATE TABLE dbo.[wishlist] (
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] INT NOT NULL,
    [product_id] INT NOT NULL,
    [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [uq_wishlist_user_product] UNIQUE ([user_id], [product_id])
);
GO


-- DATA: brand
SET IDENTITY_INSERT dbo.[brand] ON;
INSERT INTO dbo.[brand] ([id], [name], [status]) VALUES
(1, N'Dior', 1),
(2, N'Versace', 1),
(3, N'YSL', 1),
(4, N'Lancome', 1),
(5, N'CK', 1),
(6, N'Maison Margiela', 1),
(7, N'Mont Blanc', 1),
(8, N'Tom Ford', 1);
SET IDENTITY_INSERT dbo.[brand] OFF;
GO


-- DATA: categories
SET IDENTITY_INSERT dbo.[categories] ON;
INSERT INTO dbo.[categories] ([id], [name]) VALUES
(1, N'Nước hoa Nam'),
(2, N'Nước hoa Nữ'),
(3, N'Unisex'),
(4, N'Cao cấp'),
(5, N'Mini 5ml – 10ml');
SET IDENTITY_INSERT dbo.[categories] OFF;
GO


-- DATA: users
SET IDENTITY_INSERT dbo.[users] ON;
INSERT INTO dbo.[users] ([id], [name], [email], [phone], [dob], [password], [address], [role], [created_at]) VALUES
(1, N'Quốc Huy', N'huyperfume@gmail.com', N'0906530794', NULL, N'$2a$12$Vbnsgc5FTNC6iE0x5YL.de8AIRpeh6AWwgbZ13SNIcDvJfcRSj8yq', NULL, N'admin', N'2026-05-01 02:41:58'),
(2, N'Quốc Hải', N'haii@gmail.com', N'0906550550', NULL, N'202cb962ac59075b964b07152d234b70', NULL, N'user', N'2026-05-01 02:41:58'),
(3, N'anh hóa phòng', N'hoahoa@gmail.com', N'0987655432', NULL, N'202cb962ac59075b964b07152d234b70', NULL, N'', N'2026-05-01 02:41:58'),
(4, N'hieutrangtien', N'hieu@gmail.com', N'0909876545', NULL, N'202cb962ac59075b964b07152d234b70', NULL, N'', N'2026-05-01 02:41:58'),
(5, N'huyhuyhuy', N'huyiu@gmail.com', N'0909090808', NULL, N'$2b$10$3t7dW3uktemHZbMirrKATOyGfju2LeQ6dfPkNHuu6XsJ718FSzPzC', NULL, N'', N'2026-05-01 02:41:58'),
(6, N'huyyyy', N'huy1@gmail.com', N'0981234567', NULL, N'$2a$12$.lSaOCwNQnEjrIt7ibraHeOkQBRPp1HIrnYNkmG/HLMMOWBz0V382', NULL, N'', N'2026-05-01 02:41:58'),
(7, N'Khang', N'Khang@gmail.com', N'0906666666', NULL, N'202cb962ac59075b964b07152d234b70', NULL, N'', N'2026-05-01 02:41:58'),
(8, N'Mai Văn Hòa', N'hoa111@gmail.com', N'0908900987', NULL, N'$2a$12$flPhKvd9/.8.pw/qrHD12eIeWCaTbm0fSNaJGQSY4ou3FQ.3KnRNa', N'Trần Quý Khoáng', N'user', N'2026-05-01 02:41:58'),
(9, N'Nguyễn Nhật Tom', N'tom333@gmail.com', N'0908900986', NULL, N'$2a$12$7gkdj5FZeIYEgDsV.VWYa.QyOYYcM/nS3MHjnBYhKcF8hFzjUvLoW', N'An Hòa', N'user', N'2026-05-01 02:41:58'),
(10, N'Admin', N'admin@huyperfume.com', N'0123456789', NULL, N'$2a$10$OXvw7z3sEBjIiZug5JYgFOJ0qk.Q7NZbP3tunYHRncPEOfsAUkqt.', N'HÓ N?i', N'admin', N'2026-05-01 15:13:59');
SET IDENTITY_INSERT dbo.[users] OFF;
GO


-- DATA: products
SET IDENTITY_INSERT dbo.[products] ON;
INSERT INTO dbo.[products] ([id], [sku], [batch_code], [name], [image], [price], [discount_price], [quantity], [status], [id_category], [id_brand], [stock], [volume_ml], [description], [created_at], [scent_notes], [is_decant]) VALUES
(1, NULL, NULL, N'Dior Sauvage EDT', N'1.png', 2950000, 0, 20, 1, 1, 1, 1, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(2, NULL, NULL, N'Bleu de Chanel EDP', N'2.png', 3300000, 0, 15, 1, 1, 1, 35, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(3, NULL, NULL, N'Versace Dylan Blue', N'3.png', 2200000, 0, 20, 1, 1, 2, 94, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(4, NULL, NULL, N'Aventus Creed', N'4.png', 8200000, 0, 5, 1, 1, 1, 97, 0, NULL, N'2026-05-01 02:22:21', N'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach', 0),
(5, NULL, NULL, N'YSL Y EDP', N'5.png', 3100000, 0, 18, 1, 1, 3, 99, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(7, NULL, NULL, N'Gucci Bloom', N'6.png', 2700000, 0, 10, 1, 2, 1, 97, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(8, NULL, NULL, N'Chanel Coco Mademoiselle', N'7.png', 3500000, 0, 10, 1, 2, 1, 97, 0, NULL, N'2026-05-01 02:22:21', N'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach', 0),
(9, NULL, NULL, N'Dior J’Adore', N'8.png', 3200000, 0, 8, 1, 2, 1, 98, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(10, NULL, NULL, N'Lancome La Vie Est Belle', N'9.png', 2300000, 0, 20, 1, 2, 4, 99, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(11, NULL, NULL, N'YSL Libre', N'10.png', 3100000, 0, 16, 1, 2, 3, 100, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(12, NULL, NULL, N'Versace Bright Crystal', N'11.png', 1900000, 0, 25, 1, 2, 2, 100, 0, NULL, N'2026-05-01 02:22:21', N'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach', 0),
(13, NULL, NULL, N'CK One', N'12.png', 1500000, 0, 25, 1, 3, 5, 99, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(14, NULL, NULL, N'Tom Ford Black Orchid', N'13.png', 4200000, 0, 10, 1, 3, 8, 94, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(15, NULL, NULL, N'Maison Francis Kurkdjian Baccarat Rouge 540', N'14.png', 8900000, 0, 5, 1, 3, 6, 100, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(18, NULL, NULL, N'Mont Blanc Legend Spirit', N'15.png', 1800000, 0, 22, 1, 3, 7, 100, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(19, NULL, NULL, N'Initio Oud for Greatness', N'16.png', 9500000, 0, 4, 1, 4, 1, 100, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(20, NULL, NULL, N'Amouage Interlude Man', N'17.png', 7200000, 0, 6, 1, 4, 1, 100, 0, NULL, N'2026-05-01 02:22:21', N'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach', 0),
(21, NULL, NULL, N'Nishane Hacivat', N'18.png', 6500000, 0, 7, 1, 4, 1, 100, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(22, NULL, NULL, N'Xerjoff Naxos', N'19.png', 7800000, 0, 5, 1, 4, 1, 99, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(23, NULL, NULL, N'MFK Gentle Fluidity Gold', N'20.png', 7800000, 0, 3, 1, 4, 6, 100, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(31, NULL, NULL, N'Acqua Di Giò Pour Homme', N'21.png', 2100000, 0, 30, 1, 1, 2, 100, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(32, NULL, NULL, N'Giorgio Armani Code', N'22.png', 2400000, 0, 15, 1, 1, 2, 100, 0, NULL, N'2026-05-01 02:22:21', N'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach', 0),
(33, NULL, NULL, N'Versace Eros EDP', N'23.png', 2150000, 0, 25, 1, 1, 2, 100, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(34, NULL, NULL, N'Dolce & Gabbana The One', N'25.png', 2400000, 0, 18, 1, 1, 2, 100, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(35, NULL, NULL, N'Jean Paul Gaultier Le Male', N'30.png', 2300000, 0, 20, 1, 1, 2, 100, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(36, NULL, NULL, N'Hermès Terre d''Hermès', N'31.png', 2800000, 0, 12, 1, 1, 1, 100, 0, NULL, N'2026-05-01 02:22:21', N'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach', 0),
(38, NULL, NULL, N'Narciso Rodriguez Poudrée', N'32.png', 2500000, 0, 12, 1, 2, 4, 100, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(39, NULL, NULL, N'Carolina Herrera Good Girl', N'33.png', 3100000, 0, 20, 1, 2, 3, 100, 0, NULL, N'2026-05-01 02:22:21', N'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac', 0),
(41, NULL, NULL, N'Marc Jacobs Daisy', N'34.png', 2100000, 0, 18, 1, 2, 1, 100, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(42, NULL, NULL, N'Hermès Twilly d’Hermès', N'35.png', 2500000, 0, 14, 1, 2, 1, 100, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(45, NULL, NULL, N'Diptyque Tam Dao', N'36.png', 4100000, 0, 10, 1, 3, 6, 100, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(46, NULL, NULL, N'Mancera Cedrat Boise', N'37.png', 2800000, 0, 15, 1, 3, 6, 100, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(49, NULL, NULL, N'Creed Silver Mountain Water', N'38.png', 7100000, 0, 5, 1, 4, 8, 100, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0),
(50, NULL, NULL, N'Kilian Black Phantom', N'39.png', 7500000, 0, 4, 1, 4, 8, 100, 0, NULL, N'2026-05-01 02:22:21', N'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong', 0),
(52, NULL, NULL, N'Roja Elysium Pour Homme', N'40.png', 8900000, 0, 3, 1, 4, 8, 100, 0, NULL, N'2026-05-01 02:22:21', N'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach', 0),
(53, NULL, NULL, N'Frederic Malle Portrait of a Lady', N'41.png', 8200000, 0, 4, 1, 4, 8, 100, 0, NULL, N'2026-05-01 02:22:21', N'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver', 0);
SET IDENTITY_INSERT dbo.[products] OFF;
GO


-- DATA: orders
SET IDENTITY_INSERT dbo.[orders] ON;
INSERT INTO dbo.[orders] ([id], [user_id], [created_at], [total], [shipping_address], [phone], [payment_method], [momo_order_id], [momo_trans_id], [status], [zalopay_app_trans_id]) VALUES
(1, 6, N'2026-03-07 23:45:37', 3300000, NULL, NULL, N'CreditCard', NULL, NULL, N'Giao hàng thành công', NULL),
(2, 6, N'2026-03-07 23:46:24', 3300000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(3, 4, N'2026-03-07 23:48:09', 14900000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(4, 4, N'2026-03-07 23:50:42', 2200000, NULL, NULL, N'CreditCard', NULL, NULL, N'Chờ xác nhận', NULL),
(5, 4, N'2026-03-07 23:53:20', 4400000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(6, 6, N'2026-03-08 23:51:11', 22900000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(7, 7, N'2026-03-08 23:54:39', 15500000, NULL, NULL, N'COD', NULL, NULL, N'Chờ xác nhận', NULL),
(8, 6, N'2026-03-09 00:06:32', 6250000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(9, 6, N'2026-03-09 00:09:53', 2200000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(10, 6, N'2026-03-09 10:32:40', 2200000, NULL, NULL, NULL, NULL, NULL, N'Chờ xác nhận', NULL),
(11, 6, N'2026-03-09 10:33:31', 2200000, NULL, NULL, NULL, NULL, NULL, N'Chờ xác nhận', NULL),
(12, 6, N'2026-03-09 10:43:28', 6600000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(13, 6, N'2026-03-09 10:46:23', 8200000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(14, 6, N'2026-03-09 10:47:03', 3300000, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(15, 6, N'2026-03-09 10:47:15', 2200000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(16, 6, N'2026-03-09 10:48:09', 4200000, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(17, 6, N'2026-03-09 10:49:58', 8200000, NULL, NULL, N'CreditCard', NULL, NULL, N'Chờ xác nhận', NULL),
(18, 7, N'2026-03-09 10:52:56', 3100000, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(19, 7, N'2026-03-09 10:53:14', 3300000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(20, 7, N'2026-03-09 10:53:34', 2950000, NULL, NULL, N'CreditCard', NULL, NULL, N'Chờ xác nhận', NULL),
(21, 7, N'2026-03-09 10:53:41', 8200000, NULL, NULL, N'COD', NULL, NULL, N'Chờ xác nhận', NULL),
(22, 6, N'2026-03-09 23:06:45', 10400000, NULL, NULL, N'CreditCard', NULL, NULL, N'Chờ xác nhận', NULL),
(23, 4, N'2026-03-10 00:08:06', 6200000, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(24, 7, N'2026-03-10 00:34:46', 6250000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(30, 6, N'2026-03-13 18:34:53', 6250000, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(32, 7, N'2026-03-13 18:38:11', 3300000, NULL, NULL, N'COD', NULL, NULL, N'Chờ xác nhận', NULL),
(33, 7, N'2026-03-13 18:38:32', 8200000, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(34, 4, N'2026-03-13 18:45:34', 10400000, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(37, 3, N'2026-03-13 23:22:57', 16400000, NULL, NULL, N'COD', NULL, NULL, N'Chờ xác nhận', NULL),
(38, 6, N'2026-03-13 23:27:14', 1200000, NULL, NULL, N'Banking', NULL, NULL, N'Giao hàng thành công', NULL),
(39, 6, N'2026-03-13 23:35:57', 2950000, NULL, NULL, N'Banking', NULL, NULL, N'Đang giao', NULL),
(40, 7, N'2026-03-13 23:36:18', 3300000, NULL, NULL, N'Momo', NULL, NULL, N'Đang hoàn tiền', NULL),
(41, 6, N'2026-03-14 00:27:49', 3500000, NULL, NULL, N'COD', NULL, NULL, N'Đã hoàn tiền', NULL),
(42, 6, N'2026-03-14 00:28:06', 1200000, NULL, NULL, N'Momo', NULL, NULL, N'Đang giao', NULL),
(43, 7, N'2026-03-14 00:28:44', 10900000, NULL, NULL, N'COD', NULL, NULL, N'Đang giao', NULL),
(44, 6, N'2026-03-14 00:42:39', 1835226.843855555, NULL, NULL, N'Momo', NULL, NULL, N'Giao hàng thành công', NULL),
(45, 4, N'2026-03-14 00:44:58', 2352952.9568394204, NULL, NULL, N'Banking', NULL, NULL, N'Đã hủy', NULL),
(46, 4, N'2026-03-14 00:45:11', 2364609.682722585, NULL, NULL, N'Banking', NULL, NULL, N'Đã hủy', NULL),
(47, 6, N'2026-03-14 00:50:59', 1835226.843855555, NULL, NULL, N'Banking', NULL, NULL, N'Giao hàng thành công', NULL),
(48, 6, N'2026-03-14 00:57:06', 2645107.5456339004, NULL, NULL, N'COD', NULL, NULL, N'Giao hàng thành công', NULL),
(49, 3, N'2026-03-14 23:16:36', 4558314.469506325, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(50, 6, N'2026-03-19 23:25:06', 2487758.1356444936, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(51, 7, N'2026-03-22 22:53:32', 2352952.9568394204, NULL, NULL, N'Banking', NULL, NULL, N'Đã hoàn tiền', NULL),
(52, 7, N'2026-03-22 23:26:00', 6463785.607212954, NULL, NULL, N'Momo', NULL, NULL, N'Đã hoàn tiền', NULL),
(53, 6, N'2026-03-23 01:43:13', 2645107.5456339004, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(54, 6, N'2026-03-23 01:43:44', 2352952.9568394204, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(55, 6, N'2026-03-23 01:46:27', 2193704.7867837404, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(56, 6, N'2026-03-23 02:24:37', 4188179.800694975, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(57, 6, N'2026-03-23 22:53:48', 2193704.7867837404, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(58, 7, N'2026-03-23 23:26:07', 2193704.7867837404, NULL, NULL, N'Momo', NULL, NULL, N'Đang giao', NULL),
(59, 7, N'2026-03-23 23:33:27', 2352952.9568394204, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(60, 6, N'2026-03-24 07:48:56', 1835226.843855555, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(61, 6, N'2026-03-25 14:32:03', 2352952.9568394204, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(62, 4, N'2026-03-27 23:00:06', 1204826.8305648367, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(63, 6, N'2026-03-30 10:14:05', 2193704.7867837404, NULL, NULL, N'Banking', NULL, NULL, N'Chờ xác nhận', NULL),
(64, 6, N'2026-03-31 17:46:52', 2352952.9568394204, NULL, NULL, N'Momo', NULL, NULL, N'Chờ xác nhận', NULL),
(65, 9, N'2026-04-14 10:07:23', 1835226.843855555, NULL, NULL, N'COD', NULL, NULL, N'Paid', NULL),
(66, 6, N'2026-04-19 00:19:44', 2352952.9568394204, N'Chưa cập nhật', N'0981234567', N'ZaloPay', NULL, NULL, N'Giao hàng thành công', NULL),
(67, 6, N'2026-04-19 11:00:11', 2352952.9568394204, N'Chưa cập nhật', N'0981234567', N'Banking', NULL, NULL, N'Returned', NULL),
(68, 6, N'2026-05-02 22:06:54', 5900000, N'Chưa cập nhật', N'0981234567', N'Banking', NULL, NULL, N'Waiting', NULL);
SET IDENTITY_INSERT dbo.[orders] OFF;
GO


-- DATA: order_items
SET IDENTITY_INSERT dbo.[order_items] ON;
INSERT INTO dbo.[order_items] ([id], [order_id], [product_id], [quantity], [price], [selected_batch_code], [price_at_purchase], [status]) VALUES
(1, 1, 2, 1, 3300000, NULL, NULL, N'Normal'),
(2, 2, 2, 1, 3300000, NULL, NULL, N'Normal'),
(3, 3, 3, 1, 2200000, NULL, NULL, N'Normal'),
(4, 3, 4, 1, 8200000, NULL, NULL, N'Normal'),
(5, 3, 2, 1, 3300000, NULL, NULL, N'Normal'),
(7, 4, 3, 1, 2200000, NULL, NULL, N'Normal'),
(8, 5, 3, 2, 2200000, NULL, NULL, N'Normal'),
(9, 6, 3, 1, 2200000, NULL, NULL, N'Normal'),
(10, 6, 2, 2, 3300000, NULL, NULL, N'Normal'),
(11, 6, 1, 2, 2950000, NULL, NULL, N'Normal'),
(12, 6, 4, 1, 8200000, NULL, NULL, N'Normal'),
(13, 7, 11, 1, 3100000, NULL, NULL, N'Normal'),
(14, 7, 10, 1, 2300000, NULL, NULL, N'Normal'),
(15, 7, 12, 1, 1900000, NULL, NULL, N'Normal'),
(16, 7, 4, 1, 8200000, NULL, NULL, N'Normal'),
(17, 8, 1, 1, 2950000, NULL, NULL, N'Normal'),
(18, 8, 2, 1, 3300000, NULL, NULL, N'Normal'),
(19, 9, 3, 1, 2200000, NULL, NULL, N'Normal'),
(20, 10, 3, 1, 2200000, NULL, NULL, N'Normal'),
(21, 11, 3, 1, 2200000, NULL, NULL, N'Normal'),
(22, 12, 5, 1, 3100000, NULL, NULL, N'Normal'),
(23, 12, 8, 1, 3500000, NULL, NULL, N'Normal'),
(24, 13, 4, 1, 8200000, NULL, NULL, N'Normal'),
(25, 14, 2, 1, 3300000, NULL, NULL, N'Normal'),
(26, 15, 3, 1, 2200000, NULL, NULL, N'Normal'),
(27, 16, 14, 1, 4200000, NULL, NULL, N'Normal'),
(28, 17, 4, 1, 8200000, NULL, NULL, N'Normal'),
(29, 18, 11, 1, 3100000, NULL, NULL, N'Normal'),
(30, 19, 2, 1, 3300000, NULL, NULL, N'Normal'),
(31, 20, 1, 1, 2950000, NULL, NULL, N'Normal'),
(32, 21, 4, 1, 8200000, NULL, NULL, N'Normal'),
(33, 22, 3, 1, 2200000, NULL, NULL, N'Normal'),
(34, 22, 4, 1, 8200000, NULL, NULL, N'Normal'),
(35, 23, 11, 1, 3100000, NULL, NULL, N'Normal'),
(36, 23, 5, 1, 3100000, NULL, NULL, N'Normal'),
(37, 24, 2, 1, 3300000, NULL, NULL, N'Normal'),
(38, 24, 1, 1, 2950000, NULL, NULL, N'Normal'),
(39, 30, 2, 1, 3300000, NULL, NULL, N'Normal'),
(40, 30, 1, 1, 2950000, NULL, NULL, N'Normal'),
(41, 32, 2, 1, 3300000, NULL, NULL, N'Normal'),
(42, 33, 4, 1, 8200000, NULL, NULL, N'Normal'),
(43, 34, 3, 1, 2200000, NULL, NULL, N'Normal'),
(44, 34, 4, 1, 8200000, NULL, NULL, N'Normal'),
(45, 37, 4, 2, 8200000, NULL, NULL, N'Normal'),
(47, 39, 1, 1, 2950000, NULL, NULL, N'Normal'),
(48, 40, 2, 1, 3300000, NULL, NULL, N'Normal'),
(49, 41, 8, 1, 3500000, NULL, NULL, N'Normal'),
(51, 43, 5, 1, 3100000, NULL, NULL, N'Normal'),
(52, 43, 22, 1, 7800000, NULL, NULL, N'Normal'),
(53, 44, 3, 1, 1835226.843855555, NULL, NULL, N'Normal'),
(54, 45, 2, 1, 2352952.9568394204, NULL, NULL, N'Normal'),
(55, 46, 7, 1, 2364609.682722585, NULL, NULL, N'Normal'),
(56, 47, 3, 1, 1835226.843855555, NULL, NULL, N'Normal'),
(57, 48, 9, 1, 2645107.5456339004, NULL, NULL, N'Normal'),
(58, 49, 1, 1, 2193704.7867837404, NULL, NULL, N'Normal'),
(59, 49, 7, 1, 2364609.682722585, NULL, NULL, N'Normal'),
(60, 50, 8, 1, 2487758.1356444936, NULL, NULL, N'Normal'),
(61, 51, 2, 1, 2352952.9568394204, NULL, NULL, N'Normal'),
(62, 52, 10, 1, 1611417.788845876, NULL, NULL, N'Normal'),
(63, 52, 7, 1, 2364609.682722585, NULL, NULL, N'Normal'),
(64, 52, 8, 1, 2487758.1356444936, NULL, NULL, N'Normal'),
(65, 53, 9, 1, 2645107.5456339004, NULL, NULL, N'Normal'),
(66, 54, 2, 1, 2352952.9568394204, NULL, NULL, N'Normal'),
(67, 55, 1, 1, 2193704.7867837404, NULL, NULL, N'Normal'),
(68, 56, 3, 1, 1835226.843855555, NULL, NULL, N'Normal'),
(69, 56, 2, 1, 2352952.9568394204, NULL, NULL, N'Normal'),
(70, 57, 1, 1, 2193704.7867837404, NULL, NULL, N'Normal'),
(71, 58, 1, 1, 2193704.7867837404, NULL, NULL, N'Normal'),
(72, 59, 2, 1, 2352952.9568394204, NULL, NULL, N'Normal'),
(73, 60, 3, 1, 1835226.843855555, NULL, NULL, N'Normal'),
(74, 61, 2, 1, 2352952.9568394204, NULL, NULL, N'Normal'),
(75, 62, 13, 1, 1204826.8305648367, NULL, NULL, N'Normal'),
(76, 63, 1, 1, 2193704.7867837404, NULL, NULL, N'Normal'),
(77, 64, 2, 1, 2352952.9568394204, NULL, NULL, N'Normal'),
(78, 65, 3, 1, 1835226.843855555, NULL, NULL, N'Normal'),
(79, 66, 2, 1, 2352952.9568394204, NULL, 2352952.9568394204, N'Normal'),
(80, 67, 2, 1, 2352952.9568394204, NULL, 2352952.9568394204, N'Normal'),
(81, 68, 1, 2, 2950000, NULL, 2950000, N'Normal');
SET IDENTITY_INSERT dbo.[order_items] OFF;
GO


-- DATA: wishlist
-- Không có dữ liệu insert trong file gốc.
GO

CREATE UNIQUE INDEX [UX_products_sku_not_null]
ON dbo.[products] ([sku])
WHERE [sku] IS NOT NULL;
GO

ALTER TABLE dbo.[products]
ADD CONSTRAINT [FK_products_categories]
FOREIGN KEY ([id_category]) REFERENCES dbo.[categories]([id])
ON DELETE CASCADE ON UPDATE CASCADE;
GO

ALTER TABLE dbo.[products]
ADD CONSTRAINT [FK_products_brand]
FOREIGN KEY ([id_brand]) REFERENCES dbo.[brand]([id]);
GO

ALTER TABLE dbo.[orders]
ADD CONSTRAINT [FK_orders_users]
FOREIGN KEY ([user_id]) REFERENCES dbo.[users]([id]);
GO

ALTER TABLE dbo.[order_items]
ADD CONSTRAINT [FK_order_items_orders]
FOREIGN KEY ([order_id]) REFERENCES dbo.[orders]([id]);
GO

ALTER TABLE dbo.[order_items]
ADD CONSTRAINT [FK_order_items_products]
FOREIGN KEY ([product_id]) REFERENCES dbo.[products]([id]);
GO

ALTER TABLE dbo.[wishlist]
ADD CONSTRAINT [FK_wishlist_users]
FOREIGN KEY ([user_id]) REFERENCES dbo.[users]([id])
ON DELETE CASCADE;
GO

ALTER TABLE dbo.[wishlist]
ADD CONSTRAINT [FK_wishlist_products]
FOREIGN KEY ([product_id]) REFERENCES dbo.[products]([id])
ON DELETE CASCADE;
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
