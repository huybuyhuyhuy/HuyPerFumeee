import { query } from '../../config/database.js';
import { getProductStorageCapabilities } from '../products/product.repository.js';

export async function hasReviewStorage() {
  const capabilities = await getProductStorageCapabilities();
  return capabilities.hasProductReviews;
}

function reviewSelect() {
  return `
    SELECT r.id,
           r.product_id,
           r.user_id,
           r.order_id,
           r.rating,
           r.title,
           r.comment,
           r.status,
           r.moderation_note,
           r.moderated_by,
           r.moderated_at,
           r.created_at,
           r.updated_at,
           u.name AS user_name
    FROM product_reviews r
    LEFT JOIN users u ON u.id = r.user_id
  `;
}

export async function listReviewsByProduct({ productId, page = 1, size = 10, status = 'APPROVED' }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Math.min(50, Number(size) || 10));
  const offset = (safePage - 1) * safeSize;
  const conditions = ['r.product_id = ?', 'r.deleted_at IS NULL'];
  const params = [Number(productId)];

  if (status !== 'ALL') {
    conditions.push('r.status = ?');
    params.push(status);
  }

  const whereSql = `WHERE ${conditions.join(' AND ')}`;
  const countRows = await query(`SELECT COUNT(*) AS total FROM product_reviews r ${whereSql}`, params);
  const totalElements = Number(countRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalElements / safeSize));
  const rows = await query(
    `${reviewSelect()}
     ${whereSql}
     ORDER BY r.created_at DESC, r.id DESC
     OFFSET ${offset} ROWS FETCH NEXT ${safeSize} ROWS ONLY`,
    params
  );

  return {
    rows,
    page: safePage,
    size: safeSize,
    totalElements,
    totalPages,
    first: safePage === 1,
    last: safePage >= totalPages,
  };
}

export async function getReviewSummary(productId) {
  const rows = await query(
    `SELECT AVG(CAST(rating AS FLOAT)) AS rating_average,
            COUNT(*) AS review_count,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS rating_5,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS rating_4,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS rating_3,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS rating_2,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS rating_1
     FROM product_reviews
     WHERE product_id = ?
       AND status = N'APPROVED'
       AND deleted_at IS NULL`,
    [Number(productId)]
  );
  return rows[0] || {};
}

export async function findReviewById(reviewId) {
  const rows = await query(
    `${reviewSelect()}
     WHERE r.id = ?
       AND r.deleted_at IS NULL`,
    [Number(reviewId)]
  );
  return rows[0] || null;
}

export async function findReviewByUserProduct(userId, productId) {
  const rows = await query(
    `${reviewSelect()}
     WHERE r.user_id = ?
       AND r.product_id = ?
       AND r.deleted_at IS NULL`,
    [Number(userId), Number(productId)]
  );
  return rows[0] || null;
}

function reviewableOrderStatusParams() {
  return [
    'DELIVERED',
    'COMPLETED',
    'GIAO HANG THANH CONG',
    'GIAO HÀNG THÀNH CÔNG',
  ];
}

function orderStatusWhere(alias = 'o') {
  return `UPPER(ISNULL(${alias}.status, '')) IN (${reviewableOrderStatusParams().map(() => '?').join(', ')})`;
}

export async function findLatestPurchasedOrderForProduct({ userId, productId }) {
  const rows = await query(
    `SELECT TOP 1 o.id,
            o.status,
            o.created_at
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ?
       AND oi.product_id = ?
     ORDER BY o.created_at DESC, o.id DESC`,
    [Number(userId), Number(productId)]
  );
  return rows[0] || null;
}

export async function findReviewableOrderForProduct({ userId, productId, orderId = null }) {
  const conditions = ['o.user_id = ?', 'oi.product_id = ?', orderStatusWhere('o')];
  const params = [Number(userId), Number(productId), ...reviewableOrderStatusParams()];

  if (orderId) {
    conditions.push('o.id = ?');
    params.push(Number(orderId));
  }

  const rows = await query(
    `SELECT TOP 1 o.id,
            o.status,
            o.created_at
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.created_at DESC, o.id DESC`,
    params
  );
  return rows[0] || null;
}

export async function insertReview({ productId, userId, orderId = null, rating, title, comment }) {
  const rows = await query(
    `INSERT INTO product_reviews (product_id, user_id, order_id, rating, title, comment, status)
     OUTPUT INSERTED.id,
            INSERTED.product_id,
            INSERTED.user_id,
            INSERTED.order_id,
            INSERTED.rating,
            INSERTED.title,
            INSERTED.comment,
            INSERTED.status,
            INSERTED.moderation_note,
            INSERTED.moderated_by,
            INSERTED.moderated_at,
            INSERTED.created_at,
            INSERTED.updated_at
     VALUES (?, ?, ?, ?, ?, ?, N'PENDING')`,
    [Number(productId), Number(userId), orderId, Number(rating), title || null, comment || null]
  );
  return rows[0] || null;
}

export async function updateReviewById({ reviewId, rating, title, comment, status }) {
  const rows = await query(
    `UPDATE product_reviews
     SET rating = ?,
         title = ?,
         comment = ?,
         status = ?,
         updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.id,
            INSERTED.product_id,
            INSERTED.user_id,
            INSERTED.order_id,
            INSERTED.rating,
            INSERTED.title,
            INSERTED.comment,
            INSERTED.status,
            INSERTED.moderation_note,
            INSERTED.moderated_by,
            INSERTED.moderated_at,
            INSERTED.created_at,
            INSERTED.updated_at
     WHERE id = ?
       AND deleted_at IS NULL`,
    [Number(rating), title || null, comment || null, status, Number(reviewId)]
  );
  return rows[0] || null;
}

export async function moderateReviewById({ reviewId, status, note = '', moderatorId = null }) {
  const rows = await query(
    `UPDATE product_reviews
     SET status = ?,
         moderation_note = ?,
         moderated_by = ?,
         moderated_at = SYSUTCDATETIME(),
         updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.id,
            INSERTED.product_id,
            INSERTED.user_id,
            INSERTED.order_id,
            INSERTED.rating,
            INSERTED.title,
            INSERTED.comment,
            INSERTED.status,
            INSERTED.moderation_note,
            INSERTED.moderated_by,
            INSERTED.moderated_at,
            INSERTED.created_at,
            INSERTED.updated_at
     WHERE id = ?
       AND deleted_at IS NULL`,
    [status, note || null, moderatorId ? Number(moderatorId) : null, Number(reviewId)]
  );
  return rows[0] || null;
}

export async function softDeleteReviewById(reviewId) {
  const rows = await query(
    `UPDATE product_reviews
     SET deleted_at = SYSUTCDATETIME(),
         updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.id, INSERTED.product_id
     WHERE id = ?
       AND deleted_at IS NULL`,
    [Number(reviewId)]
  );
  return rows[0] || null;
}

export async function recalculateProductRating(productId) {
  const capabilities = await getProductStorageCapabilities();
  if (!capabilities.productColumns.has('rating_average') || !capabilities.productColumns.has('review_count')) {
    return;
  }

  const updatedAtSql = capabilities.productColumns.has('updated_at') ? ', updated_at = SYSUTCDATETIME()' : '';
  await query(
    `UPDATE p
     SET rating_average = ISNULL(stats.rating_average, 0),
         review_count = ISNULL(stats.review_count, 0)
         ${updatedAtSql}
     FROM products p
     OUTER APPLY (
       SELECT AVG(CAST(rating AS FLOAT)) AS rating_average,
              COUNT(*) AS review_count
       FROM product_reviews
       WHERE product_id = p.id
         AND status = N'APPROVED'
         AND deleted_at IS NULL
     ) stats
     WHERE p.id = ?`,
    [Number(productId)]
  );
}
