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
import { auditLog } from '../config/logger.js';

const productAliases = {
  batch_code: ['batchCode'],
  discount_price: ['discountPrice'],
  volume_ml: ['volumeMl'],
  scent_notes: ['scentNotes'],
  is_decant: ['isDecant'],
  id_category: ['categoryId', 'idCategory'],
  id_brand: ['brandId', 'idBrand'],
};

function normalizeProductPayload(body = {}) {
  const normalized = { ...body };
  for (const [databaseField, aliases] of Object.entries(productAliases)) {
    if (normalized[databaseField] !== undefined) continue;
    const alias = aliases.find((name) => body[name] !== undefined);
    if (alias) normalized[databaseField] = body[alias];
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
  const discountPrice = Object.prototype.hasOwnProperty.call(data, 'discount_price')
    ? data.discount_price
    : existing?.discountPrice;
  if (discountPrice !== null && discountPrice !== undefined && discountPrice >= price) {
    return { discount_price: ['Giá khuyến mãi phải nhỏ hơn giá bán'] };
  }
  return null;
}

async function validateReferences(data) {
  return validateProductRelations(data);
}

function invalidId(res) {
  return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');
}

export async function listProducts(req, res) {
  try {
    const data = await listAdminProducts({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      includeInactive: req.query.includeInactive !== 'false',
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

    return successResponse(res, 'Lấy chi tiết sản phẩm thành công', product);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi lấy chi tiết sản phẩm', { message: error.message });
  }
}

export async function create(req, res) {
  try {
    const parsed = createProductSchema.safeParse(normalizeProductPayload(req.body));
    if (!parsed.success) {
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrorsFromZod(parsed.error) });
    }
    const referenceErrors = await validateReferences(parsed.data);
    if (referenceErrors) return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: referenceErrors });

    const result = await createProduct(parsed.data);
    const product = await getAdminProductById(result.id);
    auditLog('PRODUCT_CREATE', req.user?.id, { productId: result.id, sku: result.sku });
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

    const parsed = updateProductSchema.safeParse(normalizeProductPayload(req.body));
    if (!parsed.success) {
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrorsFromZod(parsed.error) });
    }
    const priceErrors = validateCombinedPrice(parsed.data, existing);
    if (priceErrors) return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: priceErrors });
    const referenceErrors = await validateReferences(parsed.data);
    if (referenceErrors) return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: referenceErrors });

    await updateProduct(productId, parsed.data);
    const product = await getAdminProductById(productId);
    auditLog('PRODUCT_UPDATE', req.user?.id, { productId });
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
    const result = await updateProduct(productId, parsed.data);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');
    const product = await getAdminProductById(productId);
    auditLog('PRODUCT_STATUS_UPDATE', req.user?.id, { productId, status: parsed.data.status });
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
    auditLog('PRODUCT_DELETE', req.user?.id, { productId });
    return successResponse(res, 'Xóa sản phẩm thành công', result);
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
    auditLog('PRODUCT_RESET_STOCK', req.user?.id, { productId, stock: parsed.data.stock });
    return successResponse(res, 'Cập nhật tồn kho thành công', result);
  } catch (error) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật tồn kho', { message: error.message });
  }
}
