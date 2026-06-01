import type { VoucherValidationResult } from '../services/voucherService';

const CART_VOUCHER_KEY = 'huyperfume-cart-voucher';

export function readCartVoucher(): VoucherValidationResult | null {
  try {
    const raw = sessionStorage.getItem(CART_VOUCHER_KEY);
    if (!raw) return null;
    const voucher = JSON.parse(raw);
    return voucher?.code ? voucher : null;
  } catch {
    return null;
  }
}

export function saveCartVoucher(voucher: VoucherValidationResult) {
  try {
    sessionStorage.setItem(CART_VOUCHER_KEY, JSON.stringify(voucher));
  } catch {}
}

export function clearCartVoucher() {
  try {
    sessionStorage.removeItem(CART_VOUCHER_KEY);
  } catch {}
}
