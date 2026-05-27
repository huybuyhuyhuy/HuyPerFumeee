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
      errors.push('DANH_GIA_PHAI_TU_1_DEN_5');
    }
  }

  if (normalized.title.length > 180) errors.push('TIEU_DE_QUA_DAI');
  if (normalized.comment.length > 2000) errors.push('BINH_LUAN_QUA_DAI');
  if (normalized.orderId !== null && (!Number.isInteger(normalized.orderId) || normalized.orderId <= 0)) {
    errors.push('MA_DON_HANG_KHONG_HOP_LE');
  }

  return {
    valid: errors.length === 0,
    errors,
    value: normalized,
  };
}
