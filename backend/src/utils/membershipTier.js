export const MEMBERSHIP_TIERS = Object.freeze([
  { tier: 'NORMAL', label: 'Khách hàng thường', shortLabel: 'Thường', minSpent: 0 },
  { tier: 'BRONZE', label: 'Hạng Đồng', shortLabel: 'Đồng', minSpent: 2500000 },
  { tier: 'SILVER', label: 'Hạng Bạc', shortLabel: 'Bạc', minSpent: 3500000 },
  { tier: 'GOLD', label: 'Hạng Vàng', shortLabel: 'Vàng', minSpent: 5000000 },
  { tier: 'DIAMOND', label: 'Hạng Kim Cương', shortLabel: 'Kim Cương', minSpent: 10000000 },
]);

function normalizeSpent(totalSpent) {
  const amount = Number(totalSpent || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function getMembershipTier(totalSpent) {
  const spent = normalizeSpent(totalSpent);
  // Hạng thành viên được tính tự động từ tổng tiền đơn hàng đã giao hoặc hoàn tất.
  return [...MEMBERSHIP_TIERS].reverse().find((tier) => spent >= tier.minSpent) || MEMBERSHIP_TIERS[0];
}

export function getNextMembershipTier(totalSpent) {
  const spent = normalizeSpent(totalSpent);
  return MEMBERSHIP_TIERS.find((tier) => tier.minSpent > spent) || null;
}

export function getMembershipTierByCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  return MEMBERSHIP_TIERS.find((tier) => tier.tier === normalized) || MEMBERSHIP_TIERS[0];
}

export function buildMembershipSummary(totalSpent) {
  const spent = normalizeSpent(totalSpent);
  const currentTier = getMembershipTier(spent);
  const nextTier = getNextMembershipTier(spent);
  const nextThreshold = nextTier?.minSpent || currentTier.minSpent || 1;
  const progress = nextTier ? Math.min(99, Math.floor((spent / nextThreshold) * 100)) : 100;

  return {
    totalSpent: spent,
    membershipTier: currentTier.tier,
    membershipLabel: currentTier.label,
    membershipShortLabel: currentTier.shortLabel,
    nextTier: nextTier?.tier || null,
    nextTierLabel: nextTier?.label || null,
    amountToNextTier: nextTier ? Math.max(0, nextTier.minSpent - spent) : 0,
    membershipProgress: progress,
  };
}
