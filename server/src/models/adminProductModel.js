import { query } from '../config/database.js';
import { invalidateProductCache } from '../modules/products/product.service.js';

let productCapabilitiesPromise = null;

async function getProductCapabilities() {
  if (!productCapabilitiesPromise) {
    productCapabilitiesPromise = (async () => {
      const [columns, tables] = await Promise.all([
        query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'products'`
        ),
        query(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME IN ('product_images', 'product_variants')`
        ),
      ]);
      return {
        columns: new Set(columns.map((row) => String(row.COLUMN_NAME).toLowerCase())),
        tables: new Set(tables.map((row) => String(row.TABLE_NAME).toLowerCase())),
      };
    })();
  }
  return productCapabilitiesPromise;
}

function productColumn(capabilities, name, fallback = 'NULL') {
  return capabilities.columns.has(name.toLowerCase()) ? `p.${name}` : fallback;
}

function productBaseConditions(capabilities) {
  return capabilities.columns.has('deleted_at') ? ['p.deleted_at IS NULL'] : [];
}

export async function listAdminProducts({
  page = 1,
  pageSize = 20,
  includeInactive = true,
  search = null,
  status = null,
  stockState = null,
  categoryId = null,
  brandId = null,
} = {}) {
  const capabilities = await getProductCapabilities();
  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (safePage - 1) * safePageSize;
  const conditions = productBaseConditions(capabilities);
  const params = [];

  if (!includeInactive || status === 'active') conditions.push('p.status = 1');
  if (status === 'inactive') conditions.push('p.status = 0');
  if (search) {
    const searchColumns = ['p.name'];
    if (capabilities.columns.has('sku')) searchColumns.push('p.sku');
    if (capabilities.columns.has('batch_code')) searchColumns.push('p.batch_code');
    conditions.push(`(${searchColumns.map((column) => `${column} LIKE ?`).join(' OR ')})`);
    const pattern = `%${String(search).trim()}%`;
    params.push(...searchColumns.map(() => pattern));
  }
  if (stockState === 'out') conditions.push('ISNULL(p.stock, 0) = 0');
  if (stockState === 'low') conditions.push('ISNULL(p.stock, 0) BETWEEN 1 AND 5');
  if (stockState === 'available') conditions.push('ISNULL(p.stock, 0) > 5');
  if (Number(categoryId) > 0) {
    conditions.push('p.id_category = ?');
    params.push(Number(categoryId));
  }
  if (Number(brandId) > 0) {
    conditions.push('p.id_brand = ?');
    params.push(Number(brandId));
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const globalWhere = productBaseConditions(capabilities);
  const globalWhereSql = globalWhere.length ? `WHERE ${globalWhere.join(' AND ')}` : '';

  const totalRows = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const total = Number(totalRows[0]?.total || 0);
  const summaryRows = await query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN p.status = 1 THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN p.status = 0 THEN 1 ELSE 0 END) AS inactive,
            SUM(CASE WHEN ISNULL(p.stock, 0) = 0 THEN 1 ELSE 0 END) AS out_of_stock,
            SUM(CASE WHEN ISNULL(p.stock, 0) BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS low_stock,
            SUM(ISNULL(p.stock, 0)) AS total_stock,
            SUM(ISNULL(p.stock, 0) * ISNULL(p.price, 0)) AS stock_value,
            AVG(NULLIF(ISNULL(p.price, 0), 0)) AS average_price,
            SUM(CASE WHEN ISNULL(p.is_decant, 0) = 1 THEN 1 ELSE 0 END) AS decant_count
     FROM products p ${globalWhereSql}`
  );
  const summary = summaryRows[0] || {};
  const categoryRows = await query(
    `SELECT TOP 8 COALESCE(c.name, N'Chua phan loai') AS categoryName,
            COUNT(*) AS total,
            SUM(ISNULL(p.stock, 0)) AS stock
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     ${globalWhereSql}
     GROUP BY COALESCE(c.name, N'Chua phan loai')
     ORDER BY total DESC`
  );
  const imageColumns = capabilities.tables.has('product_images')
    ? `(SELECT STRING_AGG(pi.image_url, ',') FROM product_images pi WHERE pi.product_id = p.id AND pi.deleted_at IS NULL) AS images_csv,
       (SELECT TOP 1 pi2.image_url FROM product_images pi2 WHERE pi2.product_id = p.id AND pi2.deleted_at IS NULL ORDER BY pi2.is_thumbnail DESC, pi2.sort_order ASC) AS thumbnail`
    : 'NULL AS images_csv, p.image AS thumbnail';

  const rows = await query(
    `WITH catalog AS (
       SELECT p.id, p.sku, p.batch_code, p.name, p.price, p.discount_price,
              p.quantity, p.stock, p.status, p.id_category, p.id_brand,
              p.volume_ml, p.description, p.scent_notes,
              ${productColumn(capabilities, 'gender')} AS gender,
              ${productColumn(capabilities, 'concentration')} AS concentration,
              p.is_decant,
              ${productColumn(capabilities, 'slug')} AS slug,
              ${productColumn(capabilities, 'scent_group')} AS scent_group,
              p.created_at,
              ${productColumn(capabilities, 'rating_average', '0')} AS rating_average,
              ${productColumn(capabilities, 'review_count', '0')} AS review_count,
              c.name AS category_name, b.name AS brand_name,
              ${imageColumns},
              ROW_NUMBER() OVER (ORDER BY p.id DESC) AS row_number
       FROM products p
       LEFT JOIN categories c ON c.id = p.id_category
       LEFT JOIN brand b ON b.id = p.id_brand
       ${whereSql}
     )
     SELECT * FROM catalog
     WHERE row_number BETWEEN ? AND ?
     ORDER BY row_number`,
    [...params, offset + 1, offset + safePageSize]
  );

  const products = rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    batchCode: row.batch_code,
    name: row.name,
    price: Number(row.price || 0),
    discountPrice: Number(row.discount_price || 0),
    quantity: Number(row.quantity || 0),
    stock: Number(row.stock || 0),
    status: Boolean(row.status),
    idCategory: row.id_category,
    idBrand: row.id_brand,
    volumeMl: row.volume_ml,
    description: row.description,
    scentNotes: row.scent_notes,
    gender: row.gender,
    concentration: row.concentration,
    isDecant: Boolean(row.is_decant),
    slug: row.slug,
    scentGroup: row.scent_group,
    ratingAverage: Number(row.rating_average || 0),
    reviewCount: Number(row.review_count || 0),
    categoryName: row.category_name,
    brandName: row.brand_name,
    image: row.thumbnail,
    images: row.images_csv ? row.images_csv.split(',') : [],
    createdAt: row.created_at,
    category: row.category_name ? { id: row.id_category, name: row.category_name } : null,
    brand: row.brand_name ? { id: row.id_brand, name: row.brand_name } : null,
  }));

  return {
    content: products,
    page: safePage,
    size: safePageSize,
    totalElements: total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    first: safePage === 1,
    last: safePage * safePageSize >= total,
    summary: {
      total: Number(summary.total || 0),
      active: Number(summary.active || 0),
      inactive: Number(summary.inactive || 0),
      outOfStock: Number(summary.out_of_stock || 0),
      lowStock: Number(summary.low_stock || 0),
      totalStock: Number(summary.total_stock || 0),
      stockValue: Number(summary.stock_value || 0),
      averagePrice: Math.round(Number(summary.average_price || 0)),
      decantCount: Number(summary.decant_count || 0),
      categoryBreakdown: categoryRows.map((row) => ({
        category: row.categoryName,
        total: Number(row.total || 0),
        stock: Number(row.stock || 0),
      })),
    },
  };
}

export async function getAdminProductById(productId) {
  const capabilities = await getProductCapabilities();
  const conditions = ['p.id = ?'];
  if (capabilities.columns.has('deleted_at')) conditions.push('p.deleted_at IS NULL');
  const rows = await query(
    `SELECT TOP 1 p.id, p.sku, p.batch_code, p.name, p.image, p.price, p.discount_price,
            p.quantity, p.stock, p.status, p.id_category, p.id_brand, p.volume_ml,
            p.description, p.scent_notes, p.is_decant, p.created_at,
            ${productColumn(capabilities, 'updated_at')} AS updated_at,
            c.name AS category_name, b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     LEFT JOIN brand b ON b.id = p.id_brand
     WHERE ${conditions.join(' AND ')}`,
    [Number(productId)]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    sku: row.sku || '',
    batchCode: row.batch_code || '',
    image: row.image || '',
    price: Number(row.price || 0),
    discountPrice: row.discount_price === null ? null : Number(row.discount_price),
    stock: Number(row.stock || 0),
    status: Boolean(row.status),
    categoryId: row.id_category,
    brandId: row.id_brand,
    idCategory: row.id_category,
    idBrand: row.id_brand,
    categoryName: row.category_name || '',
    brandName: row.brand_name || '',
    volumeMl: row.volume_ml,
    description: row.description || '',
    scentNotes: row.scent_notes || '',
    isDecant: Boolean(row.is_decant),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category_name ? { id: row.id_category, name: row.category_name } : null,
    brand: row.brand_name ? { id: row.id_brand, name: row.brand_name } : null,
  };
}

export async function validateProductRelations(data) {
  const errors = {};
  if (data.id_category !== undefined && data.id_category !== null) {
    const category = await query('SELECT TOP 1 id FROM categories WHERE id = ?', [data.id_category]);
    if (!category.length) errors.id_category = ['Danh mục không tồn tại'];
  }
  if (data.id_brand !== undefined && data.id_brand !== null) {
    const brand = await query('SELECT TOP 1 id FROM brand WHERE id = ?', [data.id_brand]);
    if (!brand.length) errors.id_brand = ['Thương hiệu không tồn tại'];
  }
  return Object.keys(errors).length ? errors : null;
}

export async function createProduct(data) {
  const capabilities = await getProductCapabilities();
  const sku = data.sku || `PRF-${Date.now().toString(36).toUpperCase()}`;
  const image = data.image || data.images?.find((item) => item.is_thumbnail)?.image_url || data.images?.[0]?.image_url || '';
  const columns = ['sku', 'batch_code', 'name', 'image', 'price', 'discount_price', 'quantity', 'stock', 'status', 'id_category', 'volume_ml', 'description', 'scent_notes', 'is_decant', 'created_at'];
  const values = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', 'GETDATE()'];
  const params = [
    sku,
    data.batch_code || null,
    data.name,
    image,
    data.price,
    data.discount_price ?? null,
    data.stock || 0,
    data.stock || 0,
    data.status !== false ? 1 : 0,
    data.id_category,
    data.volume_ml || null,
    data.description || null,
    data.scent_notes || null,
    data.is_decant ? 1 : 0,
  ];

  if (data.id_brand !== undefined) {
    columns.splice(columns.length - 1, 0, 'id_brand');
    values.splice(values.length - 1, 0, '?');
    params.push(data.id_brand);
  }

  const optionalFields = [
    ['gender', data.gender || null],
    ['concentration', data.concentration || null],
    ['slug', data.slug || null],
    ['scent_group', data.scent_group || null],
  ];
  for (const [column, value] of optionalFields) {
    if (capabilities.columns.has(column)) {
      columns.splice(columns.length - 1, 0, column);
      values.splice(values.length - 1, 0, '?');
      params.push(value);
    }
  }

  const result = await query(
    `INSERT INTO products (${columns.join(', ')})
     OUTPUT INSERTED.id
     VALUES (${values.join(', ')})`,
    params
  );

  const productId = result[0]?.id;
  if (!productId) throw new Error('Không thể tạo sản phẩm');

  // Insert variants
  if (capabilities.tables.has('product_variants') && Array.isArray(data.variants) && data.variants.length > 0) {
    for (const v of data.variants) {
      await query(
        `INSERT INTO product_variants (product_id, sku, barcode, volume_ml, volume_label,
           variant_type, price, sale_price, stock_quantity, image, sort_order, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())`,
        [
          productId,
          v.sku || null,
          v.barcode || null,
          v.volume_ml || null,
          v.volume_label || null,
          v.variant_type || null,
          v.price,
          v.sale_price || null,
          v.stock_quantity || 0,
          v.image || null,
          v.sort_order || 0,
          1,
        ]
      );
    }
  }

  // Insert images
  if (capabilities.tables.has('product_images') && Array.isArray(data.images) && data.images.length > 0) {
    for (const img of data.images) {
      await query(
        `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_thumbnail, created_at)
         VALUES (?, ?, ?, ?, ?, GETDATE())`,
        [
          productId,
          img.image_url,
          img.alt_text || null,
          img.sort_order || 0,
          img.is_thumbnail ? 1 : 0,
        ]
      );
    }
    // Update main product image to first image or thumbnail
    const thumbnail = data.images.find((i) => i.is_thumbnail) || data.images[0];
    await query('UPDATE products SET image = ? WHERE id = ?', [thumbnail.image_url, productId]);
  }

  await invalidateProductCache(productId);
  return { id: productId, sku };
}

export async function updateProduct(productId, data) {
  const capabilities = await getProductCapabilities();
  const existing = await query('SELECT TOP 1 id FROM products WHERE id = ?', [productId]);
  if (!existing.length) return null;

  const setClauses = [];
  const params = [];

  const fields = {
    name: 'name',
    sku: 'sku',
    batch_code: 'batch_code',
    image: 'image',
    price: 'price',
    discount_price: 'discount_price',
    stock: 'stock',
    quantity: 'quantity', // sync quantity with stock
    status: 'status',
    id_category: 'id_category',
    id_brand: 'id_brand',
    volume_ml: 'volume_ml',
    description: 'description',
    scent_notes: 'scent_notes',
    gender: 'gender',
    concentration: 'concentration',
    is_decant: 'is_decant',
    slug: 'slug',
    scent_group: 'scent_group',
  };

  for (const [key, col] of Object.entries(fields)) {
    if (data[key] !== undefined && capabilities.columns.has(col)) {
      setClauses.push(`${col} = ?`);
      if (key === 'is_decant') {
        params.push(data[key] ? 1 : 0);
      } else if (key === 'status') {
        params.push(data[key] ? 1 : 0);
      } else if (key === 'stock') {
        params.push(data[key]);
        // Also add quantity sync
        if (!setClauses.includes('quantity = ?')) {
          setClauses.push('quantity = ?');
          params.push(data[key]);
        }
      } else {
        params.push(data[key]);
      }
    }
  }

  if (setClauses.length === 0) return { id: productId, updated: false };

  if (capabilities.columns.has('updated_at')) setClauses.push('updated_at = GETDATE()');
  params.push(productId);

  await query(
    `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  // Sync variants if provided
  if (capabilities.tables.has('product_variants') && Array.isArray(data.variants)) {
    // Delete variants not in the new list
    const keepIds = data.variants.filter((v) => v.id).map((v) => v.id);
    if (keepIds.length > 0) {
      await query(
        `DELETE FROM product_variants WHERE product_id = ? AND id NOT IN (${keepIds.map(() => '?').join(',')})`,
        [productId, ...keepIds]
      );
    } else {
      await query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    }

    for (const v of data.variants) {
      if (v.id) {
        await query(
          `UPDATE product_variants SET volume_ml = ?, volume_label = ?, variant_type = ?,
             price = ?, sale_price = ?, stock_quantity = ?, image = ?, barcode = ?, sku = ?,
             sort_order = ?, updated_at = GETDATE()
           WHERE id = ? AND product_id = ?`,
          [
            v.volume_ml || null,
            v.volume_label || null,
            v.variant_type || null,
            v.price,
            v.sale_price || null,
            v.stock_quantity ?? 0,
            v.image || null,
            v.barcode || null,
            v.sku || null,
            v.sort_order || 0,
            v.id,
            productId,
          ]
        );
      } else {
        await query(
          `INSERT INTO product_variants (product_id, sku, barcode, volume_ml, volume_label,
             variant_type, price, sale_price, stock_quantity, image, sort_order, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())`,
          [
            productId,
            v.sku || null,
            v.barcode || null,
            v.volume_ml || null,
            v.volume_label || null,
            v.variant_type || null,
            v.price,
            v.sale_price || null,
            v.stock_quantity || 0,
            v.image || null,
            v.sort_order || 0,
            1,
          ]
        );
      }
    }
  }

  // Sync images if provided
  if (capabilities.tables.has('product_images') && Array.isArray(data.images)) {
    const keepImageIds = data.images.filter((i) => i.id).map((i) => i.id);
    if (keepImageIds.length > 0) {
      await query(
        `DELETE FROM product_images WHERE product_id = ? AND id NOT IN (${keepImageIds.map(() => '?').join(',')})`,
        [productId, ...keepImageIds]
      );
    } else {
      await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    }

    for (const img of data.images) {
      if (img.id) {
        await query(
          `UPDATE product_images SET image_url = ?, alt_text = ?, sort_order = ?, is_thumbnail = ?, updated_at = GETDATE()
           WHERE id = ? AND product_id = ?`,
          [img.image_url, img.alt_text || null, img.sort_order || 0, img.is_thumbnail ? 1 : 0, img.id, productId]
        );
      } else {
        await query(
          `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_thumbnail, created_at)
           VALUES (?, ?, ?, ?, ?, GETDATE())`,
          [productId, img.image_url, img.alt_text || null, img.sort_order || 0, img.is_thumbnail ? 1 : 0]
        );
      }
    }

    // Update main product image
    const thumbnail = data.images.find((i) => i.is_thumbnail) || data.images[0];
    if (thumbnail) {
      await query('UPDATE products SET image = ? WHERE id = ?', [thumbnail.image_url, productId]);
    }
  }

  await invalidateProductCache(productId);
  return { id: productId, updated: true };
}

export async function softDeleteProduct(productId) {
  const capabilities = await getProductCapabilities();
  const existing = await query('SELECT TOP 1 id FROM products WHERE id = ?', [productId]);
  if (!existing.length) return null;

  const updates = ['status = 0'];
  if (capabilities.columns.has('deleted_at')) updates.push('deleted_at = GETDATE()');
  if (capabilities.columns.has('updated_at')) updates.push('updated_at = GETDATE()');
  await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, [productId]);
  await invalidateProductCache(productId);
  return { id: productId, deleted: true };
}

export async function resetProductStock(productId, stock) {
  const capabilities = await getProductCapabilities();
  const existing = await query('SELECT TOP 1 id FROM products WHERE id = ?', [productId]);
  if (!existing.length) return null;

  const updatedAt = capabilities.columns.has('updated_at') ? ', updated_at = GETDATE()' : '';
  await query(`UPDATE products SET stock = ?, quantity = ?${updatedAt} WHERE id = ?`, [stock, stock, productId]);
  await invalidateProductCache(productId);
  return { id: productId, stock };
}
