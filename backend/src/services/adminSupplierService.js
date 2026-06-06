import fs from 'node:fs';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  countSupplierReceipts,
  createSupplier as createSupplierRecord,
  findSupplierByEmail,
  findSupplierByPhone,
  getSupplierById,
  getSupplierDetail,
  getSupplierStatistics,
  listSuppliers as listSupplierRecords,
  listSuppliersForExport,
  softDeleteSupplier,
  updateSupplier as updateSupplierRecord,
} from '../repositories/adminSupplierRepository.js';
import {
  normalizeImportRow,
  normalizeSupplierListQuery,
  stripVietnameseAccents,
  validateSupplierId,
  validateSupplierPayload,
} from '../validators/supplierValidator.js';

export class SupplierServiceError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = 'SupplierServiceError';
    this.status = status;
    this.details = details;
  }
}

const STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Tạm ngưng',
};

const IMPORT_HEADER_ALIASES = {
  supplierName: ['suppliername', 'tennhacungcap', 'tenncc', 'nhacungcap', 'name'],
  representativeName: ['representativename', 'nguoidaidien', 'daidien', 'contactname'],
  phone: ['phone', 'sodienthoai', 'dienthoai', 'sdt'],
  email: ['email', 'mail'],
  address: ['address', 'diachi'],
  note: ['note', 'ghichu'],
  status: ['status', 'trangthai'],
};

function formatCurrency(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
}

function getCellText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || '').join('').trim();
    if (value.text) return String(value.text).trim();
    if (value.result !== undefined) return getCellText(value.result);
    if (value.hyperlink && value.text) return String(value.text).trim();
    if (value instanceof Date) return value.toISOString();
  }
  return String(value).trim();
}

function normalizeHeader(value) {
  return stripVietnameseAccents(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildImportHeaderMap(headerRow) {
  const headersByIndex = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    headersByIndex[columnNumber] = normalizeHeader(getCellText(cell.value));
  });

  const fieldByColumn = {};
  for (const [field, aliases] of Object.entries(IMPORT_HEADER_ALIASES)) {
    const match = Object.entries(headersByIndex).find(([, header]) => aliases.includes(header));
    if (match) fieldByColumn[Number(match[0])] = field;
  }
  return fieldByColumn;
}

function readImportRow(row, fieldByColumn) {
  const data = {};
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    const field = fieldByColumn[columnNumber];
    if (field) data[field] = getCellText(cell.value);
  });
  return normalizeImportRow(data);
}

function isImportRowEmpty(rowData) {
  return Object.values(rowData).every((value) => !String(value ?? '').trim());
}

async function assertSupplierUnique(data, excludeId = null) {
  const [emailMatch, phoneMatch] = await Promise.all([
    findSupplierByEmail(data.email, excludeId),
    findSupplierByPhone(data.phone, excludeId),
  ]);

  const fields = {};
  if (emailMatch) fields.email = ['Email đã được dùng cho nhà cung cấp khác.'];
  if (phoneMatch) fields.phone = ['Số điện thoại đã được dùng cho nhà cung cấp khác.'];

  if (Object.keys(fields).length) {
    throw new SupplierServiceError(409, 'Nhà cung cấp đã tồn tại.', { fields });
  }
}

export async function listSuppliers(params = {}) {
  return listSupplierRecords(normalizeSupplierListQuery(params));
}

export async function getSupplier(id) {
  const parsed = validateSupplierId(id);
  if (!parsed.valid) throw new SupplierServiceError(400, parsed.message);
  const detail = await getSupplierDetail(parsed.supplierId);
  if (!detail) throw new SupplierServiceError(404, 'Không tìm thấy nhà cung cấp.');
  return detail;
}

export async function getStatistics() {
  return getSupplierStatistics();
}

export async function createSupplier(payload, adminId = null) {
  const parsed = validateSupplierPayload(payload);
  if (!parsed.valid) {
    throw new SupplierServiceError(400, 'Dữ liệu nhà cung cấp không hợp lệ.', { fields: parsed.errors });
  }

  await assertSupplierUnique(parsed.data);
  return createSupplierRecord(parsed.data, adminId);
}

export async function updateSupplier(id, payload, adminId = null) {
  const parsedId = validateSupplierId(id);
  if (!parsedId.valid) throw new SupplierServiceError(400, parsedId.message);

  const existing = await getSupplierById(parsedId.supplierId);
  if (!existing) throw new SupplierServiceError(404, 'Không tìm thấy nhà cung cấp.');

  const parsed = validateSupplierPayload(payload);
  if (!parsed.valid) {
    throw new SupplierServiceError(400, 'Dữ liệu nhà cung cấp không hợp lệ.', { fields: parsed.errors });
  }

  await assertSupplierUnique(parsed.data, parsedId.supplierId);
  const statusChanged = existing.status !== parsed.data.status;
  const supplier = await updateSupplierRecord(
    parsedId.supplierId,
    parsed.data,
    adminId,
    statusChanged ? 'STATUS_CHANGE' : 'UPDATE'
  );

  return { supplier, oldSupplier: existing, action: statusChanged ? 'SUPPLIER_STATUS_CHANGE' : 'SUPPLIER_UPDATE' };
}

export async function deleteSupplier(id, adminId = null) {
  const parsed = validateSupplierId(id);
  if (!parsed.valid) throw new SupplierServiceError(400, parsed.message);

  const existing = await getSupplierById(parsed.supplierId);
  if (!existing) throw new SupplierServiceError(404, 'Không tìm thấy nhà cung cấp.');

  const totalReceipts = await countSupplierReceipts(parsed.supplierId);
  if (totalReceipts > 0) {
    throw new SupplierServiceError(409, 'Không thể xóa nhà cung cấp vì đã phát sinh phiếu nhập hàng.', {
      totalReceipts,
    });
  }

  return softDeleteSupplier(parsed.supplierId, adminId);
}

function decorateWorksheet(worksheet) {
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3A2419' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  worksheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 24 : 22;
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5DACB' } },
        left: { style: 'thin', color: { argb: 'FFE5DACB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5DACB' } },
        right: { style: 'thin', color: { argb: 'FFE5DACB' } },
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });
}

export async function exportSuppliersExcel(params = {}) {
  const filters = normalizeSupplierListQuery(params);
  const suppliers = await listSuppliersForExport(filters);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HuyPerfume Admin';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Nha cung cap');

  worksheet.columns = [
    { header: 'Mã NCC', key: 'supplierCode', width: 14 },
    { header: 'Tên nhà cung cấp', key: 'supplierName', width: 28 },
    { header: 'Người đại diện', key: 'representativeName', width: 24 },
    { header: 'Số điện thoại', key: 'phone', width: 16 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Địa chỉ', key: 'address', width: 42 },
    { header: 'Trạng thái', key: 'status', width: 18 },
    { header: 'Ngày tạo', key: 'createdAt', width: 16 },
  ];

  suppliers.forEach((supplier) => {
    worksheet.addRow({
      ...supplier,
      status: STATUS_LABELS[supplier.status] || supplier.status,
      createdAt: formatDate(supplier.createdAt),
    });
  });

  decorateWorksheet(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(buffer),
    filename: `huyperfume-suppliers-${Date.now()}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function registerPdfFont(doc) {
  const candidates = [
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/tahoma.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ];
  const fontPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (fontPath) {
    doc.registerFont('regular', fontPath);
    doc.font('regular');
  }
}

export async function exportSuppliersPdf(params = {}) {
  const filters = normalizeSupplierListQuery(params);
  const suppliers = await listSuppliersForExport(filters);
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  registerPdfFont(doc);

  const chunks = [];
  const finished = new Promise((resolve) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(18).fillColor('#3a2419').text('Danh sách nhà cung cấp HuyPerfume', { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(9).fillColor('#7a6958').text(`Xuất lúc ${new Date().toLocaleString('vi-VN')} · ${suppliers.length} nhà cung cấp`, {
    align: 'center',
  });
  doc.moveDown(1);

  suppliers.forEach((supplier, index) => {
    if (doc.y > 735) doc.addPage();
    const top = doc.y;
    doc.roundedRect(36, top, 523, 58, 6).fillAndStroke(index % 2 ? '#fffaf1' : '#ffffff', '#e4d6c3');
    doc.fillColor('#3a2419').fontSize(11).text(`${supplier.supplierCode} · ${supplier.supplierName}`, 48, top + 9, { width: 360 });
    doc.fillColor('#7a6958').fontSize(9).text(`${supplier.email} · ${supplier.phone}`, 48, top + 28, { width: 330 });
    doc.text(supplier.address || 'Chưa cập nhật địa chỉ', 48, top + 42, { width: 330 });
    doc.fillColor(supplier.status === 'ACTIVE' ? '#58711e' : '#9d5b47')
      .fontSize(9)
      .text(STATUS_LABELS[supplier.status] || supplier.status, 430, top + 12, { width: 110, align: 'right' });
    doc.fillColor('#7a6958').text(formatDate(supplier.createdAt), 430, top + 31, { width: 110, align: 'right' });
    doc.y = top + 68;
  });

  if (suppliers.length === 0) {
    doc.fillColor('#7a6958').fontSize(11).text('Không có nhà cung cấp phù hợp với bộ lọc hiện tại.', { align: 'center' });
  }

  doc.end();
  return {
    buffer: await finished,
    filename: `huyperfume-suppliers-${Date.now()}.pdf`,
    contentType: 'application/pdf',
  };
}

export async function importSuppliersExcel(file, adminId = null) {
  if (!file?.buffer) {
    throw new SupplierServiceError(400, 'Vui lòng chọn file Excel để import.');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new SupplierServiceError(400, 'File Excel không có sheet dữ liệu.');

  const fieldByColumn = buildImportHeaderMap(worksheet.getRow(1));
  if (!Object.values(fieldByColumn).includes('supplierName') || !Object.values(fieldByColumn).includes('phone') || !Object.values(fieldByColumn).includes('email')) {
    throw new SupplierServiceError(400, 'File Excel cần có cột Tên nhà cung cấp, Số điện thoại và Email.');
  }

  const seenEmails = new Set();
  const seenPhones = new Set();
  const errors = [];
  let totalRows = 0;
  let successRows = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const rowData = readImportRow(worksheet.getRow(rowNumber), fieldByColumn);
    if (isImportRowEmpty(rowData)) continue;
    totalRows += 1;

    const parsed = validateSupplierPayload(rowData);
    const rowErrors = [];
    if (!parsed.valid) {
      Object.values(parsed.errors).forEach((messages) => rowErrors.push(...messages));
    } else {
      if (seenEmails.has(parsed.data.email)) rowErrors.push('Email bị trùng trong file import.');
      if (seenPhones.has(parsed.data.phone)) rowErrors.push('Số điện thoại bị trùng trong file import.');
    }

    if (rowErrors.length) {
      errors.push({ row: rowNumber, supplierName: rowData.supplierName || '', errors: rowErrors });
      continue;
    }

    try {
      await createSupplier(parsed.data, adminId);
      seenEmails.add(parsed.data.email);
      seenPhones.add(parsed.data.phone);
      successRows += 1;
    } catch (error) {
      const fieldMessages = error?.details?.fields
        ? Object.values(error.details.fields).flat()
        : [error.message || 'Không import được nhà cung cấp.'];
      errors.push({ row: rowNumber, supplierName: rowData.supplierName || '', errors: fieldMessages });
    }
  }

  return {
    totalRows,
    successRows,
    failedRows: totalRows - successRows,
    errors: errors.slice(0, 100),
    limitedErrors: errors.length > 100,
  };
}
