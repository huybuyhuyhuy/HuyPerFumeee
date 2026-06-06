import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../config/database.js';
import { auditLog } from '../config/logger.js';
import { reviewBulkModerateSchema } from '../modules/admin/admin.validation.js';
import { normalizeReviewStatus } from '../modules/reviews/review.validation.js';
import { invalidateProductCache } from '../modules/products/product.service.js';

const DEMO_REVIEW_PASSWORD = '$2b$12$huyperfume.seed.review.account.only';
const DEMO_REVIEW_USERS = [
  { email: 'review.mai@huyperfume.local', name: 'Minh Anh', phone: '0901000001' },
  { email: 'review.linh@huyperfume.local', name: 'Hoàng Linh', phone: '0901000002' },
  { email: 'review.khoa@huyperfume.local', name: 'Đức Khoa', phone: '0901000003' },
  { email: 'review.trang@huyperfume.local', name: 'Thu Trang', phone: '0901000004' },
  { email: 'review.nam@huyperfume.local', name: 'Gia Nam', phone: '0901000005' },
  { email: 'review.ha@huyperfume.local', name: 'Ngọc Hà', phone: '0901000006' },
  { email: 'review.quyen@huyperfume.local', name: 'Bảo Quyên', phone: '0901000007' },
  { email: 'review.phuc@huyperfume.local', name: 'Minh Phúc', phone: '0901000008' },
];

const DEMO_REVIEW_TEMPLATES = [
  [
    {
      rating: 5,
      title: 'Mùi hương sang và rất dễ dùng',
      comment: 'Mùi lên da mềm, sạch và có độ sang vừa đủ. Mình dùng cả ngày vẫn thấy dễ chịu, phù hợp đi làm.',
    },
    {
      rating: 5,
      title: 'Đóng gói chỉn chu',
      comment: 'Hàng nhận được đúng như mô tả, hộp đẹp và chai được bọc rất kỹ. Mùi giữ khá ổn trên da.',
    },
  ],
  [
    {
      rating: 5,
      title: 'Ấn tượng ngay từ lần đầu thử',
      comment: 'Tông mùi nam tính, lịch sự và không bị gắt. Dùng buổi tối rất hợp.',
    },
    {
      rating: 4,
      title: 'Đáng tiền trong tầm giá',
      comment: 'Mùi rõ nét, độ tỏa vừa phải. Nếu xịt ít thì đi làm cũng không quá nồng.',
    },
  ],
  [
    {
      rating: 5,
      title: 'Hương rất tinh tế',
      comment: 'Cảm giác cao cấp, lớp hương sau mượt và giữ được dấu ấn riêng. Sẽ mua lại khi hết.',
    },
    {
      rating: 4,
      title: 'Phù hợp dùng hằng ngày',
      comment: 'Không quá nồng, không quá ngọt. Đoạn mở đầu sáng và khô hương sau rất dễ gần.',
    },
  ],
  [
    {
      rating: 5,
      title: 'Rất hợp làm quà tặng',
      comment: 'Người nhận rất thích vì mùi thanh lịch và hộp nhìn sang. Shop gói hàng cẩn thận.',
    },
    {
      rating: 5,
      title: 'Trải nghiệm tốt',
      comment: 'Sản phẩm đúng kỳ vọng, hương ổn định và giao hàng nhanh. Phần review trên web nhìn rõ ràng, dễ tham khảo.',
    },
  ],
];

function columnSet(rows) {
  return new Set(rows.map((row) => String(row.COLUMN_NAME || '').toLowerCase()));
}

function hasColumn(columns, column) {
  return columns.has(String(column).toLowerCase());
}

function normalizeAdminReviewStatus(status) {
  const raw = String(status || '').trim().toUpperCase();
  if (raw === 'HIDDEN' || raw === 'HIDE') return 'FLAGGED';
  return normalizeReviewStatus(raw, null);
}

async function refreshProductReviewStats(productId) {
  try {
    await query(
      `UPDATE products
       SET rating_average = (SELECT COALESCE(AVG(CAST(rating AS FLOAT)), 0)
                             FROM product_reviews
                             WHERE product_id = products.id AND status = 'APPROVED' AND deleted_at IS NULL),
           review_count = (SELECT COUNT(*) FROM product_reviews
                           WHERE product_id = products.id AND status = 'APPROVED' AND deleted_at IS NULL)
       WHERE id = ?`,
      [Number(productId)]
    );
  } catch {
    // Recalculation may fail if columns don't exist; non-critical
  }
  await invalidateProductCache(productId);
}

async function tableColumns(tableName) {
  const rows = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ?`,
    [tableName]
  );
  return columnSet(rows);
}

async function ensureDemoReviewUser(user, userColumns) {
  const existing = await query('SELECT TOP 1 id FROM users WHERE email = ?', [user.email]);
  if (existing[0]?.id) return Number(existing[0].id);

  const columns = ['name', 'email', 'phone', 'password', 'role', 'address'];
  const values = ['?', '?', '?', '?', '?', '?'];
  const params = [
    user.name,
    user.email,
    user.phone,
    DEMO_REVIEW_PASSWORD,
    'USER',
    'Tài khoản mẫu dùng cho review sản phẩm',
  ];

  if (hasColumn(userColumns, 'status')) {
    columns.push('status');
    values.push('?');
    params.push('ACTIVE');
  }
  if (hasColumn(userColumns, 'email_verified_at')) {
    columns.push('email_verified_at');
    values.push('SYSUTCDATETIME()');
  }
  if (hasColumn(userColumns, 'password_changed_at')) {
    columns.push('password_changed_at');
    values.push('SYSUTCDATETIME()');
  }

  const inserted = await query(
    `INSERT INTO users (${columns.join(', ')})
     OUTPUT INSERTED.id
     VALUES (${values.join(', ')})`,
    params
  );
  return Number(inserted[0]?.id || 0);
}

async function findDemoReviewProducts(productColumns) {
  const conditions = [];
  if (hasColumn(productColumns, 'deleted_at')) conditions.push('p.deleted_at IS NULL');
  if (hasColumn(productColumns, 'status')) conditions.push('ISNULL(p.status, 1) = 1');
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return query(
    `SELECT TOP 4 p.id, p.name
     FROM products p
     ${whereSql}
     ORDER BY p.id DESC`
  );
}

async function insertDemoReview({ productId, userId, template, reviewColumns }) {
  const existing = await query(
    `SELECT TOP 1 id
     FROM product_reviews
     WHERE product_id = ?
       AND user_id = ?
       ${hasColumn(reviewColumns, 'deleted_at') ? 'AND deleted_at IS NULL' : ''}`,
    [productId, userId]
  );
  if (existing[0]?.id) return { inserted: false, id: Number(existing[0].id) };

  const columns = ['product_id', 'user_id', 'order_id', 'rating', 'title', 'comment', 'status'];
  const values = ['?', '?', '?', '?', '?', '?', '?'];
  const params = [productId, userId, null, template.rating, template.title, template.comment, 'APPROVED'];

  if (hasColumn(reviewColumns, 'moderation_note')) {
    columns.push('moderation_note');
    values.push('?');
    params.push('Seed review demo cho trang chi tiết sản phẩm');
  }
  if (hasColumn(reviewColumns, 'moderated_at')) {
    columns.push('moderated_at');
    values.push('SYSUTCDATETIME()');
  }
  if (hasColumn(reviewColumns, 'created_at')) {
    columns.push('created_at');
    values.push('DATEADD(MINUTE, -?, SYSUTCDATETIME())');
    params.push(userId);
  }

  const inserted = await query(
    `INSERT INTO product_reviews (${columns.join(', ')})
     OUTPUT INSERTED.id
     VALUES (${values.join(', ')})`,
    params
  );
  return { inserted: true, id: Number(inserted[0]?.id || 0) };
}

export async function seedDemoReviews(req, res) {
  try {
    const [userColumns, productColumns, reviewColumns] = await Promise.all([
      tableColumns('users'),
      tableColumns('products'),
      tableColumns('product_reviews'),
    ]);

    if (!reviewColumns.size) {
      return errorResponse(res, 503, 'Chưa có bảng product_reviews. Hãy chạy migration review trước.');
    }

    const userIds = [];
    for (const user of DEMO_REVIEW_USERS) {
      const userId = await ensureDemoReviewUser(user, userColumns);
      if (userId) userIds.push(userId);
    }

    const products = await findDemoReviewProducts(productColumns);
    let insertedCount = 0;
    const seededProducts = [];

    for (let productIndex = 0; productIndex < products.length; productIndex += 1) {
      const product = products[productIndex];
      const templates = DEMO_REVIEW_TEMPLATES[productIndex] || [];
      let productInserted = 0;

      for (let templateIndex = 0; templateIndex < templates.length; templateIndex += 1) {
        const userId = userIds[productIndex * 2 + templateIndex];
        if (!userId) continue;
        const result = await insertDemoReview({
          productId: Number(product.id),
          userId,
          template: templates[templateIndex],
          reviewColumns,
        });
        if (result.inserted) {
          insertedCount += 1;
          productInserted += 1;
        }
      }

      await refreshProductReviewStats(product.id);
      const reviewCountRows = await query(
        `SELECT COUNT(*) AS total
         FROM product_reviews
         WHERE product_id = ?
           AND status = N'APPROVED'
           ${hasColumn(reviewColumns, 'deleted_at') ? 'AND deleted_at IS NULL' : ''}`,
        [Number(product.id)]
      );
      seededProducts.push({
        id: Number(product.id),
        name: product.name,
        inserted: productInserted,
        approvedReviews: Number(reviewCountRows[0]?.total || 0),
      });
    }

    auditLog('REVIEW_SEED_DEMO', req.user?.id, { insertedCount, productIds: seededProducts.map((item) => item.id) });
    return successResponse(res, 'Seed review mẫu thành công', {
      insertedCount,
      products: seededProducts,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi seed review mẫu', { message: err.message });
  }
}

export async function listReviews(req, res) {
  try {
    const { page = 1, pageSize = 20, status = 'ALL', productId, rating } = req.query;
    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
    const offset = (safePage - 1) * safePageSize;

    const conditions = ['r.deleted_at IS NULL'];
    const params = [];
    const normalizedStatus = String(status || 'ALL').trim().toUpperCase();

    if (normalizedStatus && normalizedStatus !== 'ALL') {
      conditions.push('r.status = ?');
      params.push(normalizedStatus);
    }
    if (productId) {
      conditions.push('r.product_id = ?');
      params.push(Number(productId));
    }
    if (rating) {
      conditions.push('r.rating = ?');
      params.push(Number(rating));
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;

    const totalRows = await query(`SELECT COUNT(*) AS total FROM product_reviews r ${whereSql}`, params);
    const total = Number(totalRows[0]?.total || 0);

    const reviews = await query(
      `SELECT r.id, r.product_id, r.user_id, r.order_id, r.rating, r.title, r.comment, r.status,
              r.created_at, r.updated_at, r.moderated_by, r.moderated_at,
              p.name AS product_name, p.image AS product_image,
              u.name AS user_name, u.email AS user_email
       FROM product_reviews r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN users u ON u.id = r.user_id
       ${whereSql}
       ORDER BY r.created_at DESC
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      [...params, offset, safePageSize]
    );

    return successResponse(res, 'Lấy danh sách đánh giá thành công', {
      content: reviews.map((r) => ({
        id: r.id,
        productId: r.product_id,
        userId: r.user_id,
        orderId: r.order_id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        verifiedPurchase: Boolean(r.order_id),
        isVerifiedPurchase: Boolean(r.order_id),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        moderatedBy: r.moderated_by,
        moderatedAt: r.moderated_at,
        productName: r.product_name,
        productImage: r.product_image,
        userName: r.user_name,
        userEmail: r.user_email,
      })),
      page: safePage,
      size: safePageSize,
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      first: safePage === 1,
      last: safePage * safePageSize >= total,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách đánh giá', { message: err.message });
  }
}

export async function reviewDetail(req, res) {
  try {
    const reviewId = Number(req.params.id);
    if (!reviewId) return errorResponse(res, 400, 'ID đánh giá không hợp lệ');

    const rows = await query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.status,
              r.created_at, r.updated_at, r.moderated_by, r.moderated_at,
              r.moderation_note,
              p.name AS product_name, p.image AS product_image,
              u.name AS user_name, u.email AS user_email
       FROM product_reviews r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
      [reviewId]
    );

    const r = rows[0];
    if (!r) return errorResponse(res, 404, 'Không tìm thấy đánh giá');

    return successResponse(res, 'Lấy chi tiết đánh giá thành công', {
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      moderatedBy: r.moderated_by,
      moderatedAt: r.moderated_at,
      moderationNote: r.moderation_note,
      product: { id: r.product_id, name: r.product_name, image: r.product_image },
      user: { id: r.user_id, name: r.user_name, email: r.user_email },
    });
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy chi tiết đánh giá', { message: err.message });
  }
}

export async function moderateReview(req, res) {
  try {
    const reviewId = Number(req.params.id);
    const { status, note } = req.body || {};

    if (!reviewId) return errorResponse(res, 400, 'ID đánh giá không hợp lệ');
    const requestedStatus = normalizeAdminReviewStatus(status);
    if (!requestedStatus) {
      return errorResponse(res, 400, 'Trạng thái không hợp lệ');
    }

    const normalizedStatus = requestedStatus;

    const existing = await query('SELECT TOP 1 id, status, product_id FROM product_reviews WHERE id = ?', [reviewId]);
    if (!existing.length) return errorResponse(res, 404, 'Không tìm thấy đánh giá');

    await query(
      `UPDATE product_reviews
       SET status = ?, moderation_note = ?, moderated_by = ?, moderated_at = GETDATE()
       WHERE id = ?`,
      [normalizedStatus, note || null, req.user?.id || null, reviewId]
    );

    await refreshProductReviewStats(existing[0].product_id);

    auditLog('REVIEW_MODERATE', req.user?.id, { reviewId, status: normalizedStatus });
    return successResponse(res, 'Kiểm duyệt đánh giá thành công', {
      id: reviewId,
      status: normalizedStatus,
      moderatedBy: req.user?.id,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi kiểm duyệt đánh giá', { message: err.message });
  }
}

export async function bulkModerate(req, res) {
  try {
    const parsed = reviewBulkModerateSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }

    const { ids, action } = parsed.data;
    const normalizedStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const placeholders = ids.map(() => '?').join(',');

    // Only moderate PENDING reviews to avoid overriding already-moderated ones
    const result = await query(
      `UPDATE product_reviews
       SET status = ?, moderated_by = ?, moderated_at = GETDATE()
       OUTPUT INSERTED.product_id
       WHERE id IN (${placeholders}) AND status = 'PENDING' AND deleted_at IS NULL`,
      [normalizedStatus, req.user?.id || null, ...ids]
    );
    const productIds = [...new Set((result || []).map((row) => Number(row.product_id)).filter(Boolean))];
    await Promise.all(productIds.map((productId) => refreshProductReviewStats(productId)));

    auditLog('REVIEW_BULK_MODERATE', req.user?.id, { ids, action, count: ids.length });

    return successResponse(res, `Đã ${action === 'APPROVE' ? 'duyệt' : 'từ chối'} ${ids.length} đánh giá`, {
      action,
      status: normalizedStatus,
      requestedCount: ids.length,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi kiểm duyệt hàng loạt', { message: err.message });
  }
}
