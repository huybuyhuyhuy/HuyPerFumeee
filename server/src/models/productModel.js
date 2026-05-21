import { query } from '../config/database.js';

function toProduct(row) {
  return {
    id: row.id,
    sku: row.sku || '',
    batchCode: row.batch_code || '',
    name: row.name,
    price: Number(row.price || 0),
    discountPrice: Number(row.discount_price || 0),
    image: row.image || '',
    description: row.description || '',
    scentNotes: row.scent_notes || '',
    isDecant: !!row.is_decant,
    status: !!row.status,
    stock: Number(row.stock || 0),
    volumeMl: Number(row.volume_ml || 0),
    category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    brand: row.brand_id ? { id: row.brand_id, name: row.brand_name } : null,
  };
}

export function mapProductRow(row) {
  return toProduct(row);
}

function buildFilters(filters = {}) {
  const conditions = ['p.status = 1'];
  const params = [];

  if (filters.categoryId) {
    conditions.push('p.id_category = ?');
    params.push(Number(filters.categoryId));
  }

  if (filters.brandId) {
    conditions.push('p.id_brand = ?');
    params.push(Number(filters.brandId));
  }

  if (filters.search) {
    conditions.push('LOWER(p.name) LIKE LOWER(?)');
    params.push(`%${String(filters.search).trim()}%`);
  }

  const effectivePrice = 'CASE WHEN p.discount_price > 0 THEN p.discount_price ELSE p.price END';
  if (filters.priceRange) {
    switch (String(filters.priceRange)) {
      case 'under500':
        conditions.push(`${effectivePrice} < 500000`);
        break;
      case '500to1000':
        conditions.push(`${effectivePrice} BETWEEN 500000 AND 1000000`);
        break;
      case '1000to2000':
        conditions.push(`${effectivePrice} BETWEEN 1000000 AND 2000000`);
        break;
      case 'above2000':
        conditions.push(`${effectivePrice} > 2000000`);
        break;
      default:
        break;
    }
  }

  return { whereSql: `WHERE ${conditions.join(' AND ')}`, params };
}

function buildSort(sort) {
  const effectivePrice = 'CASE WHEN p.discount_price > 0 THEN p.discount_price ELSE p.price END';
  switch (sort) {
    case 'price_asc':
      return `${effectivePrice} ASC, p.id DESC`;
    case 'price_desc':
      return `${effectivePrice} DESC, p.id DESC`;
    default:
      return 'p.id DESC';
  }
}

export async function getProductsPaged({ page = 1, size = 12, sort = 'newest', filters = {} }) {
  const safePage = Math.max(1, Number(page));
  const safeSize = Math.max(1, Math.min(100, Number(size)));
  const offset = (safePage - 1) * safeSize;
  const { whereSql, params } = buildFilters(filters);

  const countRows = await query(
    `SELECT COUNT(*) AS total
     FROM products p
     ${whereSql}`,
    params
  );
  const totalElements = Number(countRows[0]?.total || 0);

  const rows = await query(
    `SELECT
       p.*,
       c.id AS category_id,
       c.name AS category_name,
       b.id AS brand_id,
       b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     LEFT JOIN brand b ON b.id = p.id_brand
     ${whereSql}
     ORDER BY ${buildSort(sort)}
     OFFSET ${offset} ROWS FETCH NEXT ${safeSize} ROWS ONLY`,
    params
  );

  const content = rows.map(toProduct);
  const totalPages = Math.max(1, Math.ceil(totalElements / safeSize));

  return {
    content,
    page: safePage,
    size: safeSize,
    totalElements,
    totalPages,
    first: safePage === 1,
    last: safePage >= totalPages,
  };
}

export async function getProductById(id) {
  const rows = await query(
    `SELECT TOP 1
       p.*,
       c.id AS category_id,
       c.name AS category_name,
       b.id AS brand_id,
       b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     LEFT JOIN brand b ON b.id = p.id_brand
     WHERE p.id = ? AND p.status = 1`,
    [id]
  );
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function searchProducts(keyword) {
  const rows = await query(
    `SELECT
       p.*,
       c.id AS category_id,
       c.name AS category_name,
       b.id AS brand_id,
       b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     LEFT JOIN brand b ON b.id = p.id_brand
     WHERE p.status = 1 AND LOWER(p.name) LIKE LOWER(?)
     ORDER BY p.id DESC`,
    [`%${String(keyword || '').trim()}%`]
  );
  return rows.map(toProduct);
}

export async function getRandomProducts(limit = 4) {
  const rows = await query(
    `SELECT TOP (${Math.max(1, Math.min(12, Number(limit) || 4))})
       p.*,
       c.id AS category_id,
       c.name AS category_name,
       b.id AS brand_id,
       b.name AS brand_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.id_category
     LEFT JOIN brand b ON b.id = p.id_brand
     WHERE p.status = 1
     ORDER BY NEWID()`
  );
  return rows.map(toProduct);
}
