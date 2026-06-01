import api, { unwrapApiData } from './api';

export type VoucherValidationRequest = {
  code: string;
  subtotal: number;
};

export type VoucherValidationResult = {
  code: string;
  name?: string | null;
  discountType: 'PERCENT' | 'AMOUNT' | string;
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscountValue?: number | null;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  totalAfterDiscount: number;
};

export const voucherService = {
  async validateVoucher(payload: VoucherValidationRequest) {
    const { data } = await api.post('/vouchers/validate', payload);
    return unwrapApiData<VoucherValidationResult>(data);
  },
};
