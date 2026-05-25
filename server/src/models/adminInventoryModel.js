import { query } from '../config/database.js';
import { env } from '../config/env.js';
import { STATUS_GROUPS, sqlInClause } from '../modules/admin/order-status.js';
import { getProductStorageCapabilities } from '../modules/products/product.repository.js';
import { hasColumn } from '../modules/checkout/checkout.storage.js';

const LOW_STOCK_THRESHOLD = env.lowStockThreshold;

export async function listInventory({ page = 1, pageSize = 20, lowStock = false, categoryId = null } = {}) {
  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (safePage - 1) * safePageSize;

  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (lowStock) {
    conditions.push('p.stock < ?');
    params.push(LOW_STOCK_THRESHOLD);
  }
  if (categoryId) {
    conditions.push('p.id_category = ?');
    params.push(Number(categoryId));
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRows = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const total = Number(totalRows[0]?.total || 0);

  const revenueIn = sqlInClause(STATUS_GROUPS.REVENUE);

  const rows = await query(
    `SELECT p.id, p.sku, p.name, p.stock, p.price, p.status, p.id_category,
            c.name AS category_name,
            (SELECT TOP 1 oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.status IN (${revenueIn})
             ORDER BY o.created_at DESC) AS last_sold_item_id,
            (SELECT TOP 1 o.created_at FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.status IN (${revenueIn})
             ORDER BY o.created_at DESC) AS last_sold_date
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     ${whereSql}
     ORDER BY p.stock ASC, p.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, ...STATUS_GROUPS.REVENUE, ...STATUS_GROUPS.REVENUE, offset, safePageSize]
  );

  const products = rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    stock: Number(row.stock || 0),
    price: Number(row.price || 0),
    status: Boolean(row.status),
    categoryName: row.category_name,
    lastSoldDate: row.last_sold_date,
    isLowStock: Number(row.stock || 0) < LOW_STOCK_THRESHOLD,
  }));

  return {
    content: products,
    page: safePage,
    size: safePageSize,
    totalElements: total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    first: safePage === 1,
    last: safePage * safePageSize >= total,
  };
}

export async function getLowStockAlerts() {
  const capabilities = await getProductStorageCapabilities();
  const productConditions = [];
  if (hasColumn(capabilities.productColumns, 'deleted_at')) productConditions.push('p.deleted_at IS NULL');
  if (hasColumn(capabilities.productColumns, 'status')) productConditions.push('p.status = 1');
  const productWhere = productConditions.length ? productConditions.join(' AND ') : '1 = 1';
  const activeVariantConditions = [];
  if (hasColumn(capabilities.variantColumns, 'deleted_at')) activeVariantConditions.push('pv.deleted_at IS NULL');
  if (hasColumn(capabilities.variantColumns, 'status')) activeVariantConditions.push('ISNULL(pv.status, 1) = 1');
  const activeVariants = activeVariantConditions.length ? activeVariantConditions.join(' AND ') : '1 = 1';
  const variantExclusion = capabilities.hasVariants
    ? `AND NOT EXISTS (
         SELECT 1 FROM product_variants pv
         WHERE pv.product_id = p.id AND ${activeVariants}
       )`
    : '';
  const rows = await query(
    `SELECT p.id, p.sku, p.name, p.stock, p.price,
            c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     WHERE ${productWhere} AND p.stock < ?
       ${variantExclusion}
     ORDER BY p.stock ASC`,
    [LOW_STOCK_THRESHOLD]
  );

  const variants = capabilities.hasVariants && hasColumn(capabilities.variantColumns, 'stock_quantity')
    ? await query(
        `SELECT pv.id, pv.product_id, p.name AS product_name, pv.sku,
                pv.volume_label, pv.stock_quantity
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE ${productWhere}
           AND ${activeVariants}
           AND pv.stock_quantity < ?
         ORDER BY pv.stock_quantity ASC`,
        [LOW_STOCK_THRESHOLD]
      )
    : [];

  return {
    threshold: LOW_STOCK_THRESHOLD,
    totalLowStock: rows.length,
    totalLowStockVariants: variants.length,
    products: rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      stock: Number(r.stock || 0),
      price: Number(r.price || 0),
      categoryName: r.category_name,
    })),
    variants: variants.map((v) => ({
      id: v.id,
      productId: v.product_id,
      productName: v.product_name,
      sku: v.sku,
      volumeLabel: v.volume_label,
      stockQuantity: Number(v.stock_quantity || 0),
    })),
  };
}

export async function adjustStock({ productId, variantId = null, delta, reason = null, userId = null }) {
  if (variantId) {
    const variant = await query('SELECT TOP 1 id, stock_quantity FROM product_variants WHERE id = ? AND product_id = ?', [
      variantId,
      productId,
    ]);
    if (!variant.length) return { error: { status: 404, message: 'Không tìm thấy variant' } };

    const newStock = Number(variant[0].stock_quantity) + delta;
    if (newStock < 0) return { error: { status: 400, message: 'Tồn kho không thể âm' } };

    await query('UPDATE product_variants SET stock_quantity = ?, updated_at = GETDATE() WHERE id = ?', [newStock, variantId]);
  } else {
    const product = await query('SELECT TOP 1 id, stock FROM products WHERE id = ?', [productId]);
    if (!product.length) return { error: { status: 404, message: 'Không tìm thấy sản phẩm' } };

    const newStock = Number(product[0].stock) + delta;
    if (newStock < 0) return { error: { status: 400, message: 'Tồn kho không thể âm' } };

    await query('UPDATE products SET stock = ?, quantity = ?, updated_at = GETDATE() WHERE id = ?', [
      newStock,
      newStock,
      productId,
    ]);
  }

  // Log transaction to audit table
  try {
    await query(
      `INSERT INTO inventory_transactions (product_id, variant_id, delta, reason, performed_by, created_at)
       VALUES (?, ?, ?, ?, ?, GETDATE())`,
      [productId, variantId, delta, reason || null, userId || null]
    );
  } catch {
    // inventory_transactions table may not exist; fail silently
  }

  return { success: true, productId, variantId, delta };
}

export async function getTransactionHistory({ productId = null, page = 1, pageSize = 20 } = {}) {
  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (safePage - 1) * safePageSize;

  const conditions = [];
  const params = [];

  if (productId) {
    conditions.push('it.product_id = ?');
    params.push(Number(productId));
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let total = 0;
  try {
    const totalRows = await query(`SELECT COUNT(*) AS total FROM inventory_transactions it ${whereSql}`, params);
    total = Number(totalRows[0]?.total || 0);
  } catch {
    return { content: [], page: safePage, size: safePageSize, totalElements: 0, totalPages: 1, first: true, last: true };
  }

  let rows = [];
  try {
    rows = await query(
      `SELECT it.id, it.product_id, it.variant_id, it.delta, it.reason, it.performed_by, it.created_at,
              p.name AS product_name
       FROM inventory_transactions it
       LEFT JOIN products p ON p.id = it.product_id
       ${whereSql}
       ORDER BY it.id DESC
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      [...params, offset, safePageSize]
    );
  } catch {
    rows = [];
  }

  return {
    content: rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      variantId: r.variant_id,
      delta: Number(r.delta || 0),
      reason: r.reason,
      performedBy: r.performed_by,
      createdAt: r.created_at,
      productName: r.product_name,
    })),
    page: safePage,
    size: safePageSize,
    totalElements: total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    first: safePage === 1,
    last: safePage * safePageSize >= total,
  };
}
