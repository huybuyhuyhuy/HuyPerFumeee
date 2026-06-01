import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../config/database.js';
import { auditLog } from '../config/logger.js';
import { reviewBulkModerateSchema } from '../modules/admin/admin.validation.js';

export async function listReviews(req, res) {
  try {
    const { page = 1, pageSize = 20, status = 'PENDING', productId, rating } = req.query;
    const safePage = Math.max(1, Number(page));
    const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
    const offset = (safePage - 1) * safePageSize;

    const conditions = ['r.deleted_at IS NULL'];
    const params = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(String(status));
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
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.status,
              r.created_at, r.updated_at, r.moderated_by, r.moderated_at,
              p.name AS product_name, p.image AS product_image,
              u.name AS user_name
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
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        moderatedBy: r.moderated_by,
        moderatedAt: r.moderated_at,
        productName: r.product_name,
        productImage: r.product_image,
        userName: r.user_name,
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
    if (!status || !['APPROVED', 'REJECTED'].includes(String(status).toUpperCase())) {
      return errorResponse(res, 400, 'Trạng thái không hợp lệ (APPROVED hoặc REJECTED)');
    }

    const normalizedStatus = String(status).toUpperCase();

    const existing = await query('SELECT TOP 1 id, status FROM product_reviews WHERE id = ?', [reviewId]);
    if (!existing.length) return errorResponse(res, 404, 'Không tìm thấy đánh giá');

    await query(
      `UPDATE product_reviews
       SET status = ?, moderation_note = ?, moderated_by = ?, moderated_at = GETDATE()
       WHERE id = ?`,
      [normalizedStatus, note || null, req.user?.id || null, reviewId]
    );

    // Recalculate product rating
    try {
      await query(
        `UPDATE products
         SET rating_average = (SELECT COALESCE(AVG(CAST(rating AS FLOAT)), 0)
                               FROM product_reviews
                               WHERE product_id = products.id AND status = 'APPROVED' AND deleted_at IS NULL),
             review_count = (SELECT COUNT(*) FROM product_reviews
                             WHERE product_id = products.id AND status = 'APPROVED' AND deleted_at IS NULL)
         WHERE id = (SELECT product_id FROM product_reviews WHERE id = ?)`,
        [reviewId]
      );
    } catch {
      // Recalculation may fail if columns don't exist; non-critical
    }

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
       WHERE id IN (${placeholders}) AND status = 'PENDING' AND deleted_at IS NULL`,
      [normalizedStatus, req.user?.id || null, ...ids]
    );

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
