export function formatVnCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return `${safeAmount.toLocaleString('vi-VN')}₫`;
}

export function clampPrice(value?: number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
