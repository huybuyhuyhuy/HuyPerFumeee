-- Phase 5: reviews, wishlist consistency, recently viewed, and recommendation indexes.
-- Run after Phase 1-4 migrations and after backing up the database.

IF OBJECT_ID(N'dbo.wishlist', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.wishlist (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_wishlist_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_wishlist_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_wishlist_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE
    );
END;
GO

;WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, product_id ORDER BY created_at DESC, id DESC) AS rn
    FROM dbo.wishlist
)
DELETE FROM duplicates
WHERE rn > 1;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_wishlist_user_product' AND object_id = OBJECT_ID('dbo.wishlist')
)
BEGIN
    CREATE UNIQUE INDEX UX_wishlist_user_product
    ON dbo.wishlist(user_id, product_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_wishlist_product' AND object_id = OBJECT_ID('dbo.wishlist')
)
BEGIN
    CREATE INDEX IX_wishlist_product
    ON dbo.wishlist(product_id, created_at DESC)
    INCLUDE (user_id);
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
        CONSTRAINT FK_product_reviews_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
        CONSTRAINT FK_product_reviews_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_product_reviews_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT FK_product_reviews_moderators FOREIGN KEY (moderated_by) REFERENCES dbo.users(id),
        CONSTRAINT CK_product_reviews_rating CHECK (rating BETWEEN 1 AND 5),
        CONSTRAINT CK_product_reviews_status CHECK (status IN (N'PENDING', N'APPROVED', N'REJECTED', N'FLAGGED'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_reviews_user_product_active' AND object_id = OBJECT_ID('dbo.product_reviews')
)
BEGIN
    CREATE UNIQUE INDEX UX_product_reviews_user_product_active
    ON dbo.product_reviews(user_id, product_id)
    WHERE deleted_at IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_product_reviews_product_status' AND object_id = OBJECT_ID('dbo.product_reviews')
)
BEGIN
    CREATE INDEX IX_product_reviews_product_status
    ON dbo.product_reviews(product_id, status, created_at DESC)
    INCLUDE (rating, user_id, deleted_at);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_product_reviews_moderation' AND object_id = OBJECT_ID('dbo.product_reviews')
)
BEGIN
    CREATE INDEX IX_product_reviews_moderation
    ON dbo.product_reviews(status, created_at DESC)
    INCLUDE (product_id, user_id, rating, deleted_at);
END;
GO

IF OBJECT_ID(N'dbo.product_recent_views', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_recent_views (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NULL,
        view_token NVARCHAR(160) NULL,
        product_id INT NOT NULL,
        view_count INT NOT NULL CONSTRAINT DF_product_recent_views_count DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_product_recent_views_created_at DEFAULT SYSUTCDATETIME(),
        last_viewed_at DATETIME2 NOT NULL CONSTRAINT DF_product_recent_views_last DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_product_recent_views_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_product_recent_views_products FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
        CONSTRAINT CK_product_recent_views_owner CHECK (user_id IS NOT NULL OR view_token IS NOT NULL),
        CONSTRAINT CK_product_recent_views_count CHECK (view_count > 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_recent_views_user_product' AND object_id = OBJECT_ID('dbo.product_recent_views')
)
BEGIN
    CREATE UNIQUE INDEX UX_product_recent_views_user_product
    ON dbo.product_recent_views(user_id, product_id)
    WHERE user_id IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'UX_product_recent_views_token_product' AND object_id = OBJECT_ID('dbo.product_recent_views')
)
BEGIN
    CREATE UNIQUE INDEX UX_product_recent_views_token_product
    ON dbo.product_recent_views(view_token, product_id)
    WHERE view_token IS NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = 'IX_product_recent_views_trending' AND object_id = OBJECT_ID('dbo.product_recent_views')
)
BEGIN
    CREATE INDEX IX_product_recent_views_trending
    ON dbo.product_recent_views(last_viewed_at DESC, product_id)
    INCLUDE (view_count, user_id, view_token);
END;
GO

IF COL_LENGTH('dbo.products', 'rating_average') IS NOT NULL
AND COL_LENGTH('dbo.products', 'review_count') IS NOT NULL
BEGIN
    UPDATE p
    SET rating_average = ISNULL(stats.rating_average, 0),
        review_count = ISNULL(stats.review_count, 0)
    FROM dbo.products p
    OUTER APPLY (
        SELECT AVG(CAST(rating AS FLOAT)) AS rating_average,
               COUNT(*) AS review_count
        FROM dbo.product_reviews
        WHERE product_id = p.id
          AND status = N'APPROVED'
          AND deleted_at IS NULL
    ) stats;
END;
GO
