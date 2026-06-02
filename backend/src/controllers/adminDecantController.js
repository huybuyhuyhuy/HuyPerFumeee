import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../config/database.js';
import { getProductStorageCapabilities } from '../modules/products/product.repository.js';
import {
  createDecantOption,
  createProductBatch,
  updateDecantOption,
  updateProductBatch,
} from '../models/decantModel.js';

let decantRouteCapabilitiesPromise = null;

function hasColumn(columns, name) {
  return columns.has(String(name).toLowerCase());
}

async function getDecantRouteCapabilities() {
  if (!decantRouteCapabilitiesPromise) {
    decantRouteCapabilitiesPromise = query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME IN ('product_batches', 'decant_options')
    `).then((rows) => {
      const tables = new Set(rows.map((row) => String(row.TABLE_NAME || '').toLowerCase()));
      return {
        hasProductBatches: tables.has('product_batches'),
        hasDecantOptions: tables.has('decant_options'),
      };
    });
  }
  return decantRouteCapabilitiesPromise;
}

function productColumn(capabilities, column, fallback = 'NULL') {
  return hasColumn(capabilities.productColumns, column) ? `p.${column}` : fallback;
}

export async function listDecantProducts(req, res) {
  try {
    const [productCapabilities, decantCapabilities] = await Promise.all([
      getProductStorageCapabilities(),
      getDecantRouteCapabilities(),
    ]);
    const conditions = [];
    if (hasColumn(productCapabilities.productColumns, 'deleted_at')) conditions.push('p.deleted_at IS NULL');
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const categoryJoin = productCapabilities.hasCategories && hasColumn(productCapabilities.productColumns, 'id_category')
      ? 'LEFT JOIN categories c ON c.id = p.id_category'
      : '';
    const inventoryJoin = decantCapabilities.hasProductBatches
      ? `LEFT JOIN product_inventory pi ON pi.product_id = p.id
         LEFT JOIN (
           SELECT product_id,
                  SUM(ISNULL(remaining_volume_ml, 0)) AS remaining_volume_ml,
                  SUM(ISNULL(total_volume_ml, 0)) AS total_volume_ml
           FROM product_batches
           WHERE status = N'ACTIVE'
           GROUP BY product_id
         ) b ON b.product_id = p.id`
      : '';
    const hasDecantOptionsSelect = decantCapabilities.hasDecantOptions
      ? 'CASE WHEN EXISTS (SELECT 1 FROM decant_options d WHERE d.product_id = p.id AND d.status = 1) THEN 1 ELSE 0 END'
      : '0';
    const rows = await query(
      `SELECT p.id,
              p.name,
              ${productColumn(productCapabilities, 'sku')} AS sku,
              ${productColumn(productCapabilities, 'price', '0')} AS price,
              ${productColumn(productCapabilities, 'stock', productColumn(productCapabilities, 'quantity', '0'))} AS stock,
              ${categoryJoin ? 'c.name' : 'NULL'} AS category_name,
              ${inventoryJoin ? 'COALESCE(pi.sealed_bottles, 0)' : '0'} AS sealed_bottles,
              ${inventoryJoin ? 'COALESCE(CASE WHEN b.remaining_volume_ml IS NULL THEN pi.opened_ml ELSE b.remaining_volume_ml END, 0)' : '0'} AS remaining_volume_ml,
              ${inventoryJoin ? 'COALESCE(pi.bottle_volume_ml, NULLIF(b.total_volume_ml, 0), 100)' : '100'} AS bottle_volume_ml,
              ${inventoryJoin ? 'COALESCE(b.total_volume_ml, 0)' : '0'} AS total_volume_ml,
              ${inventoryJoin ? 'CASE WHEN COALESCE(pi.opened_ml, 0) > 0 OR COALESCE(b.remaining_volume_ml, 0) < COALESCE(b.total_volume_ml, 0) THEN 1 ELSE 0 END' : '0'} AS is_opened_bottle,
              ${hasDecantOptionsSelect} AS has_decant_options
       FROM products p
       ${categoryJoin}
       ${inventoryJoin}
       ${whereSql}
       ORDER BY p.name ASC`
    );
    return successResponse(res, 'Lay danh sach san pham decant thanh cong', { content: rows });
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi lay danh sach decant', { message: err.message });
  }
}

export async function listBatches(req, res) {
  try {
    const capabilities = await getDecantRouteCapabilities();
    if (!capabilities.hasProductBatches) {
      return successResponse(res, 'Lay danh sach batch thanh cong', { content: [] });
    }
    const productId = Number(req.params.id);
    const rows = await query('SELECT * FROM product_batches WHERE product_id = ? ORDER BY id DESC', [productId]);
    return successResponse(res, 'Lay danh sach batch thanh cong', { content: rows });
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi lay batch', { message: err.message });
  }
}

export async function createBatch(req, res) {
  try {
    const capabilities = await getDecantRouteCapabilities();
    if (!capabilities.hasProductBatches) return errorResponse(res, 501, 'Chua cau hinh bang product_batches');
    const productId = Number(req.params.id);
    const result = await createProductBatch(productId, req.body);
    if (result.code) return errorResponse(res, result.code, result.message);
    return successResponse(res, 'Tao batch thanh cong', result, 201);
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi tao batch', { message: err.message });
  }
}

export async function updateBatch(req, res) {
  try {
    const capabilities = await getDecantRouteCapabilities();
    if (!capabilities.hasProductBatches) return errorResponse(res, 501, 'Chua cau hinh bang product_batches');
    const batchId = Number(req.params.id);
    const result = await updateProductBatch(batchId, {
      ...req.body,
      adminId: req.user?.id || req.body?.adminId || null,
      movementType: req.body?.movementType || 'MANUAL_ADJUST',
    });
    if (result.code) return errorResponse(res, result.code, result.message);
    return successResponse(res, 'Cap nhat batch thanh cong', result);
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi cap nhat batch', { message: err.message });
  }
}

export async function listOptions(req, res) {
  try {
    const capabilities = await getDecantRouteCapabilities();
    if (!capabilities.hasDecantOptions) {
      return successResponse(res, 'Lay danh sach option thanh cong', { content: [] });
    }
    const productId = Number(req.params.id);
    const rows = await query('SELECT * FROM decant_options WHERE product_id = ? ORDER BY volume_ml ASC', [productId]);
    return successResponse(res, 'Lay danh sach option thanh cong', { content: rows });
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi lay option decant', { message: err.message });
  }
}

export async function createOption(req, res) {
  try {
    const capabilities = await getDecantRouteCapabilities();
    if (!capabilities.hasDecantOptions) return errorResponse(res, 501, 'Chua cau hinh bang decant_options');
    const productId = Number(req.params.id);
    const result = await createDecantOption(productId, req.body);
    if (result.code) return errorResponse(res, result.code, result.message);
    return successResponse(res, 'Tao option thanh cong', result, 201);
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi tao option decant', { message: err.message });
  }
}

export async function updateOption(req, res) {
  try {
    const capabilities = await getDecantRouteCapabilities();
    if (!capabilities.hasDecantOptions) return errorResponse(res, 501, 'Chua cau hinh bang decant_options');
    const optionId = Number(req.params.id);
    const result = await updateDecantOption(optionId, req.body);
    if (result.code) return errorResponse(res, result.code, result.message);
    return successResponse(res, 'Cap nhat option thanh cong', result);
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi cap nhat option decant', { message: err.message });
  }
}

export async function removeOption(req, res) {
  try {
    const capabilities = await getDecantRouteCapabilities();
    if (!capabilities.hasDecantOptions) {
      return successResponse(res, 'Xoa option thanh cong', {});
    }
    const optionId = Number(req.params.id);
    await query('DELETE FROM decant_options WHERE id = ?', [optionId]);
    return successResponse(res, 'Xoa option thanh cong', {});
  } catch (err) {
    return errorResponse(res, 500, 'Loi khi xoa option decant', { message: err.message });
  }
}
