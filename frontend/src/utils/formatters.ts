export function formatVnCurrency(value?: number | null) {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return `${safeAmount.toLocaleString('vi-VN')}₫`;
}

export function clampPrice(value?: number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function formatPaymentMethodLabel(value?: string | null) {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return '-';
  if (normalized === 'COD') return 'Thanh toán khi nhận hàng';
  if (normalized === 'MOMO') return 'Ví MoMo';
  if (normalized === 'ZALOPAY') return 'ZaloPay';
  if (normalized === 'VNPAY') return 'VNPay';
  if (normalized === 'BANKING') return 'Chuyển khoản ngân hàng';
  if (normalized === 'CREDITCARD') return 'Thẻ ngân hàng';
  return value || '-';
}
