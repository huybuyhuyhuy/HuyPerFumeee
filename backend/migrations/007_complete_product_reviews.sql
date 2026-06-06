-- Complete product review workflow schema.
-- Safe to run multiple times; it only adds missing structures and recalculates stats.

IF COL_LENGTH(N'dbo.products', N'rating_average') IS NULL
BEGIN
  ALTER TABLE dbo.products
  ADD rating_average FLOAT NOT NULL
      CONSTRAINT DF_products_rating_average DEFAULT 0;
END;
GO

IF COL_LENGTH(N'dbo.products', N'review_count') IS NULL
BEGIN
  ALTER TABLE dbo.products
  ADD review_count INT NOT NULL
      CONSTRAINT DF_products_review_count DEFAULT 0;
END;
GO

IF OBJECT_ID(N'dbo.product_reviews', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.product_reviews (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NULL,
    rating INT NOT NULL,
    title NVARCHAR(180) NULL,
    comment NVARCHAR(2000) NULL,
    status NVARCHAR(30) NOT NULL CONSTRAINT DF_product_reviews_status DEFAULT N'PENDING',
    moderation_note NVARCHAR(500) NULL,
    moderated_by INT NULL,
    moderated_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_product_reviews_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,
    CONSTRAINT FK_product_reviews_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
    CONSTRAINT FK_product_reviews_users FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_product_reviews_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
    CONSTRAINT FK_product_reviews_moderators FOREIGN KEY (moderated_by) REFERENCES dbo.users(id)
  );
END;
GO

IF COL_LENGTH(N'dbo.product_reviews', N'order_id') IS NULL
  ALTER TABLE dbo.product_reviews ADD order_id INT NULL;
GO
IF COL_LENGTH(N'dbo.product_reviews', N'title') IS NULL
  ALTER TABLE dbo.product_reviews ADD title NVARCHAR(180) NULL;
GO
IF COL_LENGTH(N'dbo.product_reviews', N'comment') IS NULL
  ALTER TABLE dbo.product_reviews ADD comment NVARCHAR(2000) NULL;
GO
IF COL_LENGTH(N'dbo.product_reviews', N'status') IS NULL
  ALTER TABLE dbo.product_reviews ADD status NVARCHAR(30) NOT NULL CONSTRAINT DF_product_reviews_status_late DEFAULT N'PENDING';
GO
IF COL_LENGTH(N'dbo.product_reviews', N'moderation_note') IS NULL
  ALTER TABLE dbo.product_reviews ADD moderation_note NVARCHAR(500) NULL;
GO
IF COL_LENGTH(N'dbo.product_reviews', N'moderated_by') IS NULL
  ALTER TABLE dbo.product_reviews ADD moderated_by INT NULL;
GO
IF COL_LENGTH(N'dbo.product_reviews', N'moderated_at') IS NULL
  ALTER TABLE dbo.product_reviews ADD moderated_at DATETIME2 NULL;
GO
IF COL_LENGTH(N'dbo.product_reviews', N'created_at') IS NULL
  ALTER TABLE dbo.product_reviews ADD created_at DATETIME2 NOT NULL CONSTRAINT DF_product_reviews_created_at_late DEFAULT SYSUTCDATETIME();
GO
IF COL_LENGTH(N'dbo.product_reviews', N'updated_at') IS NULL
  ALTER TABLE dbo.product_reviews ADD updated_at DATETIME2 NULL;
GO
IF COL_LENGTH(N'dbo.product_reviews', N'deleted_at') IS NULL
  ALTER TABLE dbo.product_reviews ADD deleted_at DATETIME2 NULL;
GO

UPDATE dbo.product_reviews
SET status = N'PENDING'
WHERE status IS NULL OR LTRIM(RTRIM(status)) = N'';
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = N'CK_product_reviews_rating'
    AND parent_object_id = OBJECT_ID(N'dbo.product_reviews')
)
BEGIN
  ALTER TABLE dbo.product_reviews WITH NOCHECK
  ADD CONSTRAINT CK_product_reviews_rating CHECK (rating BETWEEN 1 AND 5);
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = N'CK_product_reviews_status'
    AND parent_object_id = OBJECT_ID(N'dbo.product_reviews')
)
BEGIN
  ALTER TABLE dbo.product_reviews WITH NOCHECK
  ADD CONSTRAINT CK_product_reviews_status
  CHECK (status IN (N'PENDING', N'APPROVED', N'REJECTED', N'FLAGGED'));
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_product_reviews_product_status'
    AND object_id = OBJECT_ID(N'dbo.product_reviews')
)
BEGIN
  CREATE INDEX IX_product_reviews_product_status
  ON dbo.product_reviews(product_id, status, created_at DESC)
  INCLUDE (rating, user_id, order_id, deleted_at);
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_product_reviews_moderation'
    AND object_id = OBJECT_ID(N'dbo.product_reviews')
)
BEGIN
  CREATE INDEX IX_product_reviews_moderation
  ON dbo.product_reviews(status, created_at DESC)
  INCLUDE (product_id, user_id, rating, deleted_at);
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'UX_product_reviews_user_product_active'
    AND object_id = OBJECT_ID(N'dbo.product_reviews')
)
AND NOT EXISTS (
  SELECT 1
  FROM dbo.product_reviews
  WHERE deleted_at IS NULL
  GROUP BY user_id, product_id
  HAVING COUNT(*) > 1
)
BEGIN
  CREATE UNIQUE INDEX UX_product_reviews_user_product_active
  ON dbo.product_reviews(user_id, product_id)
  WHERE deleted_at IS NULL;
END;
GO

;WITH review_stats AS (
  SELECT product_id,
         AVG(CAST(rating AS FLOAT)) AS rating_average,
         COUNT(*) AS review_count
  FROM dbo.product_reviews
  WHERE status = N'APPROVED'
    AND deleted_at IS NULL
  GROUP BY product_id
)
UPDATE p
SET rating_average = ISNULL(rs.rating_average, 0),
    review_count = ISNULL(rs.review_count, 0)
FROM dbo.products p
LEFT JOIN review_stats rs ON rs.product_id = p.id;
GO
