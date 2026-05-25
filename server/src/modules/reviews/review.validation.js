export const REVIEW_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FLAGGED: 'FLAGGED',
};

export function normalizeReviewStatus(value, fallback = REVIEW_STATUSES.PENDING) {
  const status = String(value || fallback).trim().toUpperCase();
  return Object.values(REVIEW_STATUSES).includes(status) ? status : fallback;
}

function normalizeText(value, maxLength) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength);
}

export function validateReviewInput(input = {}, { partial = false } = {}) {
  const errors = [];
  const rating = Number(input.rating);
  const normalized = {
    rating: Number.isInteger(rating) ? rating : null,
    title: normalizeText(input.title, 180),
    comment: normalizeText(input.comment ?? input.content, 2000),
    orderId: input.orderId ? Number(input.orderId) : null,
  };

  if (!partial || input.rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push('RATING_MUST_BE_INTEGER_1_TO_5');
    }
  }

  if (normalized.title.length > 180) errors.push('TITLE_TOO_LONG');
  if (normalized.comment.length > 2000) errors.push('COMMENT_TOO_LONG');
  if (normalized.orderId !== null && (!Number.isInteger(normalized.orderId) || normalized.orderId <= 0)) {
    errors.push('ORDER_ID_INVALID');
  }

  return {
    valid: errors.length === 0,
    errors,
    value: normalized,
  };
}
