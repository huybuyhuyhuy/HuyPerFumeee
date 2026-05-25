function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDateString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function mapReviewRow(row) {
  if (!row) return null;

  return {
    id: toNumber(row.id),
    productId: toNumber(row.product_id),
    userId: toNumber(row.user_id),
    orderId: row.order_id ? toNumber(row.order_id) : null,
    rating: toNumber(row.rating),
    title: normalizeText(row.title),
    comment: normalizeText(row.comment),
    status: normalizeText(row.status),
    moderationNote: normalizeText(row.moderation_note),
    user: row.user_id ? {
      id: toNumber(row.user_id),
      name: normalizeText(row.user_name || 'Khach hang'),
    } : null,
    moderatedBy: row.moderated_by ? toNumber(row.moderated_by) : null,
    moderatedAt: toDateString(row.moderated_at),
    createdAt: toDateString(row.created_at),
    updatedAt: toDateString(row.updated_at),
  };
}

export function mapReviewSummary(row) {
  return {
    ratingAverage: Number(Number(row?.rating_average || 0).toFixed(2)),
    reviewCount: toNumber(row?.review_count),
    ratingBreakdown: {
      5: toNumber(row?.rating_5),
      4: toNumber(row?.rating_4),
      3: toNumber(row?.rating_3),
      2: toNumber(row?.rating_2),
      1: toNumber(row?.rating_1),
    },
  };
}
