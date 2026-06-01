IF OBJECT_ID('dbo.vouchers', 'U') IS NULL
BEGIN
  CREATE TABLE vouchers (
    id INT IDENTITY PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    discount_type NVARCHAR(20) NOT NULL,
    discount_value FLOAT NOT NULL,
    min_order_value FLOAT NULL,
    max_discount_value FLOAT NULL,
    usage_limit INT NULL,
    used_count INT NOT NULL CONSTRAINT DF_vouchers_used_count DEFAULT 0,
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    status BIT NOT NULL CONSTRAINT DF_vouchers_status DEFAULT 1,
    created_at DATETIME NOT NULL CONSTRAINT DF_vouchers_created_at DEFAULT GETDATE()
  );
END;
GO
