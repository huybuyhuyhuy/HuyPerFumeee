import { getVoucherByCode } from '../models/adminVoucherModel.js';
import { parseLocalizedNumber } from '../utils/localizedNumber.js';

export function normalizeVoucherCode(value) {
  return String(value || '').trim().toUpperCase();
}

export function toMoney(value) {
  return Math.max(0, Math.round(Number(parseLocalizedNumber(value) || 0)));
}

function isVoucherActive(voucher, now = new Date()) {
  if (!voucher?.status) return false;
  if (voucher.startAt && new Date(voucher.startAt).getTime() > now.getTime()) return false;
  if (voucher.endAt && new Date(voucher.endAt).getTime() < now.getTime()) return false;
  if (voucher.usageLimit !== null && Number(voucher.usedCount || 0) >= Number(voucher.usageLimit)) return false;
  return true;
}

export function calculateVoucherDiscount(voucher, subtotal) {
  const safeSubtotal = toMoney(subtotal);
  const discountType = String(voucher.discountType || '').toUpperCase();
  const discountValue = Number(voucher.discountValue || 0);
  const isPercent = discountType === 'PERCENT';
  const rawDiscount = isPercent ? safeSubtotal * (discountValue / 100) : discountValue;
  const cappedDiscount = voucher.maxDiscountValue !== null
    ? Math.min(rawDiscount, Number(voucher.maxDiscountValue || 0))
    : rawDiscount;
  const discountAmount = Math.min(safeSubtotal, toMoney(cappedDiscount));
  const discountPercent = safeSubtotal > 0
    ? Math.round((discountAmount / safeSubtotal) * 10000) / 100
    : 0;

  return {
    discountAmount,
    discountPercent: isPercent ? discountValue : discountPercent,
    totalAfterDiscount: Math.max(0, safeSubtotal - discountAmount),
  };
}

export async function validateVoucherForSubtotal({ code, subtotal }) {
  const normalizedCode = normalizeVoucherCode(code);
  const safeSubtotal = toMoney(subtotal);

  if (!normalizedCode) return { code: 400, message: 'Vui lòng nhập mã voucher.' };
  if (safeSubtotal <= 0) return { code: 400, message: 'Giỏ hàng chưa có giá trị để áp dụng voucher.' };

  const voucher = await getVoucherByCode(normalizedCode);
  if (!voucher) return { code: 404, message: 'Mã voucher không tồn tại.' };
  if (!isVoucherActive(voucher)) return { code: 400, message: 'Mã voucher hiện không khả dụng.' };
  if (voucher.minOrderValue !== null && safeSubtotal < Number(voucher.minOrderValue)) {
    return {
      code: 400,
      message: `Đơn hàng cần tối thiểu ${toMoney(voucher.minOrderValue).toLocaleString('vi-VN')}đ để dùng mã này.`,
    };
  }

  const discount = calculateVoucherDiscount(voucher, safeSubtotal);
  return {
    voucher: {
      id: voucher.id,
      code: voucher.code,
      name: voucher.name,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue,
      maxDiscountValue: voucher.maxDiscountValue,
      subtotal: safeSubtotal,
      ...discount,
    },
  };
}
