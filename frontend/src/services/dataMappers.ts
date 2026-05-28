import type { CartSummary, OrderResponse, Product, ProductVariant } from '../types';

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asString(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value);
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function normalizeRef(raw: any, idKey: string, nameKey: string) {
  const nested = raw?.[idKey.replace(/^id_/, '')];
  if (nested?.id || nested?.name) {
    return {
      id: asNumber(nested.id),
      name: asString(nested.name),
    };
  }

  const id = raw?.[idKey] ?? raw?.[`${idKey}Id`];
  const name = raw?.[nameKey];
  if (!id && !name) return null;

  return {
    id: asNumber(id),
    name: asString(name),
  };
}

function normalizeProductVariant(raw: any): ProductVariant {
  const salePrice = asNullableNumber(raw?.salePrice ?? raw?.discountPrice ?? raw?.discount_price);
  const originalPrice = asNumber(raw?.originalPrice ?? raw?.original_price ?? raw?.price);
  const stockQuantity = asNumber(raw?.stockQuantity ?? raw?.stock_quantity ?? raw?.stock);

  return {
    id: raw?.id ?? raw?.variantId,
    variantId: raw?.variantId ?? raw?.id,
    productId: asNumber(raw?.productId ?? raw?.product_id),
    sku: asString(raw?.sku),
    barcode: asString(raw?.barcode),
    label: asString(raw?.label ?? raw?.name),
    name: asString(raw?.name ?? raw?.label),
    volume: asString(raw?.volume ?? raw?.volumeLabel ?? raw?.volume_label),
    volumeMl: asNullableNumber(raw?.volumeMl ?? raw?.volume_ml),
    type: asString(raw?.type ?? raw?.variantType ?? raw?.variant_type),
    price: asNumber(raw?.price ?? originalPrice),
    salePrice,
    discountPrice: salePrice,
    originalPrice,
    discountPercent: asNumber(raw?.discountPercent ?? raw?.discount_percent),
    stockQuantity,
    stock: stockQuantity,
    image: asString(raw?.image ?? raw?.productImage ?? raw?.product_image),
    status: asBoolean(raw?.status, true),
    isAvailable: asBoolean(raw?.isAvailable ?? raw?.is_available, stockQuantity > 0),
  };
}

export function normalizeProduct(raw: any): Product {
  raw = raw?.product && typeof raw.product === 'object' ? raw.product : raw;
  const category = raw?.category
    ? { id: asNumber(raw.category.id), name: asString(raw.category.name) }
    : normalizeRef(raw, 'id_category', 'categoryName');

  const brand = raw?.brand
    ? { id: asNumber(raw.brand.id), name: asString(raw.brand.name) }
    : normalizeRef(raw, 'id_brand', 'brandName');
  const salePrice = asNullableNumber(raw?.salePrice ?? raw?.discountPrice ?? raw?.discount_price);
  const stockQuantity = asNumber(raw?.stockQuantity ?? raw?.stock_quantity ?? raw?.stock ?? raw?.quantity);

  const decantInventory = raw?.decantInventory
    ? {
        sealedBottles: asNumber(raw.decantInventory.sealedBottles),
        openedMl: asNumber(raw.decantInventory.openedMl),
        bottleVolumeMl: asNumber(raw.decantInventory.bottleVolumeMl),
      }
    : null;

  return {
    id: asNumber(raw?.id ?? raw?.productId),
    variantId: raw?.variantId ?? raw?.productVariantId ?? raw?.product_variant_id ?? null,
    sku: asString(raw?.sku),
    batchCode: asString(raw?.batchCode ?? raw?.batch_code),
    name: asString(raw?.name ?? raw?.productName),
    price: asNumber(raw?.price),
    salePrice,
    effectivePrice: asNullableNumber(raw?.effectivePrice ?? raw?.effective_price),
    discountPrice: asNumber(salePrice),
    originalPrice: asNumber(raw?.originalPrice ?? raw?.original_price ?? raw?.price),
    discountPercent: asNumber(raw?.discountPercent ?? raw?.discount_percent),
    image: asString(raw?.image ?? raw?.productImage),
    images: Array.isArray(raw?.images) ? Array.from(new Set(raw.images.map((image: unknown) => asString(image)).filter(Boolean))) : [],
    description: asString(raw?.description),
    scentNotes: asString(raw?.scentNotes ?? raw?.scent_notes),
    scentGroup: asString(raw?.scentGroup ?? raw?.scent_group ?? raw?.scentFamily ?? raw?.scent_family),
    gender: asString(raw?.gender ?? raw?.targetGender ?? raw?.target_gender),
    concentration: asString(raw?.concentration ?? raw?.perfumeConcentration ?? raw?.perfume_concentration),
    isDecant: asBoolean(raw?.isDecant ?? raw?.is_decant),
    status: asBoolean(raw?.status, true),
    stockQuantity,
    stock: stockQuantity,
    hasVariants: asBoolean(raw?.hasVariants ?? raw?.has_variants),
    volumeMl: asNumber(raw?.volumeMl ?? raw?.volume_ml),
    rating: asNumber(raw?.rating),
    reviewCount: asNumber(raw?.reviewCount ?? raw?.review_count),
    soldCount: asNumber(raw?.soldCount ?? raw?.sold_count),
    badgeLabel: asString(raw?.badgeLabel ?? raw?.badge_label),
    isFavorite: asBoolean(raw?.isFavorite ?? raw?.is_favorite),
    isInStock: asBoolean(raw?.isInStock ?? raw?.is_in_stock, stockQuantity > 0),
    isPurchasable: asBoolean(raw?.isPurchasable ?? raw?.is_purchasable, stockQuantity > 0),
    thumbnailImage: raw?.thumbnailImage ?? raw?.thumbnail_image ?? null,
    selectedVariant: raw?.selectedVariant ? normalizeProductVariant(raw.selectedVariant) : null,
    variants: Array.isArray(raw?.variants) ? raw.variants.map(normalizeProductVariant) : [],
    category,
    brand,
    decantInventory,
    bottleVolumeMl: asNumber(raw?.bottleVolumeMl ?? raw?.bottle_volume_ml ?? raw?.volumeMl ?? raw?.volume_ml),
  };
}

export function normalizeProductPage(raw: any) {
  const content = Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : [];
  const size = asNumber(raw?.size, content.length || 12);
  const totalElements = asNumber(raw?.totalElements, content.length);
  const totalPages = asNumber(raw?.totalPages, Math.max(1, Math.ceil(totalElements / Math.max(size, 1))));
  const page = asNumber(raw?.page, 1);

  return {
    content: content.map(normalizeProduct),
    page,
    size,
    totalElements,
    totalPages,
    first: raw?.first ?? page <= 1,
    last: raw?.last ?? page >= totalPages,
  };
}

export function normalizeCartSummary(raw: any): CartSummary {
  const items = Array.isArray(raw?.items)
    ? raw.items.map((item: any) => {
      const product = normalizeProduct(item.product ?? item);
      const quantity = asNumber(item.quantity, 1);
      const price = asNumber(item.price, product.discountPrice > 0 ? product.discountPrice : product.price);
      return {
        ...item,
        product,
        quantity,
        price,
        subtotal: asNumber(item.subtotal, price * quantity),
      };
    })
    : [];

  return {
    items,
    total: asNumber(raw?.total, items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    itemCount: asNumber(raw?.itemCount, items.reduce((sum, item) => sum + item.quantity, 0)),
  };
}

export function normalizeOrder(raw: any): OrderResponse {
  const items = Array.isArray(raw?.items)
    ? raw.items.map((item: any) => ({
      id: asNumber(item.id ?? item.itemId ?? item.item_id),
      productId: asNumber(item.productId ?? item.product_id),
      variantId: asNullableNumber(item.variantId ?? item.product_variant_id),
      productName: asString(item.productName ?? item.name ?? item.product_name),
      productImage: asString(item.productImage ?? item.image ?? item.product_image),
      quantity: asNumber(item.quantity),
      price: asNumber(item.price),
      selectedBatchCode: asString(item.selectedBatchCode ?? item.selected_batch_code),
      priceAtPurchase: asNumber(item.priceAtPurchase ?? item.price_at_purchase ?? item.price),
    }))
    : [];
  const timeline = Array.isArray(raw?.timeline)
    ? raw.timeline.map((event: any) => ({
      id: asNumber(event.id),
      oldStatus: event.oldStatus ?? event.old_status ?? null,
      newStatus: asString(event.newStatus ?? event.new_status),
      changedBy: event.changedBy ?? event.changed_by ?? null,
      changedByName: asString(event.changedByName ?? event.changed_by_name),
      note: asString(event.note),
      createdAt: asString(event.createdAt ?? event.created_at),
    }))
    : [];

  return {
    id: asNumber(raw?.id),
    userId: asNumber(raw?.userId ?? raw?.user_id),
    userName: asString(raw?.userName ?? raw?.user_name),
    total: asNumber(raw?.total),
    shippingAddress: asString(raw?.shippingAddress ?? raw?.shipping_address),
    phone: asString(raw?.phone),
    paymentMethod: asString(raw?.paymentMethod ?? raw?.payment_method),
    momoOrderId: asString(raw?.momoOrderId ?? raw?.momo_order_id),
    momoTransId: asString(raw?.momoTransId ?? raw?.momo_trans_id),
    zalopayAppTransId: asString(raw?.zalopayAppTransId ?? raw?.zalopay_app_trans_id),
    status: asString(raw?.status),
    createdAt: asString(raw?.createdAt ?? raw?.created_at),
    items,
    timeline,
    paymentUrl: raw?.paymentUrl ?? raw?.payUrl ?? raw?.orderUrl,
  };
}

export function normalizeOrderList(raw: any): OrderResponse[] {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : Array.isArray(raw?.listOrders) ? raw.listOrders : [];
  return list.map(normalizeOrder);
}
