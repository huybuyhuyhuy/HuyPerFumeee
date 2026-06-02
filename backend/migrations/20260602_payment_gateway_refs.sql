IF OBJECT_ID(N'dbo.orders', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.orders', N'momo_order_id') IS NULL
        ALTER TABLE dbo.orders ADD momo_order_id NVARCHAR(120) NULL;

    IF COL_LENGTH(N'dbo.orders', N'momo_trans_id') IS NULL
        ALTER TABLE dbo.orders ADD momo_trans_id NVARCHAR(120) NULL;

    IF COL_LENGTH(N'dbo.orders', N'zalopay_app_trans_id') IS NULL
        ALTER TABLE dbo.orders ADD zalopay_app_trans_id NVARCHAR(120) NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_orders_momo_order_id'
          AND object_id = OBJECT_ID(N'dbo.orders')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_orders_momo_order_id
        ON dbo.orders(momo_order_id)
        WHERE momo_order_id IS NOT NULL;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_orders_zalopay_app_trans_id'
          AND object_id = OBJECT_ID(N'dbo.orders')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_orders_zalopay_app_trans_id
        ON dbo.orders(zalopay_app_trans_id)
        WHERE zalopay_app_trans_id IS NOT NULL;
    END;
END;
GO
