IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
BEGIN
  IF COL_LENGTH(N'dbo.users', N'total_spent') IS NULL
  BEGIN
    ALTER TABLE dbo.users
    ADD total_spent FLOAT NOT NULL CONSTRAINT DF_users_total_spent_membership DEFAULT (0);
  END;

  IF COL_LENGTH(N'dbo.users', N'membership_tier') IS NULL
  BEGIN
    ALTER TABLE dbo.users
    ADD membership_tier NVARCHAR(30) NOT NULL CONSTRAINT DF_users_membership_tier_membership DEFAULT (N'NORMAL');
  END;

  IF COL_LENGTH(N'dbo.users', N'membership_updated_at') IS NULL
  BEGIN
    ALTER TABLE dbo.users
    ADD membership_updated_at DATETIME NULL;
  END;
END;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.orders', N'U') IS NOT NULL
BEGIN
  ;WITH membership_spending AS (
    SELECT
      user_id,
      SUM(ISNULL(total, 0)) AS total_spent
    FROM dbo.orders
    WHERE UPPER(ISNULL(status, N'')) IN (
      N'DELIVERED',
      N'COMPLETED',
      N'ĐÃ GIAO HÀNG',
      N'DA GIAO HANG',
      N'GIAO HÀNG THÀNH CÔNG',
      N'GIAO HANG THANH CONG',
      N'ĐÃ HOÀN TẤT',
      N'DA HOAN TAT',
      N'HOÀN TẤT',
      N'HOAN TAT'
    )
    GROUP BY user_id
  )
  UPDATE u
  SET
    total_spent = ISNULL(ms.total_spent, 0),
    membership_tier = CASE
      WHEN ISNULL(ms.total_spent, 0) >= 10000000 THEN N'DIAMOND'
      WHEN ISNULL(ms.total_spent, 0) >= 5000000 THEN N'GOLD'
      WHEN ISNULL(ms.total_spent, 0) >= 3500000 THEN N'SILVER'
      WHEN ISNULL(ms.total_spent, 0) >= 2500000 THEN N'BRONZE'
      ELSE N'NORMAL'
    END,
    membership_updated_at = SYSUTCDATETIME()
  FROM dbo.users u
  LEFT JOIN membership_spending ms ON ms.user_id = u.id;
END;
GO
