export const PURCHASE_RECEIPT_STATUSES = ['DRAFT', 'COMPLETED', 'CANCELLED'];

const LIST_SORT_COLUMNS = ['ReceiptCode', 'ImportDate', 'TotalAmount', 'SupplierName', 'CreatedAt'];

function toText(value) {
  return String(value ?? '').trim();
}

function toPositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function toNonNegativeMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : null;
}

function pushError(errors, field, message) {
  errors[field] = errors[field] || [];
  errors[field].push(message);
}

function parseDate(value, field, errors, { required = false } = {}) {
  const raw = toText(value);
  if (!raw) {
    if (required) pushError(errors, field, 'Vui lòng chọn ngày nhập hàng.');
    return null;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    pushError(errors, field, 'Ngày nhập hàng không hợp lệ.');
    return null;
  }
  return date;
}

export function validatePurchaseReceiptId(value) {
  const purchaseReceiptId = toPositiveInt(value);
  if (!purchaseReceiptId) {
    return { valid: false, purchaseReceiptId: null, message: 'Mã phiếu nhập không hợp lệ.' };
  }
  return { valid: true, purchaseReceiptId };
}

export function normalizePurchaseReceiptListQuery(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(query.pageSize, 10) || 10));
  const status = toText(query.status).toUpperCase();
  const sortByRaw = toText(query.sortBy) || 'ImportDate';
  const sortBy = LIST_SORT_COLUMNS.find((column) => column.toLowerCase() === sortByRaw.toLowerCase()) || 'ImportDate';
  const sortOrder = toText(query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
  const errors = {};

  return {
    search: toText(query.search),
    supplierId: toPositiveInt(query.supplierId),
    status: PURCHASE_RECEIPT_STATUSES.includes(status) ? status : '',
    dateFrom: parseDate(query.dateFrom, 'dateFrom', errors),
    dateTo: parseDate(query.dateTo, 'dateTo', errors),
    page,
    pageSize,
    sortBy,
    sortOrder,
  };
}

export function validatePurchaseReceiptPayload(payload = {}) {
  const errors = {};
  const supplierId = toPositiveInt(payload.supplierId ?? payload.SupplierId);
  const importDate = parseDate(payload.importDate ?? payload.ImportDate, 'importDate', errors) || new Date();
  const rawItems = Array.isArray(payload.items) ? payload.items : [];

  if (!supplierId) pushError(errors, 'supplierId', 'Vui lòng chọn nhà cung cấp.');
  if (rawItems.length === 0) pushError(errors, 'items', 'Phiếu nhập phải có ít nhất một sản phẩm.');

  const items = rawItems.map((item, index) => {
    const productId = toPositiveInt(item.productId ?? item.ProductId);
    const variantIdRaw = item.variantId ?? item.VariantId;
    const variantId = variantIdRaw === null || variantIdRaw === undefined || toText(variantIdRaw) === ''
      ? null
      : toPositiveInt(variantIdRaw);
    const quantity = toPositiveInt(item.quantity ?? item.Quantity);
    const importPrice = toNonNegativeMoney(item.importPrice ?? item.ImportPrice);
    const prefix = `items.${index}`;

    if (!productId) pushError(errors, `${prefix}.productId`, 'Vui lòng chọn sản phẩm.');
    if (variantIdRaw !== null && variantIdRaw !== undefined && toText(variantIdRaw) !== '' && !variantId) {
      pushError(errors, `${prefix}.variantId`, 'Biến thể không hợp lệ.');
    }
    if (!quantity) pushError(errors, `${prefix}.quantity`, 'Số lượng nhập phải lớn hơn 0.');
    if (importPrice === null) pushError(errors, `${prefix}.importPrice`, 'Giá nhập không được âm.');

    return {
      productId,
      variantId,
      quantity: quantity || 0,
      importPrice: importPrice ?? 0,
      note: toText(item.note ?? item.Note).slice(0, 500),
    };
  });

  return {
    valid: Object.keys(errors).length === 0,
    data: {
      supplierId,
      importDate,
      note: toText(payload.note ?? payload.Note),
      items,
    },
    errors,
  };
}

export function validatePurchaseReceiptUpdatePayload(payload = {}) {
  const errors = {};
  const importDate = parseDate(payload.importDate ?? payload.ImportDate, 'importDate', errors);

  return {
    valid: Object.keys(errors).length === 0,
    data: {
      importDate,
      note: toText(payload.note ?? payload.Note),
    },
    errors,
  };
}
