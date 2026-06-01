import { successResponse, errorResponse } from '../utils/response.js';
import { createVoucher, deleteVoucher, getVoucherById, listVouchers, patchVoucherStatus, updateVoucher } from '../models/adminVoucherModel.js';
import { voucherSchema } from '../modules/admin/voucher.validation.js';
import { buildAuditContext, writeAdminAuditLog } from '../utils/adminAuditLogger.js';

function fieldsFromZod(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fields[key]) fields[key] = [];
    fields[key].push(issue.message);
  }
  return fields;
}

function getErrorMessage(error, fallback) {
  return error?.originalError?.message || error?.response?.data?.data?.message || error?.response?.data?.message || error?.message || fallback;
}

function isDuplicateVoucherError(error) {
  return /duplicate|unique|constraint|ux_|uq_|cannot insert duplicate/i.test(String(error?.message || error?.originalError?.message || ''));
}

function validateId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseBoolean(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  return Boolean(value);
}

export async function list(_req, res) {
  try {
    return successResponse(res, 'Lay danh sach voucher thanh cong', { content: await listVouchers() });
  } catch (error) {
    return errorResponse(res, 500, 'Loi khi lay voucher', { message: getErrorMessage(error, 'Khong lay duoc voucher') });
  }
}

export async function detail(req, res) {
  try {
    const id = validateId(req.params.id);
    if (!id) return errorResponse(res, 400, 'ID voucher khong hop le');
    const voucher = await getVoucherById(id);
    if (!voucher) return errorResponse(res, 404, 'Khong tim thay voucher');
    return successResponse(res, 'Lay chi tiet voucher thanh cong', voucher);
  } catch (error) {
    return errorResponse(res, 500, 'Loi khi lay voucher', { message: getErrorMessage(error, 'Khong lay duoc voucher') });
  }
}

export async function create(req, res) {
  try {
    const parsed = voucherSchema.safeParse(req.body);
    if (!parsed.success) return errorResponse(res, 400, 'Du lieu khong hop le', { fields: fieldsFromZod(parsed.error) });
    const voucher = await createVoucher(parsed.data);
    const auditContext = buildAuditContext(req);
    await writeAdminAuditLog({ ...auditContext, action: 'VOUCHER_CREATE', targetType: 'voucher', targetId: voucher?.id, newValue: parsed.data });
    return successResponse(res, 'Tao voucher thanh cong', voucher, 201);
  } catch (error) {
    if (isDuplicateVoucherError(error)) return errorResponse(res, 409, 'Ma voucher da ton tai');
    return errorResponse(res, 500, 'Loi khi tao voucher', { message: getErrorMessage(error, 'Khong tao duoc voucher') });
  }
}

export async function update(req, res) {
  try {
    const id = validateId(req.params.id);
    if (!id) return errorResponse(res, 400, 'ID voucher khong hop le');
    const parsed = voucherSchema.safeParse(req.body);
    if (!parsed.success) return errorResponse(res, 400, 'Du lieu khong hop le', { fields: fieldsFromZod(parsed.error) });

    const existing = await getVoucherById(id);
    if (!existing) return errorResponse(res, 404, 'Khong tim thay voucher');

    const voucher = await updateVoucher(id, parsed.data);
    const auditContext = buildAuditContext(req);
    await writeAdminAuditLog({ ...auditContext, action: 'VOUCHER_UPDATE', targetType: 'voucher', targetId: id, oldValue: existing, newValue: parsed.data });
    return successResponse(res, 'Cap nhat voucher thanh cong', voucher);
  } catch (error) {
    if (isDuplicateVoucherError(error)) return errorResponse(res, 409, 'Ma voucher da ton tai');
    return errorResponse(res, 500, 'Loi khi cap nhat voucher', { message: getErrorMessage(error, 'Khong cap nhat duoc voucher') });
  }
}

export async function updateStatus(req, res) {
  try {
    const id = validateId(req.params.id);
    if (!id) return errorResponse(res, 400, 'ID voucher khong hop le');
    const existing = await getVoucherById(id);
    if (!existing) return errorResponse(res, 404, 'Khong tim thay voucher');

    const nextStatus = parseBoolean(req.body?.status);
    const voucher = await patchVoucherStatus(id, nextStatus);
    const auditContext = buildAuditContext(req);
    await writeAdminAuditLog({ ...auditContext, action: 'VOUCHER_STATUS_UPDATE', targetType: 'voucher', targetId: id, oldValue: existing, newValue: { status: nextStatus } });
    return successResponse(res, 'Cap nhat trang thai voucher thanh cong', voucher);
  } catch (error) {
    return errorResponse(res, 500, 'Loi khi cap nhat trang thai voucher', { message: getErrorMessage(error, 'Khong doi duoc trang thai voucher') });
  }
}

export async function remove(req, res) {
  try {
    const id = validateId(req.params.id);
    if (!id) return errorResponse(res, 400, 'ID voucher khong hop le');
    const existing = await getVoucherById(id);
    if (!existing) return errorResponse(res, 404, 'Khong tim thay voucher');

    await deleteVoucher(id);
    const auditContext = buildAuditContext(req);
    await writeAdminAuditLog({ ...auditContext, action: 'VOUCHER_DELETE', targetType: 'voucher', targetId: id, oldValue: existing });
    return successResponse(res, 'Xoa voucher thanh cong');
  } catch (error) {
    return errorResponse(res, 500, 'Loi khi xoa voucher', { message: getErrorMessage(error, 'Khong xoa duoc voucher') });
  }
}
