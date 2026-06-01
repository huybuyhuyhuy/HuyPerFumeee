import { successResponse, errorResponse } from '../utils/response.js';
import {
  createProduct,
  getAdminProductById,
  listAdminProducts,
  resetProductStock,
  softDeleteProduct,
  updateProduct,
  validateProductRelations,
} from '../models/adminProductModel.js';
import {
  createProductSchema,
  resetStockSchema,
  statusProductSchema,
  updateProductSchema,
} from '../modules/admin/admin.validation.js';
import { getProductDecantData } from '../models/decantModel.js';
import { auditLog } from '../config/logger.js';
import { buildAuditContext, writeAdminAuditLog } from '../utils/adminAuditLogger.js';

const aliases = {
  batch_code: ['batchCode'],
  discount_price: ['discountPrice'],
  volume_ml: ['volumeMl'],
  scent_notes: ['scentNotes'],
  is_decant: ['isDecant'],
  id_category: ['categoryId', 'idCategory'],
  id_brand: ['brandId', 'idBrand'],
  stock: ['quantity'],
};

function normalizePayload(body = {}) {
  const normalized = { ...body };
  for (const [field, aliasList] of Object.entries(aliases)) {
    if (normalized[field] !== undefined) continue;
    const alias = aliasList.find((key) => body[key] !== undefined);
    if (alias) normalized[field] = body[alias];
  }
  return normalized;
}

function fieldErrorsFromZod(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fields[key]) fields[key] = [];
    fields[key].push(issue.message);
  }
  return fields;
}

function validateCombinedPrice(data, existing = null) {
  const price = data.price ?? existing?.price;
  const discountPrice = Object.prototype.hasOwnProperty.call(data, 'discount_price') ? data.discount_price : existing?.discountPrice;
  if (discountPrice !== null && discountPrice !== undefined && price !== undefined && discountPrice >= price) {
    return { discount_price: ['Giá khuyến mãi phải nhỏ hơn giá bán'] };
  }
  return null;
}

function invalidId(res) {
  return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');
}

export async function listProducts(req, res) {
  try {
    const data = await listAdminProducts({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      search: req.query.search || null,
      status: req.query.status || null,
      stockState: req.query.stockState || null,
      categoryId: req.query.categoryId || null,
      brandId: req.query.brandId || null,
    });
    return successResponse(res, 'Lấy danh sách sản phẩm thành công', data);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách sản phẩm', { message: error.message });
  }
}

export async function detail(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return invalidId(res);

    const product = await getAdminProductById(productId);
    if (!product) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');

    const decantData = await getProductDecantData(productId, { includeBatches: true });
    return successResponse(res, 'Lấy chi tiết sản phẩm thành công', { ...product, ...decantData });
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi lấy chi tiết sản phẩm', { message: error.message });
  }
}

export async function create(req, res) {
  try {
    const parsed = createProductSchema.safeParse(normalizePayload(req.body));
    if (!parsed.success) {
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrorsFromZod(parsed.error) });
    }
    const relationErrors = await validateProductRelations(parsed.data);
    if (relationErrors) return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: relationErrors });

    const result = await createProduct(parsed.data);
    const product = await getAdminProductById(result.id);
    const auditContext = buildAuditContext(req);
    auditLog('PRODUCT_CREATE', req.user?.id, { productId: result.id, sku: result.sku });
    writeAdminAuditLog({ ...auditContext, action: 'PRODUCT_CREATE', targetType: 'product', targetId: result.id, newValue: parsed.data });
    return successResponse(res, 'Tạo sản phẩm thành công', product || result, 201);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi tạo sản phẩm', { message: error.message });
  }
}

export async function update(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return invalidId(res);

    const existing = await getAdminProductById(productId);
    if (!existing) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');

    const parsed = updateProductSchema.safeParse(normalizePayload(req.body));
    if (!parsed.success) {
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrorsFromZod(parsed.error) });
    }
    const priceErrors = validateCombinedPrice(parsed.data, existing);
    if (priceErrors) return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: priceErrors });
    const relationErrors = await validateProductRelations(parsed.data);
    if (relationErrors) return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: relationErrors });

    await updateProduct(productId, parsed.data);
    const product = await getAdminProductById(productId);
    const auditContext = buildAuditContext(req);
    auditLog('PRODUCT_UPDATE', req.user?.id, { productId });
    writeAdminAuditLog({ ...auditContext, action: 'PRODUCT_UPDATE', targetType: 'product', targetId: productId, oldValue: existing, newValue: parsed.data });
    return successResponse(res, 'Cập nhật sản phẩm thành công', product);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật sản phẩm', { message: error.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return invalidId(res);
    const parsed = statusProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, 400, 'Trạng thái không hợp lệ', { fields: fieldErrorsFromZod(parsed.error) });
    }
    const existing = await getAdminProductById(productId);
    if (!existing) return errorResponse(res, 404, 'KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m');
    const result = await updateProduct(productId, { status: parsed.data.status });
    if (!result) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');
    const product = await getAdminProductById(productId);
    const auditContext = buildAuditContext(req);
    auditLog('PRODUCT_STATUS_UPDATE', req.user?.id, { productId, status: parsed.data.status });
    writeAdminAuditLog({ ...auditContext, action: 'PRODUCT_STATUS_UPDATE', targetType: 'product', targetId: productId, oldValue: existing, newValue: { status: parsed.data.status } });
    return successResponse(res, 'Cập nhật trạng thái sản phẩm thành công', product);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật trạng thái sản phẩm', { message: error.message });
  }
}

export async function remove(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return invalidId(res);
    const result = await softDeleteProduct(productId);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');
    const auditContext = buildAuditContext(req);
    auditLog('PRODUCT_DELETE', req.user?.id, { productId, softDeletedOnly: result.softDeletedOnly });
    writeAdminAuditLog({ ...auditContext, action: 'PRODUCT_DELETE', targetType: 'product', targetId: productId, oldValue: null, newValue: result });
    return successResponse(res, result.softDeletedOnly ? 'Sản phẩm đã được ẩn vì đã phát sinh đơn hàng' : 'Xóa sản phẩm thành công', result);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi xóa sản phẩm', { message: error.message });
  }
}

export async function resetStock(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return invalidId(res);
    const parsed = resetStockSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrorsFromZod(parsed.error) });
    }
    const result = await resetProductStock(productId, parsed.data.stock);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');
    const auditContext = buildAuditContext(req);
    auditLog('PRODUCT_RESET_STOCK', req.user?.id, { productId, stock: parsed.data.stock });
    writeAdminAuditLog({ ...auditContext, action: 'PRODUCT_RESET_STOCK', targetType: 'product', targetId: productId, newValue: { stock: parsed.data.stock } });
    return successResponse(res, 'Cập nhật tồn kho thành công', result);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật tồn kho', { message: error.message });
  }
}
