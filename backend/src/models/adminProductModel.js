import { query } from '../config/database.js';
import { invalidateProductCache } from '../modules/products/product.service.js';

let productCapabilitiesPromise = null;

async function getProductCapabilities() {
  if (!productCapabilitiesPromise) {
    productCapabilitiesPromise = (async () => {
      const [columns, variantColumns, tables] = await Promise.all([
        query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'products'`),
        query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'product_variants'`),
        query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME IN ('product_images', 'product_variants', 'brand', 'categories')`),
      ]);
      return {
        columns: new Set(columns.map((row) => String(row.COLUMN_NAME).toLowerCase())),
        variantColumns: new Set(variantColumns.map((row) => String(row.COLUMN_NAME).toLowerCase())),
        tables: new Set(tables.map((row) => String(row.TABLE_NAME).toLowerCase())),
      };
    })();
  }
  return productCapabilitiesPromise;
}

function hasColumn(capabilities, name) {
  return capabilities.columns.has(String(name).toLowerCase());
}

function hasVariantColumn(capabilities, name) {
  return capabilities.variantColumns.has(String(name).toLowerCase());
}

function hasTable(capabilities, name) {
  return capabilities.tables.has(String(name).toLowerCase());
}

function productColumn(capabilities, name, fallback = 'NULL') {
  return hasColumn(capabilities, name) ? `p.${name}` : fallback;
}

function firstProductColumn(capabilities, names, fallback = 'NULL') {
  const found = names.find((name) => hasColumn(capabilities, name));
  return found ? `p.${found}` : fallback;
}

function stockColumn(capabilities) {
  return firstProductColumn(capabilities, ['stock', 'quantity'], '0');
}

function variantStockExpr(capabilities) {
  if (!capabilities.tables.has('product_variants')) return 'NULL';
  const stockField = hasVariantColumn(capabilities, 'stock_quantity')
    ? 'stock_quantity'
    : hasVariantColumn(capabilities, 'stock')
      ? 'stock'
      : null;
  if (!stockField) return 'NULL';
  const conditions = ['v.product_id = p.id'];
  if (hasVariantColumn(capabilities, 'deleted_at')) conditions.push('v.deleted_at IS NULL');
  if (hasVariantColumn(capabilities, 'status')) conditions.push('ISNULL(v.status, 1) = 1');
  return `(SELECT SUM(ISNULL(v.${stockField}, 0)) FROM product_variants v WHERE ${conditions.join(' AND ')})`;
}

function variantStockApply(capabilities) {
  if (!capabilities.tables.has('product_variants')) return '';
  const stockField = hasVariantColumn(capabilities, 'stock_quantity')
    ? 'stock_quantity'
    : hasVariantColumn(capabilities, 'stock')
      ? 'stock'
      : null;
  if (!stockField) return '';
  const conditions = ['v.product_id = p.id'];
  if (hasVariantColumn(capabilities, 'deleted_at')) conditions.push('v.deleted_at IS NULL');
  if (hasVariantColumn(capabilities, 'status')) conditions.push('ISNULL(v.status, 1) = 1');
  return `OUTER APPLY (SELECT SUM(ISNULL(v.${stockField}, 0)) AS variant_stock FROM product_variants v WHERE ${conditions.join(' AND ')}) pv`;
}

function baseWhere(capabilities) {
  return hasColumn(capabilities, 'deleted_at') ? ['p.deleted_at IS NULL'] : [];
}

function toBoolean(value) {
  return Boolean(Number(value) || value === true);
}

async function getBySku(sku, excludeId = null) {
  if (!sku) return null;
  const rows = await query(
    `SELECT TOP 1 id FROM products WHERE sku = ? ${excludeId ? 'AND id <> ?' : ''}`,
    excludeId ? [sku, excludeId] : [sku]
  );
  return rows[0] || null;
}

async function validateForeignKeys(data) {
  const capabilities = await getProductCapabilities();
  const errors = {};
  if (data.id_category !== undefined && data.id_category !== null && hasColumn(capabilities, 'id_category') && hasTable(capabilities, 'categories')) {
    const category = await query('SELECT TOP 1 id FROM categories WHERE id = ?', [data.id_category]);
    if (!category.length) errors.id_category = ['Danh mục không tồn tại'];
  }
  if (data.id_brand !== undefined && data.id_brand !== null && hasColumn(capabilities, 'id_brand') && hasTable(capabilities, 'brand')) {
    const brand = await query('SELECT TOP 1 id FROM brand WHERE id = ?', [data.id_brand]);
    if (!brand.length) errors.id_brand = ['Thương hiệu không tồn tại'];
  }
  return Object.keys(errors).length ? errors : null;
}

function buildProductRow(row) {
  return {
    id: row.id,
    sku: row.sku,
    batchCode: row.batch_code,
    name: row.name,
    price: Number(row.price || 0),
    discountPrice: row.discount_price === null ? null : Number(row.discount_price),
    stock: Number(row.stock || 0),
    status: Number(row.status) === 1,
    categoryId: row.id_category,
    brandId: row.id_brand,
    idCategory: row.id_category,
    idBrand: row.id_brand,
    volumeMl: row.volume_ml === null ? null : Number(row.volume_ml),
    description: row.description || '',
    scentNotes: row.scent_notes || '',
    isDecant: Number(row.is_decant) === 1,
    image: row.image || '',
    categoryName: row.category_name || '',
    brandName: row.brand_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category_name ? { id: row.id_category, name: row.category_name } : null,
    brand: row.brand_name ? { id: row.id_brand, name: row.brand_name } : null,
  };
}

export async function listAdminProducts({ page = 1, pageSize = 20, search = null, status = null, stockState = null, categoryId = null, brandId = null } = {}) {
  const capabilities = await getProductCapabilities();
  const stockExpr = stockColumn(capabilities);
  const variantStockApplySql = variantStockApply(capabilities);
  const stockSelectExpr = variantStockApplySql ? `COALESCE(pv.variant_stock, ${stockExpr})` : stockExpr;
  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (safePage - 1) * safePageSize;
  const conditions = baseWhere(capabilities);
  const params = [];

  if (search) {
    const pattern = `%${String(search).trim()}%`;
    const columns = ['p.name'];
    if (hasColumn(capabilities, 'sku')) columns.push('p.sku');
    if (hasColumn(capabilities, 'batch_code')) columns.push('p.batch_code');
    conditions.push(`(${columns.map((column) => `${column} LIKE ?`).join(' OR ')})`);
    params.push(...columns.map(() => pattern));
  }
  if (status === 'active' && hasColumn(capabilities, 'status')) conditions.push('p.status = 1');
  if (status === 'inactive' && hasColumn(capabilities, 'status')) conditions.push('p.status = 0');
  if (stockState === 'low') conditions.push(`ISNULL(${stockSelectExpr}, 0) BETWEEN 1 AND 5`);
  if (stockState === 'out') conditions.push(`ISNULL(${stockSelectExpr}, 0) = 0`);
  if (stockState === 'available') conditions.push(`ISNULL(${stockSelectExpr}, 0) > 5`);
  if (Number(categoryId) > 0 && hasColumn(capabilities, 'id_category')) { conditions.push('p.id_category = ?'); params.push(Number(categoryId)); }
  if (Number(brandId) > 0 && hasColumn(capabilities, 'id_brand')) { conditions.push('p.id_brand = ?'); params.push(Number(brandId)); }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const categoryJoin = hasTable(capabilities, 'categories') && hasColumn(capabilities, 'id_category')
    ? 'LEFT JOIN categories c ON c.id = p.id_category'
    : '';
  const brandJoin = hasTable(capabilities, 'brand') && hasColumn(capabilities, 'id_brand')
    ? 'LEFT JOIN brand b ON b.id = p.id_brand'
    : '';
  const categoryNameSelect = categoryJoin ? 'c.name' : 'NULL';
  const brandNameSelect = brandJoin ? 'b.name' : 'NULL';
  const summaryRows = await query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN ${productColumn(capabilities, 'status', '1')} = 1 THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN ${productColumn(capabilities, 'status', '1')} = 0 THEN 1 ELSE 0 END) AS inactive,
            SUM(CASE WHEN ISNULL(${stockSelectExpr}, 0) = 0 THEN 1 ELSE 0 END) AS out_of_stock,
            SUM(CASE WHEN ISNULL(${stockSelectExpr}, 0) BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS low_stock,
            SUM(ISNULL(${stockSelectExpr}, 0)) AS total_stock,
            SUM(ISNULL(${stockSelectExpr}, 0) * ISNULL(${productColumn(capabilities, 'price', '0')}, 0)) AS stock_value,
            SUM(CASE WHEN ISNULL(${productColumn(capabilities, 'is_decant', '0')}, 0) = 1 THEN 1 ELSE 0 END) AS decant_count
     FROM products p
     ${variantStockApplySql}
     ${baseWhere(capabilities).length ? `WHERE ${baseWhere(capabilities).join(' AND ')}` : ''}`
  );
  const totalRows = await query(`SELECT COUNT(*) AS total FROM products p ${variantStockApplySql} ${whereSql}`, params);
  const categoryRows = categoryJoin ? await query(
    `SELECT TOP 8 COALESCE(c.name, N'Chưa phân loại') AS categoryName, COUNT(*) AS total, SUM(ISNULL(${stockSelectExpr}, 0)) AS stock
     FROM products p
     ${categoryJoin}
     ${variantStockApplySql}
     ${baseWhere(capabilities).length ? `WHERE ${baseWhere(capabilities).join(' AND ')}` : ''}
     GROUP BY COALESCE(c.name, N'Chưa phân loại')
     ORDER BY total DESC`
  ) : await query(
    `SELECT N'Chua phan loai' AS categoryName, COUNT(*) AS total, SUM(ISNULL(${stockSelectExpr}, 0)) AS stock
     FROM products p
     ${variantStockApplySql}
     ${baseWhere(capabilities).length ? `WHERE ${baseWhere(capabilities).join(' AND ')}` : ''}`
  );

  const rows = await query(
    `SELECT p.id,
            ${productColumn(capabilities, 'sku')} AS sku,
            ${productColumn(capabilities, 'batch_code')} AS batch_code,
            p.name,
            ${productColumn(capabilities, 'image', "''")} AS image,
            ${productColumn(capabilities, 'price', '0')} AS price,
            ${productColumn(capabilities, 'discount_price')} AS discount_price,
            ${stockSelectExpr} AS stock,
            ${productColumn(capabilities, 'status', '1')} AS status,
            ${productColumn(capabilities, 'id_category')} AS id_category,
            ${productColumn(capabilities, 'id_brand')} AS id_brand,
            ${productColumn(capabilities, 'volume_ml')} AS volume_ml,
            ${productColumn(capabilities, 'description')} AS description,
            ${productColumn(capabilities, 'scent_notes')} AS scent_notes,
            ${productColumn(capabilities, 'is_decant', '0')} AS is_decant,
            ${productColumn(capabilities, 'created_at')} AS created_at,
            ${productColumn(capabilities, 'updated_at')} AS updated_at,
            ${categoryNameSelect} AS category_name, ${brandNameSelect} AS brand_name,
            ROW_NUMBER() OVER (ORDER BY p.id DESC) AS row_number
     FROM products p
     ${categoryJoin}
     ${brandJoin}
     ${variantStockApplySql}
     ${whereSql}
     ORDER BY p.id DESC`,
    params
  );

  const filteredRows = rows.slice(offset, offset + safePageSize);

  return {
    content: filteredRows.map(buildProductRow),
    page: safePage,
    size: safePageSize,
    totalElements: Number(totalRows[0]?.total || 0),
    totalPages: Math.max(1, Math.ceil(Number(totalRows[0]?.total || 0) / safePageSize)),
    first: safePage === 1,
    last: safePage * safePageSize >= Number(totalRows[0]?.total || 0),
    summary: {
      total: Number(summaryRows[0]?.total || 0),
      active: Number(summaryRows[0]?.active || 0),
      inactive: Number(summaryRows[0]?.inactive || 0),
      outOfStock: Number(summaryRows[0]?.out_of_stock || 0),
      lowStock: Number(summaryRows[0]?.low_stock || 0),
      totalStock: Number(summaryRows[0]?.total_stock || 0),
      stockValue: Number(summaryRows[0]?.stock_value || 0),
      decantCount: Number(summaryRows[0]?.decant_count || 0),
      categoryBreakdown: categoryRows.map((row) => ({ category: row.categoryName, total: Number(row.total || 0), stock: Number(row.stock || 0) })),
    },
  };
}

export async function getAdminProductById(productId) {
  const capabilities = await getProductCapabilities();
  const stockExpr = stockColumn(capabilities);
  const variantStockExprSql = variantStockExpr(capabilities);
  const stockSelectExpr = `COALESCE(${variantStockExprSql}, ${stockExpr})`;
  const categoryJoin = hasTable(capabilities, 'categories') && hasColumn(capabilities, 'id_category')
    ? 'LEFT JOIN categories c ON c.id = p.id_category'
    : '';
  const brandJoin = hasTable(capabilities, 'brand') && hasColumn(capabilities, 'id_brand')
    ? 'LEFT JOIN brand b ON b.id = p.id_brand'
    : '';
  const categoryNameSelect = categoryJoin ? 'c.name' : 'NULL';
  const brandNameSelect = brandJoin ? 'b.name' : 'NULL';
  const rows = await query(
    `SELECT TOP 1 p.id,
            ${productColumn(capabilities, 'sku')} AS sku,
            ${productColumn(capabilities, 'batch_code')} AS batch_code,
            p.name,
            ${productColumn(capabilities, 'image', "''")} AS image,
            ${productColumn(capabilities, 'price', '0')} AS price,
            ${productColumn(capabilities, 'discount_price')} AS discount_price,
            ${stockSelectExpr} AS stock,
            ${productColumn(capabilities, 'status', '1')} AS status,
            ${productColumn(capabilities, 'id_category')} AS id_category,
            ${productColumn(capabilities, 'id_brand')} AS id_brand,
            ${productColumn(capabilities, 'volume_ml')} AS volume_ml,
            ${productColumn(capabilities, 'description')} AS description,
            ${productColumn(capabilities, 'scent_notes')} AS scent_notes,
            ${productColumn(capabilities, 'is_decant', '0')} AS is_decant,
            ${productColumn(capabilities, 'created_at')} AS created_at,
            ${productColumn(capabilities, 'updated_at')} AS updated_at,
            ${categoryNameSelect} AS category_name, ${brandNameSelect} AS brand_name
     FROM products p
     ${categoryJoin}
     ${brandJoin}
     WHERE p.id = ?${hasColumn(capabilities, 'deleted_at') ? ' AND p.deleted_at IS NULL' : ''}`,
    [Number(productId)]
  );
  return rows[0] ? buildProductRow(rows[0]) : null;
}

export async function createProduct(data) {
  const capabilities = await getProductCapabilities();
  const sku = data.sku || `PRF-${Date.now().toString(36).toUpperCase()}`;
  const duplicateSku = hasColumn(capabilities, 'sku') ? await getBySku(sku) : null;
  if (duplicateSku) {
    throw new Error('SKU đã tồn tại');
  }

  const columns = [];
  const values = [];
  const params = [];
  const addColumn = (column, value) => {
    if (!hasColumn(capabilities, column)) return;
    columns.push(column);
    values.push('?');
    params.push(value);
  };

  addColumn('sku', sku);
  addColumn('batch_code', data.batch_code || null);
  addColumn('name', data.name);
  addColumn('image', data.image || '');
  addColumn('price', data.price);
  addColumn('discount_price', data.discount_price ?? null);
  addColumn('stock', data.stock ?? 0);
  addColumn('quantity', data.stock ?? 0);
  addColumn('status', data.status !== false ? 1 : 0);
  addColumn('id_category', data.id_category || null);
  addColumn('id_brand', data.id_brand || null);
  addColumn('volume_ml', data.volume_ml ?? null);
  addColumn('description', data.description || null);
  addColumn('scent_notes', data.scent_notes || null);
  addColumn('is_decant', toBoolean(data.is_decant) ? 1 : 0);
  if (hasColumn(capabilities, 'created_at')) {
    columns.push('created_at');
    values.push('GETDATE()');
  }

  const insert = await query(
    `INSERT INTO products (${columns.join(', ')}) OUTPUT INSERTED.id VALUES (${values.join(', ')})`,
    params
  );

  const productId = insert[0]?.id;
  if (!productId) throw new Error('Không thể tạo sản phẩm');
  await invalidateProductCache(productId);
  return { id: productId, sku };
}

export async function updateProduct(productId, data) {
  const capabilities = await getProductCapabilities();
  const existing = await getAdminProductById(productId);
  if (!existing) return null;

  if (hasColumn(capabilities, 'sku') && data.sku !== undefined && data.sku !== null && data.sku.trim() !== '' && data.sku !== existing.sku) {
    const duplicateSku = await getBySku(data.sku.trim(), productId);
    if (duplicateSku) throw new Error('SKU đã tồn tại');
  }

  const setClauses = [];
  const params = [];
  const fieldMap = {
    name: 'name',
    sku: 'sku',
    batch_code: 'batch_code',
    image: 'image',
    price: 'price',
    discount_price: 'discount_price',
    status: 'status',
    id_category: 'id_category',
    id_brand: 'id_brand',
    volume_ml: 'volume_ml',
    description: 'description',
    scent_notes: 'scent_notes',
    is_decant: 'is_decant',
  };

  for (const [payloadKey, column] of Object.entries(fieldMap)) {
    if (data[payloadKey] === undefined) continue;
    if (!hasColumn(capabilities, column)) continue;
    setClauses.push(`${column} = ?`);
    if (payloadKey === 'status' || payloadKey === 'is_decant') params.push(data[payloadKey] ? 1 : 0);
    else params.push(data[payloadKey]);
  }
  if (data.stock !== undefined) {
    if (hasColumn(capabilities, 'stock')) {
      setClauses.push('stock = ?');
      params.push(data.stock);
    }
    if (hasColumn(capabilities, 'quantity')) {
      setClauses.push('quantity = ?');
      params.push(data.stock);
    }
  }

  if (setClauses.length) {
    if (hasColumn(capabilities, 'updated_at')) setClauses.push('updated_at = GETDATE()');
    await query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, [...params, productId]);
  }

  await invalidateProductCache(productId);
  return { id: productId, updated: true };
}

export async function softDeleteProduct(productId) {
  const capabilities = await getProductCapabilities();
  const existing = await query('SELECT TOP 1 id FROM products WHERE id = ?', [productId]);
  if (!existing.length) return null;

  const orderItemUsage = await query('SELECT TOP 1 id FROM order_items WHERE product_id = ?', [productId]);
  const updates = ['status = 0'];
  if (!orderItemUsage.length && hasColumn(capabilities, 'deleted_at')) updates.push('deleted_at = GETDATE()');
  if (hasColumn(capabilities, 'updated_at')) updates.push('updated_at = GETDATE()');
  await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, [productId]);
  await invalidateProductCache(productId);
  return { id: productId, deleted: true, softDeletedOnly: Boolean(orderItemUsage.length) };
}

export async function resetProductStock(productId, stock) {
  const capabilities = await getProductCapabilities();
  const existing = await query('SELECT TOP 1 id FROM products WHERE id = ?', [productId]);
  if (!existing.length) return null;

  const updates = [];
  const params = [];
  if (hasColumn(capabilities, 'stock')) {
    updates.push('stock = ?');
    params.push(stock);
  }
  if (hasColumn(capabilities, 'quantity')) {
    updates.push('quantity = ?');
    params.push(stock);
  }
  if (!updates.length) throw new Error('Schema products chua co cot ton kho');
  if (hasColumn(capabilities, 'updated_at')) updates.push('updated_at = GETDATE()');
  await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, [...params, productId]);
  await invalidateProductCache(productId);
  return { id: productId, stock };
}

export { validateForeignKeys as validateProductRelations };
