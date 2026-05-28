-- Canonical order lifecycle and audit timeline.

IF OBJECT_ID(N'dbo.order_status_history', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_status_history (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        order_id INT NOT NULL,
        old_status NVARCHAR(50) NULL,
        new_status NVARCHAR(50) NOT NULL,
        changed_by INT NULL,
        note NVARCHAR(500) NULL,
        created_at DATETIME NOT NULL CONSTRAINT DF_order_status_history_created_at DEFAULT GETDATE(),
        CONSTRAINT FK_order_status_history_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT FK_order_status_history_users FOREIGN KEY (changed_by) REFERENCES dbo.users(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_order_status_history_order_created'
      AND object_id = OBJECT_ID(N'dbo.order_status_history')
)
BEGIN
    CREATE INDEX IX_order_status_history_order_created
        ON dbo.order_status_history(order_id, created_at, id);
END;
GO

INSERT INTO dbo.order_status_history (order_id, old_status, new_status, note, created_at)
SELECT
    o.id,
    CASE
        WHEN UPPER(LTRIM(RTRIM(ISNULL(o.status, N'')))) IN
            (N'PENDING', N'CONFIRMED', N'PACKING', N'SHIPPING', N'DELIVERED', N'COMPLETED', N'CANCELLED', N'REFUNDED')
        THEN NULL
        ELSE o.status
    END,
    CASE UPPER(LTRIM(RTRIM(ISNULL(o.status, N''))))
        WHEN N'PENDING' THEN N'PENDING'
        WHEN N'CONFIRMED' THEN N'CONFIRMED'
        WHEN N'PACKING' THEN N'PACKING'
        WHEN N'SHIPPING' THEN N'SHIPPING'
        WHEN N'DELIVERED' THEN N'DELIVERED'
        WHEN N'COMPLETED' THEN N'COMPLETED'
        WHEN N'CANCELLED' THEN N'CANCELLED'
        WHEN N'REFUNDED' THEN N'REFUNDED'
        WHEN N'WAITING' THEN N'PENDING'
        WHEN N'CHỜ XÁC NHẬN' THEN N'PENDING'
        WHEN N'PAID' THEN N'CONFIRMED'
        WHEN N'ĐÃ XÁC NHẬN' THEN N'CONFIRMED'
        WHEN N'PROCESSING' THEN N'PACKING'
        WHEN N'SHIPPED' THEN N'SHIPPING'
        WHEN N'ĐANG GIAO' THEN N'SHIPPING'
        WHEN N'GIAO HÀNG THÀNH CÔNG' THEN N'DELIVERED'
        WHEN N'CANCELLED' THEN N'CANCELLED'
        WHEN N'CANCELED' THEN N'CANCELLED'
        WHEN N'ĐÃ HỦY' THEN N'CANCELLED'
        WHEN N'FAILED' THEN N'CANCELLED'
        WHEN N'RETURNED' THEN N'REFUNDED'
        WHEN N'ĐANG HOÀN TIỀN' THEN N'REFUNDED'
        WHEN N'ĐÃ HOÀN TIỀN' THEN N'REFUNDED'
        WHEN N'' THEN N'PENDING'
        ELSE N'PENDING'
    END,
    N'Khởi tạo lịch sử trạng thái khi chuẩn hóa dữ liệu',
    ISNULL(o.created_at, GETDATE())
FROM dbo.orders o
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.order_status_history h WHERE h.order_id = o.id
);
GO

UPDATE dbo.orders
SET status = CASE UPPER(LTRIM(RTRIM(ISNULL(status, N''))))
    WHEN N'PENDING' THEN N'PENDING'
    WHEN N'CONFIRMED' THEN N'CONFIRMED'
    WHEN N'PACKING' THEN N'PACKING'
    WHEN N'SHIPPING' THEN N'SHIPPING'
    WHEN N'DELIVERED' THEN N'DELIVERED'
    WHEN N'COMPLETED' THEN N'COMPLETED'
    WHEN N'CANCELLED' THEN N'CANCELLED'
    WHEN N'REFUNDED' THEN N'REFUNDED'
    WHEN N'WAITING' THEN N'PENDING'
    WHEN N'CHỜ XÁC NHẬN' THEN N'PENDING'
    WHEN N'PAID' THEN N'CONFIRMED'
    WHEN N'ĐÃ XÁC NHẬN' THEN N'CONFIRMED'
    WHEN N'PROCESSING' THEN N'PACKING'
    WHEN N'SHIPPED' THEN N'SHIPPING'
    WHEN N'ĐANG GIAO' THEN N'SHIPPING'
    WHEN N'GIAO HÀNG THÀNH CÔNG' THEN N'DELIVERED'
    WHEN N'CANCELLED' THEN N'CANCELLED'
    WHEN N'CANCELED' THEN N'CANCELLED'
    WHEN N'ĐÃ HỦY' THEN N'CANCELLED'
    WHEN N'FAILED' THEN N'CANCELLED'
    WHEN N'RETURNED' THEN N'REFUNDED'
    WHEN N'ĐANG HOÀN TIỀN' THEN N'REFUNDED'
    WHEN N'ĐÃ HOÀN TIỀN' THEN N'REFUNDED'
    WHEN N'' THEN N'PENDING'
    ELSE N'PENDING'
END;
GO

DECLARE @defaultConstraint NVARCHAR(128);
SELECT @defaultConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID(N'dbo.orders') AND c.name = N'status';

IF @defaultConstraint IS NOT NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.orders DROP CONSTRAINT [' + @defaultConstraint + N']');
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.default_constraints WHERE name = N'DF_orders_status_canonical'
)
BEGIN
    ALTER TABLE dbo.orders
        ADD CONSTRAINT DF_orders_status_canonical DEFAULT N'PENDING' FOR status;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_orders_status_canonical'
      AND parent_object_id = OBJECT_ID(N'dbo.orders')
)
BEGIN
    ALTER TABLE dbo.orders WITH CHECK ADD CONSTRAINT CK_orders_status_canonical
        CHECK (status IN (
            N'PENDING', N'CONFIRMED', N'PACKING', N'SHIPPING',
            N'DELIVERED', N'COMPLETED', N'CANCELLED', N'REFUNDED'
        ));
END;
GO
