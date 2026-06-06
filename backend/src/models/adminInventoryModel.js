import { query } from '../config/database.js';
import { env } from '../config/env.js';
import { STATUS_GROUPS, sqlInClause } from '../modules/admin/order-status.js';
import { getProductStorageCapabilities } from '../modules/products/product.repository.js';
import { hasColumn } from '../modules/checkout/checkout.storage.js';

const LOW_STOCK_THRESHOLD = env.lowStockThreshold;
let inventoryLedgerReadyPromise = null;
let inventoryLedgerColumnsPromise = null;

function productColumn(capabilities, column, fallback = 'NULL') {
  return hasColumn(capabilities.productColumns, column) ? `p.${column}` : fallback;
}

function firstProductColumn(capabilities, columns, fallback = '0') {
  const found = columns.find((column) => hasColumn(capabilities.productColumns, column));
  return found ? `p.${found}` : fallback;
}

function productStockExpression(capabilities) {
  return firstProductColumn(capabilities, ['stock', 'quantity'], '0');
}

async function ensureInventoryLedgerCompatibility() {
  if (!inventoryLedgerReadyPromise) {
    inventoryLedgerReadyPromise = query(`
      IF OBJECT_ID(N'dbo.inventory_transactions', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.inventory_transactions (
          id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          product_id INT NOT NULL,
          variant_id INT NULL,
          product_variant_id INT NULL,
          transaction_type NVARCHAR(40) NULL,
          delta INT NULL,
          quantity INT NULL,
          stock_before INT NULL,
          stock_after INT NULL,
          reason NVARCHAR(500) NULL,
          reference_type NVARCHAR(50) NULL,
          reference_id INT NULL,
          performed_by INT NULL,
          metadata NVARCHAR(MAX) NULL,
          created_at DATETIME2 NOT NULL CONSTRAINT DF_inventory_transactions_created_at DEFAULT SYSUTCDATETIME()
        );
      END;

      IF COL_LENGTH('dbo.inventory_transactions', 'variant_id') IS NULL
        ALTER TABLE dbo.inventory_transactions ADD variant_id INT NULL;
      IF COL_LENGTH('dbo.inventory_transactions', 'product_variant_id') IS NULL
        ALTER TABLE dbo.inventory_transactions ADD product_variant_id INT NULL;
      IF COL_LENGTH('dbo.inventory_transactions', 'delta') IS NULL
        ALTER TABLE dbo.inventory_transactions ADD delta INT NULL;
      IF COL_LENGTH('dbo.inventory_transactions', 'reason') IS NULL
        ALTER TABLE dbo.inventory_transactions ADD reason NVARCHAR(500) NULL;
      IF COL_LENGTH('dbo.inventory_transactions', 'reference_type') IS NULL
        ALTER TABLE dbo.inventory_transactions ADD reference_type NVARCHAR(50) NULL;
      IF COL_LENGTH('dbo.inventory_transactions', 'reference_id') IS NULL
        ALTER TABLE dbo.inventory_transactions ADD reference_id INT NULL;
      IF COL_LENGTH('dbo.inventory_transactions', 'performed_by') IS NULL
        ALTER TABLE dbo.inventory_transactions ADD performed_by INT NULL;

      IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_inventory_transactions_type')
        ALTER TABLE dbo.inventory_transactions DROP CONSTRAINT CK_inventory_transactions_type;
      IF COL_LENGTH('dbo.inventory_transactions', 'transaction_type') IS NOT NULL
        ALTER TABLE dbo.inventory_transactions WITH NOCHECK ADD CONSTRAINT CK_inventory_transactions_type
        CHECK (
          transaction_type IS NULL OR transaction_type IN (
            N'RESERVE', N'COMMIT', N'RELEASE', N'RESTORE', N'ADJUST',
            N'IMPORT', N'IMPORT_CANCEL', N'SALE', N'ORDER_CANCEL', N'ADJUSTMENT'
          )
        );
    `).then((result) => {
      inventoryLedgerColumnsPromise = null;
      return result;
    });
    inventoryLedgerReadyPromise = inventoryLedgerReadyPromise.catch((error) => {
      inventoryLedgerReadyPromise = null;
      throw error;
    });
  }
  return inventoryLedgerReadyPromise;
}

async function getInventoryLedgerColumns() {
  await ensureInventoryLedgerCompatibility();
  if (!inventoryLedgerColumnsPromise) {
    inventoryLedgerColumnsPromise = query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'inventory_transactions'
    `).then((rows) => new Set(rows.map((row) => String(row.COLUMN_NAME || '').toLowerCase())));
  }
  return inventoryLedgerColumnsPromise;
}

async function recordAdjustmentLedger({ productId, variantId = null, delta, reason = null, userId = null, stockBefore = null, stockAfter = null }) {
  try {
    const columns = await getInventoryLedgerColumns();
    const insertColumns = [];
    const placeholders = [];
    const params = [];
    const add = (column, value) => {
      if (!columns.has(column)) return;
      insertColumns.push(column);
      placeholders.push('?');
      params.push(value);
    };

    add('product_id', productId);
    add('variant_id', variantId);
    add('product_variant_id', variantId);
    add('transaction_type', 'ADJUSTMENT');
    add('delta', delta);
    add('quantity', Math.abs(delta));
    add('stock_before', stockBefore);
    add('stock_after', stockAfter);
    add('reason', reason || 'Điều chỉnh tồn kho');
    add('reference_type', 'ADJUSTMENT');
    add('performed_by', userId || null);
    add('metadata', JSON.stringify({ reason: reason || null, source: 'admin_inventory_adjust' }));

    if (!insertColumns.length) return;
    await query(
      `INSERT INTO inventory_transactions (${insertColumns.join(', ')})
       VALUES (${placeholders.join(', ')})`,
      params
    );
  } catch {
    // Inventory ledger should not block stock correction if schema repair fails.
  }
}

function activeProductConditions(capabilities) {
  const conditions = [];
  if (hasColumn(capabilities.productColumns, 'deleted_at')) conditions.push('p.deleted_at IS NULL');
  return conditions;
}

export async function listInventory({ page = 1, pageSize = 20, lowStock = false, categoryId = null } = {}) {
  const capabilities = await getProductStorageCapabilities();
  const stockExpr = productStockExpression(capabilities);
  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (safePage - 1) * safePageSize;

  const conditions = activeProductConditions(capabilities);
  const params = [];

  if (lowStock) {
    conditions.push(`ISNULL(${stockExpr}, 0) < ?`);
    params.push(LOW_STOCK_THRESHOLD);
  }
  if (categoryId && hasColumn(capabilities.productColumns, 'id_category')) {
    conditions.push('p.id_category = ?');
    params.push(Number(categoryId));
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const categoryJoin = capabilities.hasCategories && hasColumn(capabilities.productColumns, 'id_category')
    ? 'LEFT JOIN categories c ON c.id = p.id_category'
    : '';
  const categorySelect = categoryJoin ? 'c.name AS category_name' : 'NULL AS category_name';

  const totalRows = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const total = Number(totalRows[0]?.total || 0);

  const revenueIn = sqlInClause(STATUS_GROUPS.REVENUE);

  const rows = await query(
    `SELECT p.id,
            ${productColumn(capabilities, 'sku')} AS sku,
            p.name,
            ${stockExpr} AS stock,
            ${productColumn(capabilities, 'price', '0')} AS price,
            ${productColumn(capabilities, 'status', '1')} AS status,
            ${productColumn(capabilities, 'id_category')} AS id_category,
            ${categorySelect},
            (SELECT TOP 1 oi.id FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.status IN (${revenueIn})
             ORDER BY o.created_at DESC) AS last_sold_item_id,
            (SELECT TOP 1 o.created_at FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.status IN (${revenueIn})
             ORDER BY o.created_at DESC) AS last_sold_date
     FROM products p
     ${categoryJoin}
     ${whereSql}
     ORDER BY ISNULL(${stockExpr}, 0) ASC, p.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...STATUS_GROUPS.REVENUE, ...STATUS_GROUPS.REVENUE, ...params, offset, safePageSize]
  );

  const products = rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    stock: Number(row.stock || 0),
    price: Number(row.price || 0),
    status: Number(row.status) !== 0,
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
  const stockExpr = productStockExpression(capabilities);
  const productConditions = activeProductConditions(capabilities);
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
    `SELECT p.id,
            ${productColumn(capabilities, 'sku')} AS sku,
            p.name,
            ${stockExpr} AS stock,
            ${productColumn(capabilities, 'price', '0')} AS price,
            ${capabilities.hasCategories && hasColumn(capabilities.productColumns, 'id_category') ? 'c.name' : 'NULL'} AS category_name
     FROM products p
     ${capabilities.hasCategories && hasColumn(capabilities.productColumns, 'id_category') ? 'LEFT JOIN categories c ON c.id = p.id_category' : ''}
     WHERE ${productWhere} AND ISNULL(${stockExpr}, 0) < ?
       ${variantExclusion}
     ORDER BY ISNULL(${stockExpr}, 0) ASC`,
    [LOW_STOCK_THRESHOLD]
  );

  const variants = capabilities.hasVariants && hasColumn(capabilities.variantColumns, 'stock_quantity')
    ? await query(
        `SELECT pv.id, pv.product_id, p.name AS product_name,
                ${hasColumn(capabilities.variantColumns, 'sku') ? 'pv.sku' : 'NULL'} AS sku,
                ${hasColumn(capabilities.variantColumns, 'volume_label') ? 'pv.volume_label' : 'NULL'} AS volume_label,
                pv.stock_quantity
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
  const capabilities = await getProductStorageCapabilities();
  let stockBefore = null;
  let stockAfter = null;
  if (variantId) {
    if (!capabilities.hasVariants || !hasColumn(capabilities.variantColumns, 'stock_quantity')) {
      return { error: { status: 501, message: 'Schema chua ho tro ton kho variant' } };
    }
    const variant = await query('SELECT TOP 1 id, stock_quantity FROM product_variants WHERE id = ? AND product_id = ?', [
      variantId,
      productId,
    ]);
    if (!variant.length) return { error: { status: 404, message: 'Không tìm thấy variant' } };

    stockBefore = Number(variant[0].stock_quantity);
    const newStock = stockBefore + delta;
    if (newStock < 0) return { error: { status: 400, message: 'Tồn kho không thể âm' } };

    const updatedAt = hasColumn(capabilities.variantColumns, 'updated_at') ? ', updated_at = GETDATE()' : '';
    await query(`UPDATE product_variants SET stock_quantity = ?${updatedAt} WHERE id = ?`, [newStock, variantId]);
    stockAfter = newStock;
  } else {
    const stockExpr = productStockExpression(capabilities);
    const product = await query(`SELECT TOP 1 id, ${stockExpr} AS stock FROM products p WHERE id = ?`, [productId]);
    if (!product.length) return { error: { status: 404, message: 'Không tìm thấy sản phẩm' } };

    stockBefore = Number(product[0].stock);
    const newStock = stockBefore + delta;
    if (newStock < 0) return { error: { status: 400, message: 'Tồn kho không thể âm' } };

    const updates = [];
    const params = [];
    if (hasColumn(capabilities.productColumns, 'stock')) {
      updates.push('stock = ?');
      params.push(newStock);
    }
    if (hasColumn(capabilities.productColumns, 'quantity')) {
      updates.push('quantity = ?');
      params.push(newStock);
    }
    if (!updates.length) return { error: { status: 501, message: 'Schema products chua co cot ton kho' } };
    if (hasColumn(capabilities.productColumns, 'updated_at')) updates.push('updated_at = GETDATE()');
    await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, [...params, productId]);
    stockAfter = newStock;
  }

  await recordAdjustmentLedger({ productId, variantId, delta, reason, userId, stockBefore, stockAfter });

  return { success: true, productId, variantId, delta };
}

export async function getTransactionHistory({ productId = null, page = 1, pageSize = 20 } = {}) {
  await ensureInventoryLedgerCompatibility();
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
