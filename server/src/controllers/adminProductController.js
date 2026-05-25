import { successResponse, errorResponse } from '../utils/response.js';
import {
  listAdminProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
  resetProductStock,
} from '../models/adminProductModel.js';
import {
  createProductSchema,
  updateProductSchema,
  resetStockSchema,
} from '../modules/admin/admin.validation.js';
import { auditLog } from '../config/logger.js';
import { getProductById } from '../modules/products/product.service.js';

export async function listProducts(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const includeInactive = req.query.includeInactive !== 'false';
    const data = await listAdminProducts({
      page,
      pageSize,
      includeInactive,
      search: req.query.search || null,
      status: req.query.status || null,
      stockState: req.query.stockState || null,
    });
    return successResponse(res, 'Lấy danh sách sản phẩm thành công', data);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy danh sách sản phẩm', { message: err.message });
  }
}

export async function detail(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');

    const product = await getProductById(productId);
    if (!product) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');

    return successResponse(res, 'Lấy chi tiết sản phẩm thành công', product);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy chi tiết sản phẩm', { message: err.message });
  }
}

export async function create(req, res) {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }

    const result = await createProduct(parsed.data);
    auditLog('PRODUCT_CREATE', req.user?.id, { productId: result.id, sku: result.sku });
    return successResponse(res, 'Tạo sản phẩm thành công', result, 201);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi tạo sản phẩm', { message: err.message });
  }
}

export async function update(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', { fields: fieldErrors });
    }

    const result = await updateProduct(productId, parsed.data);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');

    auditLog('PRODUCT_UPDATE', req.user?.id, { productId });
    return successResponse(res, 'Cập nhật sản phẩm thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật sản phẩm', { message: err.message });
  }
}

export async function remove(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');

    const result = await softDeleteProduct(productId);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');

    auditLog('PRODUCT_DELETE', req.user?.id, { productId });
    return successResponse(res, 'Xóa sản phẩm thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi xóa sản phẩm', { message: err.message });
  }
}

export async function resetStock(req, res) {
  try {
    const productId = Number(req.params.id);
    if (!productId) return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');

    const parsed = resetStockSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, 400, 'Dữ liệu không hợp lệ', {
        fields: { stock: [parsed.error.issues[0]?.message || 'Tồn kho không hợp lệ'] },
      });
    }

    const result = await resetProductStock(productId, parsed.data.stock);
    if (!result) return errorResponse(res, 404, 'Không tìm thấy sản phẩm');

    auditLog('PRODUCT_RESET_STOCK', req.user?.id, { productId, stock: parsed.data.stock });
    return successResponse(res, 'Cập nhật tồn kho thành công', result);
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi cập nhật tồn kho', { message: err.message });
  }
}
