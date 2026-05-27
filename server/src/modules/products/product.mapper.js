const VARIANT_TYPE_LABELS = {
  FULLBOX: 'Fullbox',
  TESTER: 'Tester',
  LIMITED_EDITION: 'Limited edition',
  DECANT: 'Decant',
  STANDARD: 'Standard',
};

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toPositiveMoney(value) {
  const parsed = toFiniteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function toNonNegativeInt(value, fallback = 0) {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function slugify(value, fallbackId) {
  const slug = normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || (fallbackId ? `product-${fallbackId}` : '');
}

function normalizeGender(rawGender, categoryName) {
  const value = normalizeText(rawGender).toUpperCase();
  if (['MEN', 'WOMEN', 'UNISEX'].includes(value)) return value;

  const category = normalizeText(categoryName).toLowerCase();
  if (category.includes('unisex')) return 'UNISEX';
  if (category.includes('nam') || category.includes('men')) return 'MEN';
  if (category.includes('nu') || category.includes('nữ') || category.includes('women')) return 'WOMEN';
  return null;
}

export function normalizePricePair(rawOriginalPrice, rawSalePrice) {
  const originalPrice = toPositiveMoney(rawOriginalPrice);
  const candidateSalePrice = toPositiveMoney(rawSalePrice);
  const salePrice = originalPrice && candidateSalePrice && candidateSalePrice < originalPrice
    ? candidateSalePrice
    : null;
  const effectivePrice = salePrice ?? originalPrice;
  const discountPercent = originalPrice && salePrice
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  return {
    price: originalPrice,
    originalPrice,
    salePrice,
    discountPrice: salePrice,
    effectivePrice,
    discountPercent,
  };
}

function normalizeImageUrl(value) {
  const url = normalizeText(value);
  return url || null;
}

export function normalizeImageCollection({ thumbnail, rows = [] }) {
  const seen = new Set();
  const images = [];

  const add = (url) => {
    const normalized = normalizeImageUrl(url);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    images.push(normalized);
  };

  add(thumbnail);
  rows
    .sort((a, b) => toNonNegativeInt(a.sort_order) - toNonNegativeInt(b.sort_order) || toNonNegativeInt(a.id) - toNonNegativeInt(b.id))
    .forEach((row) => add(row.image_url || row.image || row.url));

  return {
    thumbnailImage: images[0] || null,
    image: images[0] || '',
    images,
  };
}

export function mapVariantRow(row) {
  const prices = normalizePricePair(row.price, row.sale_price ?? row.discount_price);
  const stockQuantity = toNonNegativeInt(row.stock_quantity ?? row.stock);
  const volumeMl = toNonNegativeInt(row.volume_ml, null);
  const type = normalizeText(row.variant_type || row.type || 'STANDARD').toUpperCase();
  const volumeLabel = normalizeText(row.volume_label) || (volumeMl ? `${volumeMl}ml` : '');
  const typeLabel = VARIANT_TYPE_LABELS[type] || normalizeText(row.variant_type || row.type);
  const label = [volumeLabel, typeLabel].filter(Boolean).join(' - ') || `Variant ${row.id}`;
  const status = normalizeBoolean(row.status, true);

  return {
    id: row.id,
    variantId: row.id,
    productId: row.product_id,
    sku: normalizeText(row.sku),
    barcode: normalizeText(row.barcode),
    label,
    name: label,
    volume: volumeLabel,
    volumeMl,
    type,
    ...prices,
    stockQuantity,
    stock: stockQuantity,
    image: normalizeImageUrl(row.image) || '',
    status,
    isAvailable: status && stockQuantity > 0 && prices.effectivePrice !== null,
  };
}

export function mapProductRow(row, { variants = [], imageRows = [], isFavorite = false, includeVariants = false } = {}) {
  const mappedVariants = variants.map(mapVariantRow);
  const rowVariantCount = toNonNegativeInt(row.variant_count);
  const hasVariants = mappedVariants.length > 0 || rowVariantCount > 0;
  const variantStock = mappedVariants.length > 0
    ? mappedVariants.reduce((sum, variant) => sum + (variant.status ? variant.stockQuantity : 0), 0)
    : toNonNegativeInt(row.variant_stock_quantity);
  const parentStock = toNonNegativeInt(row.stock ?? row.quantity);
  const stockQuantity = hasVariants ? variantStock : parentStock;
  const variantOriginalPrice = toPositiveMoney(row.variant_min_original_price);
  const variantEffectivePrice = toPositiveMoney(row.variant_min_effective_price);
  const discoveryOriginalPrice = hasVariants && variantOriginalPrice ? variantOriginalPrice : row.price;
  const discoverySalePrice = hasVariants && variantOriginalPrice && variantEffectivePrice && variantEffectivePrice < variantOriginalPrice
    ? variantEffectivePrice
    : row.sale_price ?? row.discount_price;
  const prices = normalizePricePair(discoveryOriginalPrice, discoverySalePrice);
  const images = normalizeImageCollection({ thumbnail: row.thumbnail_image || row.image, rows: imageRows });
  const soldCount = toNonNegativeInt(row.sold_count);
  const ratingAverage = toFiniteNumber(row.rating_average ?? row.rating) ?? 0;
  const reviewCount = toNonNegativeInt(row.review_count);
  const gender = normalizeGender(row.gender, row.category_name);
  const createdAt = normalizeDate(row.created_at);
  const updatedAt = normalizeDate(row.updated_at);
  const deletedAt = normalizeDate(row.deleted_at);

  return {
    id: row.id,
    sku: normalizeText(row.sku),
    batchCode: normalizeText(row.batch_code),
    name: normalizeText(row.name),
    slug: normalizeText(row.slug) || slugify(row.name, row.id),
    ...prices,
    ...images,
    description: normalizeText(row.description),
    scentNotes: normalizeText(row.scent_notes),
    scentGroup: normalizeText(row.scent_group || row.scent_family || row.scent_notes),
    topNotes: normalizeText(row.top_notes),
    middleNotes: normalizeText(row.middle_notes),
    baseNotes: normalizeText(row.base_notes),
    gender,
    concentration: normalizeText(row.concentration) || null,
    isDecant: normalizeBoolean(row.is_decant),
    status: normalizeBoolean(row.status, true),
    stockQuantity,
    stock: stockQuantity,
    parentStockQuantity: parentStock,
    hasVariants,
    volumeMl: toNonNegativeInt(row.volume_ml),
    ratingAverage,
    rating: ratingAverage,
    reviewCount,
    soldCount,
    badgeLabel: prices.discountPercent > 0 ? 'Giảm giá' : soldCount > 0 ? 'Bán chạy' : '',
    isFavorite: Boolean(isFavorite),
    isInStock: stockQuantity > 0,
    isPurchasable: prices.effectivePrice !== null && stockQuantity > 0,
    category: row.category_id ? { id: row.category_id, name: normalizeText(row.category_name) } : null,
    brand: row.brand_id ? { id: row.brand_id, name: normalizeText(row.brand_name) } : null,
    variants: includeVariants ? mappedVariants : [],
    decantInventory: row.sealed_bottles !== undefined ? {
      sealedBottles: toNonNegativeInt(row.sealed_bottles),
      openedMl: toNonNegativeInt(row.opened_ml),
      bottleVolumeMl: toNonNegativeInt(row.bottle_volume_ml) || toNonNegativeInt(row.volume_ml) || 100,
    } : null,
    bottleVolumeMl: toNonNegativeInt(row.bottle_volume_ml) || toNonNegativeInt(row.volume_ml) || 100,
    createdAt,
    updatedAt,
    deletedAt,
  };
}
