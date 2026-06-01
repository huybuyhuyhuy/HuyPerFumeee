import { successResponse, errorResponse } from '../utils/response.js';
import { toMoney, validateVoucherForSubtotal } from '../services/voucherService.js';

export async function validateVoucher(req, res) {
  try {
    const code = req.body?.code || req.query?.code;
    const subtotal = toMoney(req.body?.subtotal ?? req.query?.subtotal);
    const result = await validateVoucherForSubtotal({ code, subtotal });
    if (result.code) return errorResponse(res, result.code, result.message);
    return successResponse(res, 'Áp dụng voucher thành công', result.voucher);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi kiểm tra voucher', { message: error?.message || 'Không kiểm tra được voucher' });
  }
}
