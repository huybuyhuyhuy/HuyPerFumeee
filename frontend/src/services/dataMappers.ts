import type { CartSummary, OrderResponse, Product } from '../types';

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

export function normalizeProduct(raw: any): Product {
  const category = raw?.category
    ? { id: asNumber(raw.category.id), name: asString(raw.category.name) }
    : normalizeRef(raw, 'id_category', 'categoryName');

  const brand = raw?.brand
    ? { id: asNumber(raw.brand.id), name: asString(raw.brand.name) }
    : normalizeRef(raw, 'id_brand', 'brandName');

  return {
    id: asNumber(raw?.id ?? raw?.productId),
    sku: asString(raw?.sku),
    batchCode: asString(raw?.batchCode ?? raw?.batch_code),
    name: asString(raw?.name ?? raw?.productName),
    price: asNumber(raw?.price),
    discountPrice: asNumber(raw?.discountPrice ?? raw?.discount_price),
    image: asString(raw?.image ?? raw?.productImage),
    images: Array.isArray(raw?.images) ? raw.images.map((image: unknown) => asString(image)).filter(Boolean) : [],
    description: asString(raw?.description),
    scentNotes: asString(raw?.scentNotes ?? raw?.scent_notes),
    isDecant: asBoolean(raw?.isDecant ?? raw?.is_decant),
    status: asBoolean(raw?.status, true),
    stock: asNumber(raw?.stock ?? raw?.quantity),
    volumeMl: asNumber(raw?.volumeMl ?? raw?.volume_ml),
    category,
    brand,
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
      productName: asString(item.productName ?? item.name ?? item.product_name),
      productImage: asString(item.productImage ?? item.image ?? item.product_image),
      quantity: asNumber(item.quantity),
      price: asNumber(item.price),
      selectedBatchCode: asString(item.selectedBatchCode ?? item.selected_batch_code),
      priceAtPurchase: asNumber(item.priceAtPurchase ?? item.price_at_purchase ?? item.price),
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
    paymentUrl: raw?.paymentUrl ?? raw?.payUrl ?? raw?.orderUrl,
  };
}

export function normalizeOrderList(raw: any): OrderResponse[] {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : Array.isArray(raw?.listOrders) ? raw.listOrders : [];
  return list.map(normalizeOrder);
}
