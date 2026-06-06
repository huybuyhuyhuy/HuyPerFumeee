import {
  createSupplier as createSupplierService,
  deleteSupplier as deleteSupplierService,
  exportSuppliersExcel as exportSuppliersExcelService,
  exportSuppliersPdf as exportSuppliersPdfService,
  getStatistics,
  getSupplier,
  importSuppliersExcel as importSuppliersExcelService,
  listSuppliers as listSuppliersService,
  SupplierServiceError,
  updateSupplier as updateSupplierService,
} from '../services/adminSupplierService.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { buildAuditContext, writeAdminAuditLog } from '../utils/adminAuditLogger.js';

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function handleSupplierError(res, error, fallback) {
  if (error instanceof SupplierServiceError) {
    return errorResponse(res, error.status, error.message, error.details || {});
  }
  return errorResponse(res, 500, fallback, { message: getErrorMessage(error, fallback) });
}

async function writeSupplierAudit(req, action, targetId = null, oldValue = null, newValue = null) {
  const auditContext = buildAuditContext(req);
  await writeAdminAuditLog({
    ...auditContext,
    action,
    targetType: 'supplier',
    targetId,
    oldValue,
    newValue,
  });
}

export async function listSuppliers(req, res) {
  try {
    const data = await listSuppliersService(req.query);
    return successResponse(res, 'Lấy danh sách nhà cung cấp thành công', data);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi lấy danh sách nhà cung cấp');
  }
}

export async function supplierStatistics(_req, res) {
  try {
    const data = await getStatistics();
    return successResponse(res, 'Lấy thống kê nhà cung cấp thành công', data);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi lấy thống kê nhà cung cấp');
  }
}

export async function supplierDetail(req, res) {
  try {
    const data = await getSupplier(req.params.id);
    return successResponse(res, 'Lấy chi tiết nhà cung cấp thành công', data);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi lấy chi tiết nhà cung cấp');
  }
}

export async function createSupplier(req, res) {
  try {
    const supplier = await createSupplierService(req.body, req.user?.id || null);
    await writeSupplierAudit(req, 'SUPPLIER_CREATE', supplier?.supplierId, null, supplier);
    return successResponse(res, 'Tạo nhà cung cấp thành công', supplier, 201);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi tạo nhà cung cấp');
  }
}

export async function updateSupplier(req, res) {
  try {
    const { supplier, oldSupplier, action } = await updateSupplierService(req.params.id, req.body, req.user?.id || null);
    await writeSupplierAudit(req, action, supplier?.supplierId || req.params.id, oldSupplier, supplier);
    return successResponse(res, 'Cập nhật nhà cung cấp thành công', supplier);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi cập nhật nhà cung cấp');
  }
}

export async function deleteSupplier(req, res) {
  try {
    const supplier = await deleteSupplierService(req.params.id, req.user?.id || null);
    await writeSupplierAudit(req, 'SUPPLIER_DELETE', supplier?.supplierId || req.params.id, supplier, { isDeleted: true });
    return successResponse(res, 'Xóa nhà cung cấp thành công', { supplier });
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi xóa nhà cung cấp');
  }
}

export async function exportSuppliersExcel(req, res) {
  try {
    const result = await exportSuppliersExcelService(req.query);
    await writeSupplierAudit(req, 'SUPPLIER_EXPORT_EXCEL', null, null, { filters: req.query });
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi xuất Excel nhà cung cấp');
  }
}

export async function exportSuppliersPdf(req, res) {
  try {
    const result = await exportSuppliersPdfService(req.query);
    await writeSupplierAudit(req, 'SUPPLIER_EXPORT_PDF', null, null, { filters: req.query });
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi xuất PDF nhà cung cấp');
  }
}

export async function importSuppliersExcel(req, res) {
  try {
    const result = await importSuppliersExcelService(req.file, req.user?.id || null);
    await writeSupplierAudit(req, 'SUPPLIER_IMPORT_EXCEL', null, null, {
      filename: req.file?.originalname || '',
      totalRows: result.totalRows,
      successRows: result.successRows,
      failedRows: result.failedRows,
    });
    return successResponse(res, 'Import nhà cung cấp hoàn tất', result);
  } catch (error) {
    return handleSupplierError(res, error, 'Lỗi khi import nhà cung cấp');
  }
}
