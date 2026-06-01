IF OBJECT_ID('dbo.product_batches', 'U') IS NULL
BEGIN
  CREATE TABLE product_batches (
    id INT IDENTITY PRIMARY KEY,
    product_id INT NOT NULL,
    batch_code NVARCHAR(100) NULL,
    total_volume_ml INT NOT NULL,
    remaining_volume_ml INT NOT NULL,
    import_price FLOAT NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_product_batches_status DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL CONSTRAINT DF_product_batches_created_at DEFAULT GETDATE()
  );
END;
GO

IF OBJECT_ID('dbo.decant_options', 'U') IS NULL
BEGIN
  CREATE TABLE decant_options (
    id INT IDENTITY PRIMARY KEY,
    product_id INT NOT NULL,
    volume_ml INT NOT NULL,
    price FLOAT NOT NULL,
    status BIT NOT NULL CONSTRAINT DF_decant_options_status DEFAULT 1,
    created_at DATETIME NOT NULL CONSTRAINT DF_decant_options_created_at DEFAULT GETDATE()
  );
END;
GO

IF COL_LENGTH('order_items', 'item_type') IS NULL
BEGIN
  ALTER TABLE order_items ADD item_type NVARCHAR(30) NOT NULL CONSTRAINT DF_order_items_item_type DEFAULT 'FULL_BOTTLE';
END;
GO

IF COL_LENGTH('order_items', 'selected_volume_ml') IS NULL
BEGIN
  ALTER TABLE order_items ADD selected_volume_ml INT NULL;
END;
GO

IF COL_LENGTH('order_items', 'source_batch_id') IS NULL
BEGIN
  ALTER TABLE order_items ADD source_batch_id INT NULL;
END;
GO
