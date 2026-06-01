import { query } from '../../config/database.js';
import { normalizeProductFilters, parsePagination } from './product.validation.js';

let capabilitiesPromise = null;

function columnSet(rows) {
  return new Set(rows.map((row) => String(row.COLUMN_NAME || row.column_name || '').toLowerCase()));
}

function hasColumn(columns, name) {
  return columns.has(String(name).toLowerCase());
}

function optionalSelect(columns, columnName, expression, alias, fallback = 'NULL') {
  return `${hasColumn(columns, columnName) ? expression : fallback} AS ${alias}`;
}

export async function getProductStorageCapabilities() {
  if (!capabilitiesPromise) {
    capabilitiesPromise = (async () => {
      const [tables, productColumns, variantColumns, imageColumns, orderItemColumns, brandColumns, categoryColumns] = await Promise.all([
        query(`
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = 'dbo'
            AND TABLE_NAME IN ('product_variants', 'product_images', 'product_inventory', 'brand', 'categories', 'product_reviews', 'product_recent_views', 'wishlist')
        `),
        query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'products'
        `),
        query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'product_variants'
        `),
        query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'product_images'
        `),
        query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'order_items'
        `),
        query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'brand'
        `),
        query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'categories'
        `),
      ]);

      const tableNames = new Set(tables.map((row) => String(row.TABLE_NAME || row.table_name || '').toLowerCase()));
      return {
        hasVariants: tableNames.has('product_variants'),
        hasProductImages: tableNames.has('product_images'),
        hasProductInventory: tableNames.has('product_inventory'),
        hasBrand: tableNames.has('brand'),
        hasCategories: tableNames.has('categories'),
        hasProductReviews: tableNames.has('product_reviews'),
        hasRecentViews: tableNames.has('product_recent_views'),
        hasWishlist: tableNames.has('wishlist'),
        productColumns: columnSet(productColumns),
        variantColumns: columnSet(variantColumns),
        imageColumns: columnSet(imageColumns),
        orderItemColumns: columnSet(orderItemColumns),
        brandColumns: columnSet(brandColumns),
        categoryColumns: columnSet(categoryColumns),
      };
    })();
  }

  return capabilitiesPromise;
}

export function resetProductStorageCapabilitiesForTests() {
  capabilitiesPromise = null;
}

function buildEffectivePriceSql() {
  return `(
    CASE
      WHEN ISNULL(p.price, 0) > 0 AND ISNULL(p.discount_price, 0) > 0 AND p.discount_price < p.price THEN p.discount_price
      WHEN ISNULL(p.price, 0) > 0 THEN p.price
      ELSE NULL
    END
  )`;
}

function normalizeLookupValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isTruthyFilter(value) {
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value || '').trim().toLowerCase());
}

function activeVariantClause(capabilities, alias = 'pv') {
  const clauses = [`${alias}.product_id = p.id`];
  if (hasColumn(capabilities.variantColumns, 'deleted_at')) clauses.push(`${alias}.deleted_at IS NULL`);
  if (hasColumn(capabilities.variantColumns, 'status')) clauses.push(`ISNULL(${alias}.status, 1) = 1`);
  return clauses.join(' AND ');
}

function variantEffectivePriceSql(alias = 'pv') {
  return `(
    CASE
      WHEN ISNULL(${alias}.price, 0) > 0 AND ISNULL(${alias}.sale_price, 0) > 0 AND ${alias}.sale_price < ${alias}.price THEN ${alias}.sale_price
      WHEN ISNULL(${alias}.price, 0) > 0 THEN ${alias}.price
      ELSE NULL
    END
  )`;
}

function variantSaleCondition(alias = 'pv') {
  return `ISNULL(${alias}.price, 0) > 0 AND ISNULL(${alias}.sale_price, 0) > 0 AND ${alias}.sale_price < ${alias}.price`;
}

function hasActiveVariantCondition(capabilities) {
  return `EXISTS (SELECT 1 FROM product_variants pv_has WHERE ${activeVariantClause(capabilities, 'pv_has')})`;
}

function addTextLookupFilter({ conditions, params, tableName, ownerColumn, value, columns, fallbackColumn = 'name' }) {
  const lookup = normalizeLookupValue(value);
  if (!lookup) return;

  const raw = String(value || '').trim();
  const tableAlias = `${tableName}_filter`;
  const searchColumns = [
    `LOWER(${tableAlias}.${fallbackColumn}) = LOWER(?)`,
    `LOWER(${tableAlias}.${fallbackColumn}) LIKE LOWER(?)`,
    `LOWER(REPLACE(REPLACE(REPLACE(${tableAlias}.${fallbackColumn}, ' ', '-'), '&', 'and'), '''', '')) = ?`,
  ];
  params.push(raw, `%${raw}%`, lookup);

  if (hasColumn(columns, 'slug')) {
    searchColumns.push(`LOWER(${tableAlias}.slug) = ?`);
    params.push(lookup);
  }

  conditions.push(
    `p.${ownerColumn} IN (
      SELECT ${tableAlias}.id
      FROM ${tableName} ${tableAlias}
      WHERE ${searchColumns.join(' OR ')}
    )`
  );
}

function scentKeywordsForGroup(value) {
  const group = normalizeLookupValue(value);
  const groups = {
    fresh: ['fresh', 'citrus', 'aquatic', 'green', 'bergamot', 'lemon', 'orange', 'mint', 'marine', 'cam', 'chanh', 'bien'],
    citrus: ['citrus', 'bergamot', 'lemon', 'orange', 'grapefruit', 'lime', 'cam', 'chanh', 'buoi'],
    floral: ['floral', 'rose', 'jasmine', 'iris', 'tuberose', 'violet', 'hoa', 'hong', 'nhai'],
    woody: ['woody', 'wood', 'cedar', 'sandalwood', 'vetiver', 'oud', 'go', 'dan huong', 'tuyet tung'],
    amber: ['amber', 'oriental', 'vanilla', 'tonka', 'spice', 'warm', 'ho phach', 'vani', 'gia vi'],
    spicy: ['spicy', 'pepper', 'cinnamon', 'cardamom', 'saffron', 'gia vi', 'tieu', 'que'],
    sweet: ['sweet', 'gourmand', 'vanilla', 'caramel', 'chocolate', 'tonka', 'ngot', 'vani'],
    musk: ['musk', 'powdery', 'clean', 'xa huong', 'phan'],
    leather: ['leather', 'tobacco', 'smoky', 'da thuoc', 'thuoc la', 'khoi'],
  };
  return groups[group] || [String(value || '').trim()];
}

function addScentCondition(conditions, params, value, capabilities) {
  if (!value) return;

  const scentColumns = [];
  if (hasColumn(capabilities.productColumns, 'scent_group')) scentColumns.push("LOWER(ISNULL(p.scent_group, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'scent_family')) scentColumns.push("LOWER(ISNULL(p.scent_family, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'scent_notes')) scentColumns.push("LOWER(ISNULL(p.scent_notes, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'description')) scentColumns.push("LOWER(ISNULL(p.description, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'top_notes')) scentColumns.push("LOWER(ISNULL(p.top_notes, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'middle_notes')) scentColumns.push("LOWER(ISNULL(p.middle_notes, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'base_notes')) scentColumns.push("LOWER(ISNULL(p.base_notes, '')) LIKE LOWER(?)");
  if (!scentColumns.length) return;

  const keywords = Array.isArray(value) ? value : [value];
  const keywordConditions = [];
  for (const keyword of keywords) {
    const pattern = `%${keyword}%`;
    keywordConditions.push(`(${scentColumns.join(' OR ')})`);
    params.push(...scentColumns.map(() => pattern));
  }

  conditions.push(`(${keywordConditions.join(' OR ')})`);
}

function buildFilters(filters = {}, capabilities) {
  const safeFilters = normalizeProductFilters(filters);
  const conditions = ['p.status = 1'];
  const params = [];
  const effectivePrice = buildEffectivePriceSql();
  const hasVariants = capabilities.hasVariants;
  const hasActiveVariants = hasVariants ? hasActiveVariantCondition(capabilities) : '1 = 0';

  if (hasColumn(capabilities.productColumns, 'deleted_at')) {
    conditions.push('p.deleted_at IS NULL');
  }

  const categoryId = safeFilters.categoryId;
  if (categoryId && Number.isFinite(Number(categoryId))) {
    conditions.push('p.id_category = ?');
    params.push(Number(categoryId));
  }
  if (safeFilters.category && capabilities.hasCategories) {
    addTextLookupFilter({
      conditions,
      params,
      tableName: 'categories',
      ownerColumn: 'id_category',
      value: safeFilters.category,
      columns: capabilities.categoryColumns,
    });
  }

  const brandId = safeFilters.brandId;
  if (brandId && Number.isFinite(Number(brandId))) {
    conditions.push('p.id_brand = ?');
    params.push(Number(brandId));
  }
  if (safeFilters.brand && capabilities.hasBrand) {
    addTextLookupFilter({
      conditions,
      params,
      tableName: 'brand',
      ownerColumn: 'id_brand',
      value: safeFilters.brand,
      columns: capabilities.brandColumns,
    });
  }

  const search = safeFilters.search;
  if (search) {
    const searchColumns = [
      'LOWER(p.name) LIKE LOWER(?)',
      "LOWER(ISNULL(p.description, '')) LIKE LOWER(?)",
      "LOWER(ISNULL(p.sku, '')) LIKE LOWER(?)",
      "LOWER(ISNULL(p.batch_code, '')) LIKE LOWER(?)",
    ];
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);

    if (hasColumn(capabilities.productColumns, 'slug')) {
      searchColumns.push('LOWER(ISNULL(p.slug, \'\')) LIKE LOWER(?)');
      params.push(`%${search}%`);
    }
    if (hasColumn(capabilities.productColumns, 'scent_notes')) {
      searchColumns.push('LOWER(ISNULL(p.scent_notes, \'\')) LIKE LOWER(?)');
      params.push(`%${search}%`);
    }
    if (hasColumn(capabilities.productColumns, 'concentration')) {
      searchColumns.push('LOWER(ISNULL(p.concentration, \'\')) LIKE LOWER(?)');
      params.push(`%${search}%`);
    }
    if (capabilities.hasBrand) {
      searchColumns.push('p.id_brand IN (SELECT id FROM brand WHERE LOWER(ISNULL(name, \'\')) LIKE LOWER(?))');
      params.push(`%${search}%`);
    }
    if (capabilities.hasCategories) {
      searchColumns.push('p.id_category IN (SELECT id FROM categories WHERE LOWER(ISNULL(name, \'\')) LIKE LOWER(?))');
      params.push(`%${search}%`);
    }
    if (hasVariants) {
      searchColumns.push(`EXISTS (
        SELECT 1
        FROM product_variants pv_search
        WHERE ${activeVariantClause(capabilities, 'pv_search')}
          AND (
            LOWER(ISNULL(pv_search.sku, '')) LIKE LOWER(?)
            OR LOWER(ISNULL(pv_search.barcode, '')) LIKE LOWER(?)
            OR LOWER(ISNULL(pv_search.volume_label, '')) LIKE LOWER(?)
            OR LOWER(ISNULL(pv_search.variant_type, '')) LIKE LOWER(?)
          )
      )`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    conditions.push(`(${searchColumns.join(' OR ')})`);
  }

  const saleRequested = safeFilters.badge === 'sale' || isTruthyFilter(safeFilters.sale);
  if (saleRequested) {
    if (hasVariants) {
      conditions.push(`(
        (${hasActiveVariants} AND EXISTS (
          SELECT 1 FROM product_variants pv_sale
          WHERE ${activeVariantClause(capabilities, 'pv_sale')}
            AND ${variantSaleCondition('pv_sale')}
        ))
        OR (NOT (${hasActiveVariants}) AND ISNULL(p.discount_price, 0) > 0 AND p.discount_price < p.price)
      )`);
    } else {
      conditions.push('ISNULL(p.discount_price, 0) > 0 AND p.discount_price < p.price');
    }
  }

  if (isTruthyFilter(safeFilters.bestSeller)) {
    conditions.push('EXISTS (SELECT 1 FROM order_items oi_best WHERE oi_best.product_id = p.id AND ISNULL(oi_best.quantity, 0) > 0)');
  }

  const rangeMap = {
    under500: { max: 500000 },
    '500to1000': { min: 500000, max: 1000000 },
    '1000to2000': { min: 1000000, max: 2000000 },
    above2000: { min: 2000000 },
  };
  const mappedRange = safeFilters.priceRange ? rangeMap[safeFilters.priceRange] : null;

  const minPrice = safeFilters.minPrice !== null ? Number(safeFilters.minPrice) : mappedRange?.min;
  const maxPrice = safeFilters.maxPrice !== null ? Number(safeFilters.maxPrice) : mappedRange?.max;
  const hasMinPrice = Number.isFinite(minPrice);
  const hasMaxPrice = Number.isFinite(maxPrice);

  if (hasMinPrice && hasMaxPrice) {
    if (hasVariants) {
      conditions.push(`(
        (${hasActiveVariants} AND EXISTS (
          SELECT 1 FROM product_variants pv_price
          WHERE ${activeVariantClause(capabilities, 'pv_price')}
            AND ${variantEffectivePriceSql('pv_price')} >= ?
            AND ${variantEffectivePriceSql('pv_price')} <= ?
        ))
        OR (NOT (${hasActiveVariants}) AND ${effectivePrice} >= ? AND ${effectivePrice} <= ?)
      )`);
      params.push(Number(minPrice), Number(maxPrice), Number(minPrice), Number(maxPrice));
    } else {
      conditions.push(`${effectivePrice} >= ? AND ${effectivePrice} <= ?`);
      params.push(Number(minPrice), Number(maxPrice));
    }
  } else if (hasMinPrice) {
    if (hasVariants) {
      conditions.push(`(
        (${hasActiveVariants} AND EXISTS (
          SELECT 1 FROM product_variants pv_price
          WHERE ${activeVariantClause(capabilities, 'pv_price')}
            AND ${variantEffectivePriceSql('pv_price')} >= ?
        ))
        OR (NOT (${hasActiveVariants}) AND ${effectivePrice} >= ?)
      )`);
      params.push(Number(minPrice), Number(minPrice));
    } else {
      conditions.push(`${effectivePrice} >= ?`);
      params.push(Number(minPrice));
    }
  } else if (hasMaxPrice) {
    if (hasVariants) {
      conditions.push(`(
        (${hasActiveVariants} AND EXISTS (
          SELECT 1 FROM product_variants pv_price
          WHERE ${activeVariantClause(capabilities, 'pv_price')}
            AND ${variantEffectivePriceSql('pv_price')} <= ?
        ))
        OR (NOT (${hasActiveVariants}) AND ${effectivePrice} <= ?)
      )`);
      params.push(Number(maxPrice), Number(maxPrice));
    } else {
      conditions.push(`${effectivePrice} <= ?`);
      params.push(Number(maxPrice));
    }
  }

  const volumeValue = safeFilters.volumeMl || safeFilters.volume;
  if (volumeValue) {
    const volumeMl = Number(String(volumeValue).replace(/\D/g, ''));
    const volumeLabel = String(volumeValue).trim();
    const volumeClauses = [];

    if (hasVariants) {
      if (Number.isFinite(volumeMl) && volumeMl > 0) {
        volumeClauses.push(`EXISTS (
          SELECT 1 FROM product_variants pv_volume
          WHERE ${activeVariantClause(capabilities, 'pv_volume')}
            AND (pv_volume.volume_ml = ? OR LOWER(ISNULL(pv_volume.volume_label, '')) = LOWER(?))
        )`);
        params.push(volumeMl, `${volumeMl}ml`);
      } else {
        volumeClauses.push(`EXISTS (
          SELECT 1 FROM product_variants pv_volume
          WHERE ${activeVariantClause(capabilities, 'pv_volume')}
            AND LOWER(ISNULL(pv_volume.volume_label, '')) = LOWER(?)
        )`);
        params.push(volumeLabel);
      }
    }

    if (hasColumn(capabilities.productColumns, 'volume_ml') && Number.isFinite(volumeMl) && volumeMl > 0) {
      volumeClauses.push(`(NOT (${hasActiveVariants}) AND p.volume_ml = ?)`);
      params.push(volumeMl);
    }

    if (volumeClauses.length) {
      conditions.push(`(${volumeClauses.join(' OR ')})`);
    }
  }

  if (safeFilters.variantType && hasVariants && hasColumn(capabilities.variantColumns, 'variant_type')) {
    const normalizedType = normalizeLookupValue(safeFilters.variantType);
    const types = normalizedType === 'decant'
      ? ['DECANT']
      : normalizedType === 'fullbox' || normalizedType === 'full'
        ? ['FULL', 'FULLBOX', 'STANDARD']
        : [String(safeFilters.variantType).trim().toUpperCase()];
    conditions.push(`EXISTS (
      SELECT 1 FROM product_variants pv_type
      WHERE ${activeVariantClause(capabilities, 'pv_type')}
        AND UPPER(ISNULL(pv_type.variant_type, '')) IN (${types.map(() => '?').join(', ')})
    )`);
    params.push(...types);
  }

  if (safeFilters.scent) {
    addScentCondition(conditions, params, safeFilters.scent, capabilities);
  }

  if (safeFilters.scentGroup) {
    addScentCondition(conditions, params, scentKeywordsForGroup(safeFilters.scentGroup), capabilities);
  }

  if (safeFilters.gender) {
    const gender = normalizeLookupValue(safeFilters.gender);
    const values = gender === 'men' || gender === 'male' || gender === 'nam'
      ? ['MEN', 'MALE', 'NAM']
      : gender === 'women' || gender === 'female' || gender === 'nu'
        ? ['WOMEN', 'FEMALE', 'NU', 'NỮ']
        : ['UNISEX'];

    const genderClauses = [];
    if (hasColumn(capabilities.productColumns, 'gender')) {
      genderClauses.push(`UPPER(ISNULL(p.gender, '')) IN (${values.map(() => '?').join(', ')})`);
      params.push(...values);
    }
    if (capabilities.hasCategories) {
      genderClauses.push(`p.id_category IN (
        SELECT id FROM categories
        WHERE ${values.map(() => 'UPPER(ISNULL(name, \'\')) LIKE ?').join(' OR ')}
      )`);
      params.push(...values.map((value) => `%${value}%`));
    }
    if (genderClauses.length) conditions.push(`(${genderClauses.join(' OR ')})`);
  }

  return { whereSql: `WHERE ${conditions.join(' AND ')}`, params };
}

function discoveryPriceSql(capabilities) {
  const effectivePrice = buildEffectivePriceSql();
  return capabilities.hasVariants
    ? `COALESCE(variant_stock.variant_min_effective_price, ${effectivePrice})`
    : effectivePrice;
}

function buildSort(sort, capabilities) {
  const effectivePrice = discoveryPriceSql(capabilities);
  switch (sort) {
    case 'price_asc':
      return `CASE WHEN ${effectivePrice} IS NULL THEN 1 ELSE 0 END ASC, ${effectivePrice} ASC, p.id DESC`;
    case 'price_desc':
      return `CASE WHEN ${effectivePrice} IS NULL THEN 1 ELSE 0 END ASC, ${effectivePrice} DESC, p.id DESC`;
    case 'best_seller':
    case 'bestseller':
      return 'ISNULL(sales.sold_count, 0) DESC, p.id DESC';
    case 'rating':
      return 'rating_average DESC, ISNULL(sales.sold_count, 0) DESC, p.id DESC';
    case 'sale':
      return 'discount_percent DESC, p.id DESC';
    default:
      return 'p.created_at DESC, p.id DESC';
  }
}

function buildVariantStockJoin(capabilities) {
  if (!capabilities.hasVariants) {
    return {
      select: '0 AS variant_count, NULL AS variant_stock_quantity, NULL AS variant_min_original_price, NULL AS variant_min_effective_price, 0 AS variant_has_sale',
      join: '',
    };
  }

  const deletedFilter = hasColumn(capabilities.variantColumns, 'deleted_at') ? 'WHERE deleted_at IS NULL' : '';
  const statusExpression = hasColumn(capabilities.variantColumns, 'status') ? 'ISNULL(status, 1) = 1' : '1 = 1';

  return {
    select: `ISNULL(variant_stock.variant_count, 0) AS variant_count,
      ISNULL(variant_stock.variant_stock_quantity, 0) AS variant_stock_quantity,
      variant_stock.variant_min_original_price AS variant_min_original_price,
      variant_stock.variant_min_effective_price AS variant_min_effective_price,
      ISNULL(variant_stock.variant_has_sale, 0) AS variant_has_sale`,
    join: `
      LEFT JOIN (
        SELECT product_id,
               COUNT(*) AS variant_count,
               SUM(CASE WHEN ${statusExpression} THEN CASE WHEN ISNULL(stock_quantity, 0) > 0 THEN stock_quantity ELSE 0 END ELSE 0 END) AS variant_stock_quantity,
               MIN(CASE WHEN ${statusExpression} AND ISNULL(price, 0) > 0 THEN price ELSE NULL END) AS variant_min_original_price,
               MIN(CASE WHEN ${statusExpression} THEN
                 CASE
                   WHEN ISNULL(price, 0) > 0 AND ISNULL(sale_price, 0) > 0 AND sale_price < price THEN sale_price
                   WHEN ISNULL(price, 0) > 0 THEN price
                   ELSE NULL
                 END
               ELSE NULL END) AS variant_min_effective_price,
               MAX(CASE WHEN ${statusExpression} AND ISNULL(price, 0) > 0 AND ISNULL(sale_price, 0) > 0 AND sale_price < price THEN 1 ELSE 0 END) AS variant_has_sale
        FROM product_variants
        ${deletedFilter}
        GROUP BY product_id
      ) variant_stock ON variant_stock.product_id = p.id
    `,
  };
}

function buildImageJoin(capabilities) {
  if (!capabilities.hasProductImages || !hasColumn(capabilities.imageColumns, 'image_url')) {
    return {
      select: 'p.image AS thumbnail_image',
      join: '',
    };
  }

  const deletedFilter = hasColumn(capabilities.imageColumns, 'deleted_at') ? 'WHERE deleted_at IS NULL' : '';
  const thumbnailExpression = hasColumn(capabilities.imageColumns, 'is_thumbnail')
    ? 'MAX(CASE WHEN ISNULL(is_thumbnail, 0) = 1 THEN image_url ELSE NULL END)'
    : 'MIN(image_url)';

  return {
    select: 'COALESCE(product_images.thumbnail_image, p.image) AS thumbnail_image',
    join: `
      LEFT JOIN (
        SELECT product_id, ${thumbnailExpression} AS thumbnail_image
        FROM product_images
        ${deletedFilter}
        GROUP BY product_id
      ) product_images ON product_images.product_id = p.id
    `,
  };
}

function buildReviewStatsJoin(capabilities) {
  const averageFallback = hasColumn(capabilities.productColumns, 'rating_average') ? 'p.rating_average' : '0';
  const countFallback = hasColumn(capabilities.productColumns, 'review_count') ? 'p.review_count' : '0';

  if (!capabilities.hasProductReviews) {
    return {
      select: `${averageFallback} AS rating_average, ${countFallback} AS review_count`,
      join: '',
    };
  }

  return {
    select: `COALESCE(review_stats.rating_average, ${averageFallback}, 0) AS rating_average,
      COALESCE(review_stats.review_count, ${countFallback}, 0) AS review_count`,
    join: `
      LEFT JOIN (
        SELECT product_id,
               AVG(CAST(rating AS FLOAT)) AS rating_average,
               COUNT(*) AS review_count
        FROM product_reviews
        WHERE status = N'APPROVED'
          AND deleted_at IS NULL
        GROUP BY product_id
      ) review_stats ON review_stats.product_id = p.id
    `,
  };
}

function buildProductInventoryJoin(capabilities) {
  if (!capabilities.hasProductInventory) {
    return {
      select: 'NULL AS sealed_bottles, NULL AS opened_ml, NULL AS bottle_volume_ml',
      join: '',
    };
  }

  return {
    select: 'pi.sealed_bottles, pi.opened_ml, pi.bottle_volume_ml',
    join: 'LEFT JOIN product_inventory pi ON pi.product_id = p.id',
  };
}

function buildProductSelect(capabilities) {
  const productColumns = capabilities.productColumns;
  const variantStock = buildVariantStockJoin(capabilities);
  const images = buildImageJoin(capabilities);
  const reviews = buildReviewStatsJoin(capabilities);
  const inventory = buildProductInventoryJoin(capabilities);
  const discoveryPrice = discoveryPriceSql(capabilities);
  const discoveryOriginalPrice = 'p.price';
  const discountPercent = `(
    CASE
      WHEN ${discoveryPrice} IS NOT NULL
        AND ${discoveryOriginalPrice} IS NOT NULL
        AND ${discoveryOriginalPrice} > ${discoveryPrice}
      THEN ROUND(((${discoveryOriginalPrice} - ${discoveryPrice}) / ${discoveryOriginalPrice}) * 100, 0)
      ELSE 0
    END
  )`;

  return `
    SELECT
      p.id,
      p.sku,
      p.batch_code,
      p.name,
      p.image,
      p.price,
      p.discount_price,
      p.quantity,
      p.status,
      p.id_category,
      p.id_brand,
      p.stock,
      COALESCE(variant_stock.variant_stock_quantity, ISNULL(p.stock, ISNULL(p.quantity, 0))) AS stock_quantity,
      p.volume_ml,
      p.description,
      p.created_at,
      p.scent_notes,
      p.is_decant,
      ${optionalSelect(productColumns, 'slug', 'p.slug', 'slug')},
      ${optionalSelect(productColumns, 'gender', 'p.gender', 'gender')},
      ${optionalSelect(productColumns, 'concentration', 'p.concentration', 'concentration')},
      ${optionalSelect(productColumns, 'scent_group', 'p.scent_group', 'scent_group')},
      ${optionalSelect(productColumns, 'scent_family', 'p.scent_family', 'scent_family')},
      ${optionalSelect(productColumns, 'top_notes', 'p.top_notes', 'top_notes')},
      ${optionalSelect(productColumns, 'middle_notes', 'p.middle_notes', 'middle_notes')},
      ${optionalSelect(productColumns, 'base_notes', 'p.base_notes', 'base_notes')},
      ${reviews.select},
      ${optionalSelect(productColumns, 'updated_at', 'p.updated_at', 'updated_at')},
      ${optionalSelect(productColumns, 'deleted_at', 'p.deleted_at', 'deleted_at')},
      ${inventory.select},
      CASE WHEN EXISTS (SELECT 1 FROM decant_options d WHERE d.product_id = p.id AND d.status = 1) THEN 1 ELSE 0 END AS has_decant_variant,
      c.id AS category_id,
      c.name AS category_name,
      b.id AS brand_id,
      b.name AS brand_name,
      ISNULL(sales.sold_count, 0) AS sold_count,
      ${variantStock.select},
      ${discoveryPrice} AS discovery_min_price,
      ${discountPercent} AS discount_percent,
      ${images.select}
    FROM products p
    LEFT JOIN categories c ON c.id = p.id_category
    LEFT JOIN brand b ON b.id = p.id_brand
    ${inventory.join}
    LEFT JOIN (
      SELECT product_id, SUM(ISNULL(quantity, 0)) AS sold_count
      FROM order_items
      GROUP BY product_id
    ) sales ON sales.product_id = p.id
    ${variantStock.join}
    ${images.join}
    ${reviews.join}
  `;
}

export async function findProductsPaged({ page = 1, size = 12, sort = 'newest', filters = {} }) {
  const capabilities = await getProductStorageCapabilities();
  const pagination = parsePagination({ page, size });
  const offset = (pagination.page - 1) * pagination.size;
  const { whereSql, params } = buildFilters(filters, capabilities);

  const countRows = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const totalElements = Number(countRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalElements / pagination.size));

  const rows = await query(
    `${buildProductSelect(capabilities)}
     ${whereSql}
     ORDER BY ${buildSort(sort, capabilities)}
     OFFSET ${offset} ROWS FETCH NEXT ${pagination.size} ROWS ONLY`,
    params
  );

  return {
    rows,
    page: pagination.page,
    size: pagination.size,
    totalElements,
    totalPages,
    first: pagination.page === 1,
    last: pagination.page >= totalPages,
  };
}

export async function findProductById(id) {
  const capabilities = await getProductStorageCapabilities();
  const conditions = ['p.id = ?', 'p.status = 1'];
  if (hasColumn(capabilities.productColumns, 'deleted_at')) {
    conditions.push('p.deleted_at IS NULL');
  }

  const rows = await query(
    `${buildProductSelect(capabilities)}
     WHERE ${conditions.join(' AND ')}`,
    [id]
  );
  return rows[0] || null;
}

export async function findProductVariants(productId) {
  const capabilities = await getProductStorageCapabilities();
  if (!capabilities.hasVariants) return [];

  const deletedFilter = hasColumn(capabilities.variantColumns, 'deleted_at') ? 'AND deleted_at IS NULL' : '';
  const rows = await query(
    `SELECT id, product_id, sku, barcode, volume_ml, volume_label, variant_type,
            price, sale_price, stock_quantity, image, sort_order, status
     FROM product_variants
     WHERE product_id = ? ${deletedFilter}
     ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
  return rows;
}

export async function findProductImages(productId) {
  const capabilities = await getProductStorageCapabilities();
  if (!capabilities.hasProductImages || !hasColumn(capabilities.imageColumns, 'image_url')) return [];

  const deletedFilter = hasColumn(capabilities.imageColumns, 'deleted_at') ? 'AND deleted_at IS NULL' : '';
  const rows = await query(
    `SELECT id, product_id, image_url, alt_text, sort_order, is_thumbnail
     FROM product_images
     WHERE product_id = ? ${deletedFilter}
     ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
  return rows;
}

export async function isFavoriteProduct(userId, productId) {
  if (!userId) return false;
  const rows = await query(
    'SELECT TOP 1 id FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return rows.length > 0;
}

export async function findRandomProducts(limit = 4) {
  const capabilities = await getProductStorageCapabilities();
  const safeLimit = Math.max(1, Math.min(12, Number(limit) || 4));
  const filters = buildFilters({}, capabilities);
  const rows = await query(
    `${buildProductSelect(capabilities)}
     ${filters.whereSql}
     ORDER BY NEWID()
     OFFSET 0 ROWS FETCH NEXT ${safeLimit} ROWS ONLY`,
    filters.params
  );
  return rows;
}

export async function findProductsByKeyword(keyword, limit = 10) {
  const capabilities = await getProductStorageCapabilities();
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
  const safeKeyword = String(keyword || '').trim();
  const filters = buildFilters({ search: safeKeyword }, capabilities);
  const rows = await query(
    `${buildProductSelect(capabilities)}
     ${filters.whereSql}
     ORDER BY
       CASE
         WHEN LOWER(p.name) = LOWER(?) THEN 0
         WHEN LOWER(p.name) LIKE LOWER(?) THEN 1
         WHEN LOWER(p.name) LIKE LOWER(?) THEN 2
         ELSE 3
       END,
       p.id DESC
     OFFSET 0 ROWS FETCH NEXT ${safeLimit} ROWS ONLY`,
    [...filters.params, safeKeyword, `${safeKeyword}%`, `%${safeKeyword}%`]
  );
  return rows;
}

function parseRecommendationLimit(limit, fallback = 8, max = 24) {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.min(max, parsed));
}

function uniquePositiveNumbers(values = []) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value > 0))];
}

function uniqueNormalizedTexts(values = []) {
  return [...new Set(values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .map((value) => value.toUpperCase()))];
}

function placeholders(values) {
  return values.map(() => '?').join(', ');
}

function addInScore(scoreParts, scoreParams, expression, values, weight) {
  const safeValues = Array.isArray(values) ? values.filter((value) => value !== null && value !== undefined && value !== '') : [];
  if (!safeValues.length) return;
  scoreParts.push(`CASE WHEN ${expression} IN (${placeholders(safeValues)}) THEN ${weight} ELSE 0 END`);
  scoreParams.push(...safeValues);
}

function scentPatternsFromRows(rows = [], max = 6) {
  const values = [];
  rows.forEach((row) => {
    values.push(row.scent_group, row.scent_family, row.scent_notes);
  });

  return [...new Set(values
    .flatMap((value) => String(value || '').split(/[;,/|]+/g))
    .map((value) => value.trim())
    .filter((value) => value.length >= 3)
    .slice(0, max)
    .map((value) => `%${value}%`))];
}

function addScentScore(scoreParts, scoreParams, patterns, capabilities, weight = 8) {
  if (!patterns.length) return;
  const scentColumns = [];
  if (hasColumn(capabilities.productColumns, 'scent_group')) scentColumns.push("LOWER(ISNULL(p.scent_group, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'scent_family')) scentColumns.push("LOWER(ISNULL(p.scent_family, '')) LIKE LOWER(?)");
  if (hasColumn(capabilities.productColumns, 'scent_notes')) scentColumns.push("LOWER(ISNULL(p.scent_notes, '')) LIKE LOWER(?)");
  if (!scentColumns.length) return;

  for (const pattern of patterns) {
    scoreParts.push(`CASE WHEN (${scentColumns.join(' OR ')}) THEN ${weight} ELSE 0 END`);
    scoreParams.push(...scentColumns.map(() => pattern));
  }
}

function buildRecommendationScoreFromRows(rows = [], capabilities) {
  const scoreParts = ['0'];
  const scoreParams = [];
  const brandIds = uniquePositiveNumbers(rows.map((row) => row.id_brand));
  const categoryIds = uniquePositiveNumbers(rows.map((row) => row.id_category));
  const genders = uniqueNormalizedTexts(rows.map((row) => row.gender));
  const scentPatterns = scentPatternsFromRows(rows);

  addInScore(scoreParts, scoreParams, 'p.id_brand', brandIds, 40);
  addInScore(scoreParts, scoreParams, 'p.id_category', categoryIds, 28);
  if (hasColumn(capabilities.productColumns, 'gender')) {
    addInScore(scoreParts, scoreParams, "UPPER(ISNULL(p.gender, ''))", genders, 12);
  }
  addScentScore(scoreParts, scoreParams, scentPatterns, capabilities, 10);

  return {
    scoreSql: scoreParts.join(' + '),
    scoreParams,
  };
}

async function findRecommendationInterestRows({ userId = null, viewToken = null, limit = 24 } = {}, capabilities) {
  const rows = [];
  const safeLimit = parseRecommendationLimit(limit, 24, 60);
  const interestSelect = `p.id,
       p.id_brand,
       p.id_category,
       ${hasColumn(capabilities.productColumns, 'gender') ? 'p.gender' : 'NULL'} AS gender,
       ${hasColumn(capabilities.productColumns, 'scent_group') ? 'p.scent_group' : 'NULL'} AS scent_group,
       ${hasColumn(capabilities.productColumns, 'scent_family') ? 'p.scent_family' : 'NULL'} AS scent_family,
       ${hasColumn(capabilities.productColumns, 'scent_notes') ? 'p.scent_notes' : 'NULL'} AS scent_notes`;

  if (userId && capabilities.hasWishlist) {
    rows.push(...await query(
      `SELECT TOP ${safeLimit} ${interestSelect}
       FROM wishlist w
       INNER JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC, w.id DESC`,
      [userId]
    ));
  }

  if (capabilities.hasRecentViews && (userId || viewToken)) {
    const ownerClauses = [];
    const ownerParams = [];
    if (userId) {
      ownerClauses.push('rv.user_id = ?');
      ownerParams.push(userId);
    }
    if (viewToken) {
      ownerClauses.push('rv.view_token = ?');
      ownerParams.push(String(viewToken));
    }

    rows.push(...await query(
      `SELECT TOP ${safeLimit} ${interestSelect}
       FROM product_recent_views rv
       INNER JOIN products p ON p.id = rv.product_id
       WHERE (${ownerClauses.join(' OR ')})
       ORDER BY rv.last_viewed_at DESC, rv.id DESC`,
      ownerParams
    ));
  }

  return rows;
}

export async function findRelatedProducts(productId, limit = 8) {
  const capabilities = await getProductStorageCapabilities();
  const product = await findProductById(productId);
  if (!product) return [];

  const safeLimit = parseRecommendationLimit(limit, 8);
  const filters = buildFilters({}, capabilities);
  const scoreRows = [{
    id_brand: product.id_brand,
    id_category: product.id_category,
    gender: product.gender,
    scent_group: product.scent_group,
    scent_family: product.scent_family,
    scent_notes: product.scent_notes,
  }];
  const { scoreSql, scoreParams } = buildRecommendationScoreFromRows(scoreRows, capabilities);

  return query(
    `${buildProductSelect(capabilities)}
     ${filters.whereSql}
       AND p.id <> ?
     ORDER BY (${scoreSql}) DESC, ISNULL(sales.sold_count, 0) DESC, rating_average DESC, p.created_at DESC, p.id DESC
     OFFSET 0 ROWS FETCH NEXT ${safeLimit} ROWS ONLY`,
    [...filters.params, Number(productId), ...scoreParams]
  );
}

export async function findTrendingProducts({ limit = 8, days = 30 } = {}) {
  const capabilities = await getProductStorageCapabilities();
  const safeLimit = parseRecommendationLimit(limit, 8);
  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));
  const filters = buildFilters({}, capabilities);
  const viewJoin = capabilities.hasRecentViews
    ? `LEFT JOIN (
        SELECT product_id, SUM(ISNULL(view_count, 1)) AS view_count, MAX(last_viewed_at) AS last_viewed_at
        FROM product_recent_views
        WHERE last_viewed_at >= DATEADD(day, -?, SYSUTCDATETIME())
        GROUP BY product_id
      ) view_stats ON view_stats.product_id = p.id`
    : '';
  const viewOrder = capabilities.hasRecentViews ? 'ISNULL(view_stats.view_count, 0) DESC,' : '';
  const params = capabilities.hasRecentViews ? [safeDays, ...filters.params] : filters.params;

  return query(
    `${buildProductSelect(capabilities)}
     ${viewJoin}
     ${filters.whereSql}
     ORDER BY ${viewOrder} ISNULL(sales.sold_count, 0) DESC, rating_average DESC, p.created_at DESC, p.id DESC
     OFFSET 0 ROWS FETCH NEXT ${safeLimit} ROWS ONLY`,
    params
  );
}

export async function findRecentlyViewedProducts({ userId = null, viewToken = null, limit = 12 } = {}) {
  const capabilities = await getProductStorageCapabilities();
  if (!capabilities.hasRecentViews || (!userId && !viewToken)) return [];

  const safeLimit = parseRecommendationLimit(limit, 12, 50);
  const filters = buildFilters({}, capabilities);
  const ownerClauses = [];
  const ownerParams = [];
  if (userId) {
    ownerClauses.push('rv.user_id = ?');
    ownerParams.push(userId);
  }
  if (viewToken) {
    ownerClauses.push('rv.view_token = ?');
    ownerParams.push(String(viewToken));
  }

  return query(
    `${buildProductSelect(capabilities)}
     INNER JOIN product_recent_views rv ON rv.product_id = p.id AND (${ownerClauses.join(' OR ')})
     ${filters.whereSql}
     ORDER BY rv.last_viewed_at DESC, rv.id DESC
     OFFSET 0 ROWS FETCH NEXT ${safeLimit} ROWS ONLY`,
    [...ownerParams, ...filters.params]
  );
}

export async function findPersonalizedProducts({ userId = null, viewToken = null, limit = 8 } = {}) {
  const capabilities = await getProductStorageCapabilities();
  const safeLimit = parseRecommendationLimit(limit, 8);
  const interestRows = await findRecommendationInterestRows({ userId, viewToken }, capabilities);
  if (!interestRows.length) return [];

  const filters = buildFilters({}, capabilities);
  const excludeIds = uniquePositiveNumbers(interestRows.map((row) => row.id));
  const excludeSql = excludeIds.length ? `AND p.id NOT IN (${placeholders(excludeIds)})` : '';
  const { scoreSql, scoreParams } = buildRecommendationScoreFromRows(interestRows, capabilities);

  return query(
    `${buildProductSelect(capabilities)}
     ${filters.whereSql}
       ${excludeSql}
     ORDER BY (${scoreSql}) DESC, ISNULL(sales.sold_count, 0) DESC, rating_average DESC, p.created_at DESC, p.id DESC
     OFFSET 0 ROWS FETCH NEXT ${safeLimit} ROWS ONLY`,
    [...filters.params, ...excludeIds, ...scoreParams]
  );
}

export async function saveProductView({ productId, userId = null, viewToken = null } = {}) {
  const capabilities = await getProductStorageCapabilities();
  if (!capabilities.hasRecentViews || (!userId && !viewToken)) {
    return { recorded: false, reason: capabilities.hasRecentViews ? 'MISSING_OWNER' : 'RECENT_VIEWS_TABLE_MISSING' };
  }

  const safeProductId = Number(productId);
  if (!Number.isInteger(safeProductId) || safeProductId <= 0) {
    return { recorded: false, reason: 'INVALID_PRODUCT' };
  }

  if (userId) {
    await query(
      `MERGE product_recent_views WITH (HOLDLOCK) AS target
       USING (SELECT CAST(? AS INT) AS user_id, CAST(? AS INT) AS product_id) AS source
       ON target.user_id = source.user_id AND target.product_id = source.product_id
       WHEN MATCHED THEN
         UPDATE SET view_count = ISNULL(target.view_count, 0) + 1, last_viewed_at = SYSUTCDATETIME()
       WHEN NOT MATCHED THEN
         INSERT (user_id, product_id, view_count, last_viewed_at)
         VALUES (source.user_id, source.product_id, 1, SYSUTCDATETIME());`,
      [Number(userId), safeProductId]
    );
    return { recorded: true };
  }

  const safeToken = String(viewToken || '').trim().slice(0, 160);
  if (!safeToken) return { recorded: false, reason: 'MISSING_TOKEN' };
  await query(
    `MERGE product_recent_views WITH (HOLDLOCK) AS target
     USING (SELECT CAST(? AS NVARCHAR(160)) AS view_token, CAST(? AS INT) AS product_id) AS source
     ON target.view_token = source.view_token AND target.product_id = source.product_id
     WHEN MATCHED THEN
       UPDATE SET view_count = ISNULL(target.view_count, 0) + 1, last_viewed_at = SYSUTCDATETIME()
     WHEN NOT MATCHED THEN
       INSERT (view_token, product_id, view_count, last_viewed_at)
       VALUES (source.view_token, source.product_id, 1, SYSUTCDATETIME());`,
    [safeToken, safeProductId]
  );
  return { recorded: true };
}

export function hasOrderItemVariantColumn(capabilities) {
  return hasColumn(capabilities.orderItemColumns, 'product_variant_id');
}
