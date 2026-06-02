-- Seed a small set of approved product reviews for demo/product-detail UI.
-- Safe to run multiple times: users and reviews are matched by email/product.

IF OBJECT_ID(N'dbo.product_reviews', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.products', N'U') IS NOT NULL
BEGIN
    DECLARE @reviewUsers TABLE (
        email NVARCHAR(255) NOT NULL PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(20) NOT NULL
    );
    DECLARE @sampleProducts TABLE (
        id INT NOT NULL PRIMARY KEY,
        product_rank INT NOT NULL
    );

    INSERT INTO @reviewUsers (email, name, phone)
    VALUES
        (N'review.mai@huyperfume.local', N'Minh Anh', N'0901000001'),
        (N'review.linh@huyperfume.local', N'Hoang Linh', N'0901000002'),
        (N'review.khoa@huyperfume.local', N'Duc Khoa', N'0901000003'),
        (N'review.trang@huyperfume.local', N'Thu Trang', N'0901000004'),
        (N'review.nam@huyperfume.local', N'Gia Nam', N'0901000005'),
        (N'review.ha@huyperfume.local', N'Ngoc Ha', N'0901000006'),
        (N'review.quyen@huyperfume.local', N'Bao Quyen', N'0901000007'),
        (N'review.phuc@huyperfume.local', N'Minh Phuc', N'0901000008');

    INSERT INTO dbo.users (name, email, phone, password, role, address)
    SELECT ru.name,
           ru.email,
           ru.phone,
           N'$2b$12$huyperfume.seed.review.account.only',
           N'USER',
           N'Tài khoản mẫu dùng cho review sản phẩm'
    FROM @reviewUsers ru
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.users u
        WHERE u.email = ru.email
    );

    IF COL_LENGTH(N'dbo.users', N'status') IS NOT NULL
    BEGIN
        UPDATE u
        SET status = N'ACTIVE'
        FROM dbo.users u
        INNER JOIN @reviewUsers ru ON ru.email = u.email
        WHERE u.status IS NULL OR u.status <> N'ACTIVE';
    END;

    IF COL_LENGTH(N'dbo.users', N'email_verified_at') IS NOT NULL
    BEGIN
        UPDATE u
        SET email_verified_at = COALESCE(u.email_verified_at, SYSUTCDATETIME())
        FROM dbo.users u
        INNER JOIN @reviewUsers ru ON ru.email = u.email;
    END;

    INSERT INTO @sampleProducts (id, product_rank)
    SELECT id, product_rank
    FROM (
        SELECT TOP (4)
            p.id,
            ROW_NUMBER() OVER (ORDER BY p.id DESC) AS product_rank
        FROM dbo.products p
        WHERE (COL_LENGTH(N'dbo.products', N'deleted_at') IS NULL OR p.deleted_at IS NULL)
          AND (COL_LENGTH(N'dbo.products', N'status') IS NULL OR ISNULL(p.status, 1) = 1)
        ORDER BY p.id DESC
    ) ranked_products;

    ;WITH
    review_templates AS (
        SELECT 1 AS product_rank, 1 AS user_rank, 5 AS rating,
               N'Mùi hương sang và rất dễ dùng' AS title,
               N'Mùi lên da mềm, sạch và có độ sang vừa đủ. Mình dùng cả ngày vẫn thấy dễ chịu, phù hợp đi làm.' AS comment
        UNION ALL SELECT 1, 2, 5,
               N'Đóng gói chỉn chu',
               N'Hàng nhận được đúng như mô tả, hộp đẹp và chai được bọc rất kỹ. Mùi giữ khá ổn trên da.'
        UNION ALL SELECT 2, 3, 5,
               N'Ấn tượng ngay từ lần đầu thử',
               N'Tông mùi nam tính, lịch sự và không bị gắt. Dùng buổi tối rất hợp.'
        UNION ALL SELECT 2, 4, 4,
               N'Đáng tiền trong tầm giá',
               N'Mùi rõ nét, độ tỏa vừa phải. Nếu xịt ít thì đi làm cũng không quá nồng.'
        UNION ALL SELECT 3, 5, 5,
               N'Hương rất tinh tế',
               N'Cảm giác cao cấp, lớp hương sau mượt và giữ được dấu ấn riêng. Sẽ mua lại khi hết.'
        UNION ALL SELECT 3, 6, 4,
               N'Phù hợp dùng hằng ngày',
               N'Không quá nồng, không quá ngọt. Đoạn mở đầu sáng và khô hương sau rất dễ gần.'
        UNION ALL SELECT 4, 7, 5,
               N'Rất hợp làm quà tặng',
               N'Người nhận rất thích vì mùi thanh lịch và hộp nhìn sang. Shop gói hàng cẩn thận.'
        UNION ALL SELECT 4, 8, 5,
               N'Trải nghiệm tốt',
               N'Sản phẩm đúng kỳ vọng, hương ổn định và giao hàng nhanh. Phần review trên web nhìn rõ ràng, dễ tham khảo.'
    ),
    seed_reviews AS (
        SELECT
            sp.id AS product_id,
            u.id AS user_id,
            rt.rating,
            rt.title,
            rt.comment
        FROM review_templates rt
        INNER JOIN @sampleProducts sp ON sp.product_rank = rt.product_rank
        INNER JOIN (
            SELECT
                u.id,
                u.email,
                ROW_NUMBER() OVER (ORDER BY u.id ASC) AS user_rank
            FROM dbo.users u
            INNER JOIN @reviewUsers ru ON ru.email = u.email
        ) u ON u.user_rank = rt.user_rank
    )
    INSERT INTO dbo.product_reviews (
        product_id,
        user_id,
        order_id,
        rating,
        title,
        comment,
        status,
        moderation_note,
        moderated_by,
        moderated_at,
        created_at,
        updated_at,
        deleted_at
    )
    SELECT
        sr.product_id,
        sr.user_id,
        NULL,
        sr.rating,
        sr.title,
        sr.comment,
        N'APPROVED',
        N'Seed review demo for product detail page',
        NULL,
        SYSUTCDATETIME(),
        DATEADD(MINUTE, -sr.user_id, SYSUTCDATETIME()),
        NULL,
        NULL
    FROM seed_reviews sr
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.product_reviews r
        WHERE r.product_id = sr.product_id
          AND r.user_id = sr.user_id
          AND r.deleted_at IS NULL
    );

    IF COL_LENGTH(N'dbo.products', N'rating_average') IS NOT NULL
       AND COL_LENGTH(N'dbo.products', N'review_count') IS NOT NULL
    BEGIN
        ;WITH review_stats AS (
            SELECT
                product_id,
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
        INNER JOIN review_stats rs ON rs.product_id = p.id
        WHERE p.id IN (SELECT id FROM @sampleProducts);
    END;
END;
GO
