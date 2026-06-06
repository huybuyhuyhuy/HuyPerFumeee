export const MEMBERSHIP_LABELS: Record<string, string> = {
  NORMAL: 'Khách hàng thường',
  BRONZE: 'Hạng Đồng',
  SILVER: 'Hạng Bạc',
  GOLD: 'Hạng Vàng',
  DIAMOND: 'Hạng Kim Cương',
};

export const MEMBERSHIP_SHORT_LABELS: Record<string, string> = {
  NORMAL: 'Thường',
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  DIAMOND: 'Kim Cương',
};

export function normalizeMembershipTier(value?: string | null) {
  const tier = String(value || 'NORMAL').trim().toUpperCase();
  return MEMBERSHIP_LABELS[tier] ? tier : 'NORMAL';
}

export function getMembershipLabel(value?: string | null) {
  return MEMBERSHIP_LABELS[normalizeMembershipTier(value)];
}

export function getMembershipShortLabel(value?: string | null) {
  return MEMBERSHIP_SHORT_LABELS[normalizeMembershipTier(value)];
}

export function getMembershipTone(value?: string | null) {
  return `tier-${normalizeMembershipTier(value).toLowerCase()}`;
}

export function formatVnd(value?: number | null) {
  const amount = Number(value || 0);
  const safeAmount = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  return `${safeAmount.toLocaleString('vi-VN')}₫`;
}

export function clampMembershipProgress(value?: number | null) {
  const progress = Number(value || 0);
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(100, Math.round(progress)));
}
