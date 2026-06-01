import { z } from 'zod';
import { parseLocalizedNumber } from '../../utils/localizedNumber.js';

const codeSchema = z.preprocess(
  (value) => String(value ?? '').trim().toUpperCase(),
  z.string().min(1, 'Code khong duoc rong').regex(/^[A-Z0-9_-]+$/, 'Code khong duoc co khoang trang hoac ky tu dac biet')
);

const dateOrNull = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return null;
  if (value instanceof Date) return value;

  const date = new Date(String(value).trim());
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date().nullable().optional());

const numberOrNull = (schema) => z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return null;
  return parseLocalizedNumber(value);
}, schema.nullable().optional());

export const voucherSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1, 'Ten voucher khong duoc rong').max(255),
  discountType: z.enum(['PERCENT', 'AMOUNT']),
  discountValue: z.preprocess(
    parseLocalizedNumber,
    z.coerce.number().positive('Gia tri giam phai lon hon 0')
  ),
  minOrderValue: numberOrNull(z.coerce.number().min(0)),
  maxDiscountValue: numberOrNull(z.coerce.number().min(0)),
  usageLimit: numberOrNull(z.coerce.number().int().positive()),
  startAt: dateOrNull,
  endAt: dateOrNull,
  status: z.coerce.boolean().optional().default(true),
}).refine((data) => {
  if (data.discountType === 'PERCENT') return data.discountValue >= 1 && data.discountValue <= 100;
  return data.discountValue > 0;
}, { message: 'Gia tri giam khong hop le', path: ['discountValue'] })
  .refine((data) => {
    if (!data.startAt || !data.endAt) return true;
    return data.endAt.getTime() > data.startAt.getTime();
  }, { message: 'Ngay het han phai sau ngay bat dau', path: ['endAt'] });
