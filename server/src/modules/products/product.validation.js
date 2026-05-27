export function parsePositiveInt(value, fallback = null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function parsePagination({ page = 1, size = 12 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Math.min(100, Number(size) || 12));
  return { page: safePage, size: safeSize };
}

export function normalizeListValue(value) {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

export function normalizeProductFilters(filters = {}) {
  const keyword = normalizeListValue(filters.search || filters.q || filters.keyword || filters.name);
  return {
    categoryId: normalizeListValue(filters.categoryId),
    category: normalizeListValue(filters.category || filters.categorySlug || filters.categoryName),
    brandId: normalizeListValue(filters.brandId),
    brand: normalizeListValue(filters.brand || filters.brandSlug || filters.brandName),
    search: keyword,
    badge: normalizeListValue(filters.badge),
    priceRange: normalizeListValue(filters.priceRange),
    minPrice: normalizeListValue(filters.minPrice),
    maxPrice: normalizeListValue(filters.maxPrice),
    volumeMl: normalizeListValue(filters.volumeMl),
    volume: normalizeListValue(filters.volume),
    variantType: normalizeListValue(filters.variantType),
    scent: normalizeListValue(filters.scent),
    scentGroup: normalizeListValue(filters.scentGroup || filters.scentFamily),
    gender: normalizeListValue(filters.gender),
    sale: normalizeListValue(filters.sale || filters.onSale),
    bestSeller: normalizeListValue(filters.bestSeller || filters.bestseller),
  };
}

export function validateProductResponse(product) {
  const errors = [];

  if (!product.name) errors.push('THIEU_TEN_SAN_PHAM');
  if (product.status && product.price === null) errors.push('THIEU_GIA_SAN_PHAM');
  if (product.salePrice !== null && product.originalPrice !== null && product.salePrice > product.originalPrice) {
    errors.push('GIA_GIAM_KHONG_VUOT_GIA_GOC');
  }
  if (!Number.isInteger(product.stockQuantity) || product.stockQuantity < 0) {
    errors.push('TON_KHO_KHONG_DUOC_AM');
  }

  const imageKeys = new Set();
  for (const image of product.images || []) {
    if (!image || typeof image !== 'string') errors.push('URL_ANH_KHONG_HOP_LE');
    const key = String(image || '').toLowerCase();
    if (imageKeys.has(key)) errors.push('URL_ANH_TRUNG_LAP');
    imageKeys.add(key);
  }

  for (const variant of product.variants || []) {
    if (!variant.sku) errors.push('THIEU_SKU_BIEN_THE');
    if (variant.price === null) errors.push('THIEU_GIA_BIEN_THE');
    if (variant.salePrice !== null && variant.originalPrice !== null && variant.salePrice > variant.originalPrice) {
      errors.push('GIA_GIAM_BIEN_THE_KHONG_HOP_LE');
    }
    if (!Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0) {
      errors.push('TON_KHO_BIEN_THE_KHONG_HOP_LE');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCartQuantity(quantity) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    return { valid: false, message: 'Số lượng không hợp lệ' };
  }
  return { valid: true, quantity: qty };
}

export function resolvePurchasableSelection(product, variantId = null) {
  if (!product) {
    return { code: 404, message: 'Không tìm thấy sản phẩm' };
  }

  const parsedVariantId = parsePositiveInt(variantId);
  if (product.hasVariants) {
    const variant = parsedVariantId
      ? (product.variants || []).find((item) => Number(item.id) === parsedVariantId)
      : (product.variants || []).find((item) => item.isAvailable);

    if (!variant) {
      return {
        code: 404,
        message: parsedVariantId ? 'Không tìm thấy biến thể sản phẩm' : 'Sản phẩm chưa có biến thể khả dụng',
      };
    }
    if (!variant.isAvailable) {
      return { code: 400, message: 'Biến thể sản phẩm đã hết hàng hoặc chưa có giá hợp lệ' };
    }

    return {
      product,
      variant,
      productId: product.id,
      variantId: variant.id,
      stockQuantity: variant.stockQuantity,
      unitPrice: variant.effectivePrice,
      image: variant.image || product.image,
      sku: variant.sku,
      batchCode: product.batchCode,
    };
  }

  if (!product.isPurchasable) {
    return { code: 400, message: 'Sản phẩm đã hết hàng hoặc chưa có giá hợp lệ' };
  }

  return {
    product,
    variant: null,
    productId: product.id,
    variantId: null,
    stockQuantity: product.stockQuantity,
    unitPrice: product.effectivePrice,
    image: product.image,
    sku: product.sku,
    batchCode: product.batchCode,
  };
}
