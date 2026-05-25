-- Phase 6: Admin CMS - Banners table
-- Run against huyperfume database

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'banners')
BEGIN
  CREATE TABLE banners (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255),
    subtitle NVARCHAR(500),
    image_url NVARCHAR(1000) NOT NULL,
    link_url NVARCHAR(1000),
    sort_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
  );
END
