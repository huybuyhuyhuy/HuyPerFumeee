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
    scent: normalizeListValue(filters.scent),
    scentGroup: normalizeListValue(filters.scentGroup || filters.scentFamily),
    gender: normalizeListValue(filters.gender),
    sale: normalizeListValue(filters.sale || filters.onSale),
    bestSeller: normalizeListValue(filters.bestSeller || filters.bestseller),
  };
}

export function validateProductResponse(product) {
  const errors = [];

  if (!product.name) errors.push('PRODUCT_NAME_REQUIRED');
  if (product.status && product.price === null) errors.push('ACTIVE_PRODUCT_PRICE_REQUIRED');
  if (product.salePrice !== null && product.originalPrice !== null && product.salePrice > product.originalPrice) {
    errors.push('SALE_PRICE_MUST_NOT_EXCEED_ORIGINAL_PRICE');
  }
  if (!Number.isInteger(product.stockQuantity) || product.stockQuantity < 0) {
    errors.push('STOCK_QUANTITY_MUST_BE_NON_NEGATIVE');
  }

  const imageKeys = new Set();
  for (const image of product.images || []) {
    if (!image || typeof image !== 'string') errors.push('IMAGE_URL_INVALID');
    const key = String(image || '').toLowerCase();
    if (imageKeys.has(key)) errors.push('IMAGE_URL_DUPLICATED');
    imageKeys.add(key);
  }

  for (const variant of product.variants || []) {
    if (!variant.sku) errors.push(`VARIANT_${variant.id}_SKU_REQUIRED`);
    if (variant.price === null) errors.push(`VARIANT_${variant.id}_PRICE_REQUIRED`);
    if (variant.salePrice !== null && variant.originalPrice !== null && variant.salePrice > variant.originalPrice) {
      errors.push(`VARIANT_${variant.id}_SALE_PRICE_INVALID`);
    }
    if (!Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0) {
      errors.push(`VARIANT_${variant.id}_STOCK_INVALID`);
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
    if (!parsedVariantId) {
      return { code: 400, message: 'Vui lòng chọn biến thể sản phẩm' };
    }

    const variant = (product.variants || []).find((item) => Number(item.id) === parsedVariantId);
    if (!variant) {
      return { code: 404, message: 'Không tìm thấy biến thể sản phẩm' };
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
