export const SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE'];

const FIELD_LIMITS = {
  supplierName: 255,
  representativeName: 255,
  phone: 30,
  email: 255,
  address: 500,
  note: 2000,
};

function toText(value) {
  return String(value ?? '').trim();
}

export function stripVietnameseAccents(value) {
  return toText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizePhone(value) {
  const compact = toText(value).replace(/[\s().-]/g, '');
  if (compact.startsWith('+84')) return `0${compact.slice(3)}`;
  if (compact.startsWith('84')) return `0${compact.slice(2)}`;
  return compact;
}

export function normalizeSupplierStatus(value, fallback = 'ACTIVE') {
  const raw = stripVietnameseAccents(value).toUpperCase();
  if (!raw) return fallback;
  if (['ACTIVE', 'HOAT DONG', 'DANG HOAT DONG', 'DANG KICH HOAT', '1', 'TRUE'].includes(raw)) return 'ACTIVE';
  if (['INACTIVE', 'TAM NGUNG', 'NGUNG HOAT DONG', 'KHOA', '0', 'FALSE'].includes(raw)) return 'INACTIVE';
  return raw;
}

function pushError(errors, field, message) {
  errors[field] = errors[field] || [];
  errors[field].push(message);
}

function assertLength(errors, field, value) {
  const limit = FIELD_LIMITS[field];
  if (limit && toText(value).length > limit) {
    pushError(errors, field, `Tối đa ${limit} ký tự.`);
  }
}

export function validateSupplierId(value) {
  const supplierId = Number(value);
  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    return { valid: false, supplierId: null, message: 'Mã nhà cung cấp không hợp lệ.' };
  }
  return { valid: true, supplierId };
}

export function validateSupplierPayload(payload = {}) {
  const errors = {};
  const data = {
    supplierName: toText(payload.supplierName ?? payload.SupplierName ?? payload.name),
    representativeName: toText(payload.representativeName ?? payload.RepresentativeName),
    phone: normalizePhone(payload.phone ?? payload.Phone),
    email: toText(payload.email ?? payload.Email).toLowerCase(),
    address: toText(payload.address ?? payload.Address),
    note: toText(payload.note ?? payload.Note),
    status: normalizeSupplierStatus(payload.status ?? payload.Status, 'ACTIVE'),
  };

  if (!data.supplierName) pushError(errors, 'supplierName', 'Vui lòng nhập tên nhà cung cấp.');
  if (!data.phone) pushError(errors, 'phone', 'Vui lòng nhập số điện thoại.');
  if (!data.email) pushError(errors, 'email', 'Vui lòng nhập email.');

  if (data.phone && !/^0\d{9}$/.test(data.phone)) {
    pushError(errors, 'phone', 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    pushError(errors, 'email', 'Email không hợp lệ.');
  }

  if (!SUPPLIER_STATUSES.includes(data.status)) {
    pushError(errors, 'status', 'Trạng thái nhà cung cấp không hợp lệ.');
  }

  Object.entries(data).forEach(([field, value]) => assertLength(errors, field, value));

  return {
    valid: Object.keys(errors).length === 0,
    data,
    errors,
  };
}

export function normalizeSupplierListQuery(query = {}) {
  const status = normalizeSupplierStatus(query.status ?? 'ALL', 'ALL');
  const sortByRaw = String(query.sortBy || 'CreatedAt').trim();
  const sortBy = sortByRaw.toLowerCase() === 'suppliername' ? 'SupplierName' : 'CreatedAt';
  const sortOrder = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  return {
    search: toText(query.search),
    status: SUPPLIER_STATUSES.includes(status) ? status : 'ALL',
    sortBy,
    sortOrder,
    page: Math.max(1, Number.parseInt(query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(100, Number.parseInt(query.pageSize, 10) || 10)),
  };
}

export function normalizeImportRow(row = {}) {
  return {
    supplierName: row.supplierName ?? row.SupplierName ?? row.name ?? '',
    representativeName: row.representativeName ?? row.RepresentativeName ?? '',
    phone: row.phone ?? row.Phone ?? '',
    email: row.email ?? row.Email ?? '',
    address: row.address ?? row.Address ?? '',
    note: row.note ?? row.Note ?? '',
    status: row.status ?? row.Status ?? 'ACTIVE',
  };
}
