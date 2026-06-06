import {
  cancelPurchaseReceipt as cancelPurchaseReceiptRecord,
  createPurchaseReceipt as createPurchaseReceiptRecord,
  getPurchaseReceiptById,
  getPurchaseReceiptStatistics,
  listPurchaseReceipts as listPurchaseReceiptRecords,
  listReceiptProductOptions as listReceiptProductOptionRecords,
  softDeletePurchaseReceipt,
  updatePurchaseReceipt as updatePurchaseReceiptRecord,
} from '../repositories/adminPurchaseReceiptRepository.js';
import {
  normalizePurchaseReceiptListQuery,
  validatePurchaseReceiptId,
  validatePurchaseReceiptPayload,
  validatePurchaseReceiptUpdatePayload,
} from '../validators/purchaseReceiptValidator.js';

export class PurchaseReceiptServiceError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = 'PurchaseReceiptServiceError';
    this.status = status;
    this.details = details;
  }
}

function serviceErrorFrom(error, fallbackStatus = 500) {
  if (error instanceof PurchaseReceiptServiceError) return error;
  return new PurchaseReceiptServiceError(error.status || fallbackStatus, error.message || 'Yêu cầu phiếu nhập thất bại.');
}

function parseId(id) {
  const parsed = validatePurchaseReceiptId(id);
  if (!parsed.valid) throw new PurchaseReceiptServiceError(400, parsed.message);
  return parsed.purchaseReceiptId;
}

export async function listPurchaseReceipts(params = {}) {
  return listPurchaseReceiptRecords(normalizePurchaseReceiptListQuery(params));
}

export async function getPurchaseReceipt(id) {
  const purchaseReceiptId = parseId(id);
  const detail = await getPurchaseReceiptById(purchaseReceiptId);
  if (!detail) throw new PurchaseReceiptServiceError(404, 'Không tìm thấy phiếu nhập.');
  return detail;
}

export async function createPurchaseReceipt(payload, adminId = null) {
  const parsed = validatePurchaseReceiptPayload(payload);
  if (!parsed.valid) {
    throw new PurchaseReceiptServiceError(400, 'Dữ liệu phiếu nhập không hợp lệ.', { fields: parsed.errors });
  }

  try {
    return await createPurchaseReceiptRecord(parsed.data, adminId);
  } catch (error) {
    throw serviceErrorFrom(error, error.status || 500);
  }
}

export async function updatePurchaseReceipt(id, payload) {
  const purchaseReceiptId = parseId(id);
  const parsed = validatePurchaseReceiptUpdatePayload(payload);
  if (!parsed.valid) {
    throw new PurchaseReceiptServiceError(400, 'Dữ liệu cập nhật phiếu nhập không hợp lệ.', { fields: parsed.errors });
  }

  try {
    const detail = await updatePurchaseReceiptRecord(purchaseReceiptId, parsed.data);
    if (!detail) throw new PurchaseReceiptServiceError(404, 'Không tìm thấy phiếu nhập.');
    return detail;
  } catch (error) {
    throw serviceErrorFrom(error, error.status || 500);
  }
}

export async function cancelPurchaseReceipt(id, adminId = null) {
  const purchaseReceiptId = parseId(id);
  try {
    return await cancelPurchaseReceiptRecord(purchaseReceiptId, adminId);
  } catch (error) {
    throw serviceErrorFrom(error, error.status || 500);
  }
}

export async function deletePurchaseReceipt(id) {
  const purchaseReceiptId = parseId(id);
  try {
    const detail = await softDeletePurchaseReceipt(purchaseReceiptId);
    if (!detail) throw new PurchaseReceiptServiceError(404, 'Không tìm thấy phiếu nhập.');
    return detail;
  } catch (error) {
    throw serviceErrorFrom(error, error.status || 500);
  }
}

export async function getStatistics() {
  return getPurchaseReceiptStatistics();
}

export async function listReceiptProductOptions(params = {}) {
  return listReceiptProductOptionRecords({
    search: String(params.search || '').trim(),
    limit: Number(params.limit) || 100,
  });
}
