import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatGrid,
  formatAdminDate,
} from '../components/Admin/AdminUi';
import {
  createSupplier,
  deleteSupplier,
  exportSuppliersExcel,
  exportSuppliersPdf,
  getSupplierDetail,
  getSupplierStatistics,
  getSuppliers,
  importSuppliersExcel,
  updateSupplier,
  type Supplier,
  type SupplierDetailResponse,
  type SupplierImportResult,
  type SupplierPayload,
  type SupplierStatistics,
  type SupplierStatus,
} from '../services/adminSupplierApi';
import { useToast } from '../store/ToastContext';

const PAGE_SIZE = 10;
const DEFAULT_FILTERS = {
  search: '',
  status: 'ALL' as SupplierStatus | 'ALL',
  sortBy: 'CreatedAt' as 'SupplierName' | 'CreatedAt',
  sortOrder: 'desc' as 'asc' | 'desc',
};

const EMPTY_FORM: SupplierPayload = {
  supplierName: '',
  representativeName: '',
  phone: '',
  email: '',
  address: '',
  note: '',
  status: 'ACTIVE',
};

const STATUS_OPTIONS: Array<{ value: SupplierStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Tạm ngưng' },
];

function formatCurrency(value: unknown) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`;
}

function formatNumber(value: unknown) {
  return Math.round(Number(value || 0)).toLocaleString('vi-VN');
}

function initials(value: string) {
  return String(value || '?').trim().charAt(0).toUpperCase();
}

function getStatusLabel(status: string) {
  return status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng';
}

function getStatusClass(status: string) {
  return status === 'ACTIVE' ? 'positive' : 'negative';
}

function extractFieldErrors(error: any): Record<string, string[]> {
  return error?.response?.data?.data?.fields || {};
}

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function validateForm(payload: SupplierPayload) {
  const errors: Record<string, string[]> = {};
  const phone = String(payload.phone || '').replace(/[\s().-]/g, '');
  if (!payload.supplierName.trim()) errors.supplierName = ['Vui lòng nhập tên nhà cung cấp.'];
  if (!payload.email.trim()) errors.email = ['Vui lòng nhập email.'];
  if (!payload.phone.trim()) errors.phone = ['Vui lòng nhập số điện thoại.'];
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    errors.email = ['Email không hợp lệ.'];
  }
  if (payload.phone && !/^(\+?84|0)\d{9}$/.test(phone)) {
    errors.phone = ['Số điện thoại phải có 10 chữ số và bắt đầu bằng 0 hoặc +84.'];
  }
  return errors;
}

function SupplierStatusBadge({ status }: { status: string }) {
  return <span className={`admin-status-badge ${getStatusClass(status)}`}>{getStatusLabel(status)}</span>;
}

function SupplierModalShell({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="admin-supplier-modal-backdrop" role="presentation">
      <section className="admin-supplier-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="admin-supplier-modal-head">
          <div>
            <span className="admin-eyebrow">Nhà cung cấp</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="admin-supplier-modal-close" aria-label="Đóng" onClick={onClose}>
            x
          </button>
        </header>
        <div className="admin-supplier-modal-body">{children}</div>
        {footer && <footer className="admin-supplier-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function AdminSuppliersPage() {
  const { pushToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [statistics, setStatistics] = useState<SupplierStatistics>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalImportValue: 0,
    topSuppliersByImportValue: [],
    monthlyImportValues: [],
  });
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail' | 'importResult' | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detail, setDetail] = useState<SupplierDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SupplierPayload>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [importResult, setImportResult] = useState<SupplierImportResult | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const [listData, statsData] = await Promise.all([
        getSuppliers({ page, pageSize: PAGE_SIZE, ...appliedFilters }),
        getSupplierStatistics(),
      ]);
      setSuppliers(Array.isArray(listData.items) ? listData.items : []);
      setPagination(listData.pagination || { page, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 });
      setStatistics(statsData);
    } catch (requestError: any) {
      const message = getErrorMessage(requestError, 'Không tải được dữ liệu nhà cung cấp.');
      setError(message);
      pushToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, [page, appliedFilters]);

  const stats = useMemo(() => ([
    { label: 'Nhà cung cấp', value: formatNumber(statistics.totalSuppliers), hint: 'Tổng hồ sơ NCC', icon: 'NCC' },
    { label: 'Đang hoạt động', value: formatNumber(statistics.activeSuppliers), hint: 'Sẵn sàng cung ứng', tone: 'positive', icon: 'ON' },
    { label: 'Tạm ngưng', value: formatNumber(statistics.inactiveSuppliers), hint: 'Không dùng để nhập hàng', tone: 'warning', icon: 'OFF' },
    { label: 'Giá trị nhập', value: formatCurrency(statistics.totalImportValue), hint: 'Tổng phiếu nhập ghi nhận', icon: 'VNĐ' },
  ]), [statistics]);

  const maxTopValue = Math.max(...statistics.topSuppliersByImportValue.map((item) => Number(item.totalImportValue || 0)), 1);
  const maxMonthlyValue = Math.max(...statistics.monthlyImportValues.map((item) => Number(item.totalValue || 0)), 1);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSelectedSupplier(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
  };

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setForm({
      supplierName: supplier.supplierName || '',
      representativeName: supplier.representativeName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      note: supplier.note || '',
      status: supplier.status || 'ACTIVE',
    });
    setFieldErrors({});
    setModalMode('edit');
  };

  const openDetailModal = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetail(null);
    setDetailLoading(true);
    setModalMode('detail');
    try {
      setDetail(await getSupplierDetail(supplier.supplierId));
    } catch (requestError: any) {
      pushToast(getErrorMessage(requestError, 'Không tải được chi tiết nhà cung cấp.'), 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSupplier(null);
    setDetail(null);
    setFieldErrors({});
  };

  const updateForm = (field: keyof SupplierPayload, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'status' ? value as SupplierStatus : value,
    }));
    setFieldErrors((current) => ({ ...current, [field]: [] }));
  };

  const renderFieldError = (field: keyof SupplierPayload) => {
    const messages = fieldErrors[field];
    if (!messages?.length) return null;
    return <small className="admin-supplier-field-error">{messages[0]}</small>;
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clientErrors = validateForm(form);
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      pushToast('Vui lòng kiểm tra lại thông tin nhà cung cấp.', 'error');
      return;
    }

    setActionBusy(true);
    try {
      if (modalMode === 'edit' && selectedSupplier) {
        await updateSupplier(selectedSupplier.supplierId, form);
        pushToast('Đã cập nhật nhà cung cấp.', 'success');
      } else {
        await createSupplier(form);
        pushToast('Đã tạo nhà cung cấp mới.', 'success');
      }
      closeModal();
      await loadSuppliers();
    } catch (requestError: any) {
      const serverErrors = extractFieldErrors(requestError);
      setFieldErrors(serverErrors);
      pushToast(getErrorMessage(requestError, 'Không lưu được nhà cung cấp.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const removeSupplier = async (supplier: Supplier) => {
    if (!window.confirm(`Xóa nhà cung cấp ${supplier.supplierName}?`)) return;
    setActionBusy(true);
    try {
      await deleteSupplier(supplier.supplierId);
      pushToast('Đã xóa nhà cung cấp.', 'success');
      await loadSuppliers();
    } catch (requestError: any) {
      pushToast(getErrorMessage(requestError, 'Không xóa được nhà cung cấp.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const exportFile = async (type: 'excel' | 'pdf') => {
    setActionBusy(true);
    try {
      const blob = type === 'excel'
        ? await exportSuppliersExcel(appliedFilters)
        : await exportSuppliersPdf(appliedFilters);
      saveBlob(blob, `huyperfume-nha-cung-cap.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      pushToast(type === 'excel' ? 'Đã xuất Excel nhà cung cấp.' : 'Đã xuất PDF nhà cung cấp.', 'success');
    } catch (requestError: any) {
      pushToast(getErrorMessage(requestError, 'Không xuất được file nhà cung cấp.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setActionBusy(true);
    try {
      const result = await importSuppliersExcel(file);
      setImportResult(result);
      setModalMode('importResult');
      pushToast(`Import xong: ${result.successRows}/${result.totalRows} dòng thành công.`, result.failedRows ? 'info' : 'success');
      await loadSuppliers();
    } catch (requestError: any) {
      pushToast(getErrorMessage(requestError, 'Không import được file nhà cung cấp.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="admin-page admin-supplier-page">
      <AdminPageHeader
        eyebrow="Đối tác cung ứng"
        title="Quản lý nhà cung cấp"
        description="Theo dõi hồ sơ nhà cung cấp, trạng thái hợp tác, dữ liệu nhập hàng và lịch sử cập nhật cho vận hành HuyPerfume."
        action={(
          <div className="admin-page-action-row">
            <input ref={fileInputRef} type="file" accept=".xlsx" hidden onChange={handleImportFile} />
            <button type="button" className="btn btn-outline-dark" disabled={actionBusy} onClick={() => fileInputRef.current?.click()}>
              Import Excel
            </button>
            <button type="button" className="btn btn-outline-dark" disabled={actionBusy} onClick={() => exportFile('excel')}>
              Xuất Excel
            </button>
            <button type="button" className="btn btn-outline-dark" disabled={actionBusy} onClick={() => exportFile('pdf')}>
              Xuất PDF
            </button>
            <button type="button" className="btn luxury-primary-btn" onClick={openCreateModal}>
              Thêm nhà cung cấp
            </button>
          </div>
        )}
      />

      <AdminStatGrid items={stats} />

      <section className="admin-supplier-dashboard">
        <article className="admin-surface-card admin-supplier-insight">
          <div className="admin-table-title">
            <div>
              <span className="admin-eyebrow">Top nhập hàng</span>
              <h2>Nhà cung cấp nổi bật</h2>
            </div>
          </div>
          <div className="admin-supplier-bar-list">
            {statistics.topSuppliersByImportValue.length === 0 ? (
              <p className="admin-supplier-muted">Chưa có phiếu nhập hàng để thống kê.</p>
            ) : statistics.topSuppliersByImportValue.map((item) => (
              <div className="admin-supplier-bar-row" key={item.supplierId}>
                <span>{item.supplierName}</span>
                <strong>{formatCurrency(item.totalImportValue)}</strong>
                <i style={{ width: `${Math.max(8, (Number(item.totalImportValue || 0) / maxTopValue) * 100)}%` }} />
              </div>
            ))}
          </div>
        </article>

        <article className="admin-surface-card admin-supplier-insight">
          <div className="admin-table-title">
            <div>
              <span className="admin-eyebrow">12 tháng</span>
              <h2>Giá trị nhập hàng</h2>
            </div>
          </div>
          <div className="admin-supplier-month-bars">
            {statistics.monthlyImportValues.length === 0 ? (
              <p className="admin-supplier-muted">Chưa có dữ liệu nhập hàng theo tháng.</p>
            ) : statistics.monthlyImportValues.map((item) => (
              <div className="admin-supplier-month" key={item.month} title={`${item.month}: ${formatCurrency(item.totalValue)}`}>
                <span style={{ height: `${Math.max(10, (Number(item.totalValue || 0) / maxMonthlyValue) * 100)}%` }} />
                <small>{item.month.slice(5)}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <form className="admin-filter-panel admin-supplier-filter-panel" onSubmit={applyFilters}>
        <div className="admin-filter-field grow">
          <label htmlFor="supplier-search">Tìm kiếm</label>
          <input
            id="supplier-search"
            className="form-control"
            value={filters.search}
            placeholder="Tên, mã NCC, email hoặc số điện thoại"
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="supplier-status">Trạng thái</label>
          <select
            id="supplier-status"
            className="form-select"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as SupplierStatus | 'ALL' }))}
          >
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="supplier-sort-by">Sắp xếp</label>
          <select
            id="supplier-sort-by"
            className="form-select"
            value={filters.sortBy}
            onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value as 'SupplierName' | 'CreatedAt' }))}
          >
            <option value="CreatedAt">Ngày tạo</option>
            <option value="SupplierName">Tên nhà cung cấp</option>
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="supplier-sort-order">Thứ tự</label>
          <select
            id="supplier-sort-order"
            className="form-select"
            value={filters.sortOrder}
            onChange={(event) => setFilters((current) => ({ ...current, sortOrder: event.target.value as 'asc' | 'desc' }))}
          >
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất / A-Z</option>
          </select>
        </div>
        <button type="submit" className="btn luxury-primary-btn">Lọc</button>
        <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>Xóa lọc</button>
      </form>

      {error && <div className="alert alert-danger admin-alert">{error}</div>}

      <section className="admin-table-panel admin-supplier-table-panel">
        <div className="admin-table-title">
          <div>
            <span className="admin-eyebrow">Danh sách</span>
            <h2>Hồ sơ nhà cung cấp</h2>
          </div>
          <strong className="admin-supplier-count">{formatNumber(pagination.totalItems)} NCC</strong>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="spinner-border" /> Đang tải nhà cung cấp...</div>
        ) : suppliers.length === 0 ? (
          <AdminEmptyState title="Chưa có nhà cung cấp" description="Thêm nhà cung cấp mới hoặc điều chỉnh bộ lọc để xem dữ liệu phù hợp." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table admin-table admin-supplier-table align-middle">
                <thead>
                  <tr>
                    <th>Nhà cung cấp</th>
                    <th>Liên hệ</th>
                    <th>Người đại diện</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.supplierId}>
                      <td>
                        <div className="admin-supplier-name-cell">
                          <span>{initials(supplier.supplierName)}</span>
                          <div>
                            <strong>{supplier.supplierName}</strong>
                            <small>{supplier.supplierCode}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-contact-cell">
                          <span>{supplier.email}</span>
                          <small>{supplier.phone}</small>
                        </div>
                      </td>
                      <td>{supplier.representativeName || '-'}</td>
                      <td><SupplierStatusBadge status={supplier.status} /></td>
                      <td>{formatAdminDate(supplier.createdAt)}</td>
                      <td>
                        <div className="admin-row-actions justify-content-end">
                          <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => openDetailModal(supplier)}>
                            Chi tiết
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => openEditModal(supplier)}>
                            Sửa
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled={actionBusy} onClick={() => removeSupplier(supplier)}>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalItems}
              onChange={setPage}
            />
          </>
        )}
      </section>

      {(modalMode === 'create' || modalMode === 'edit') && (
        <SupplierModalShell
          title={modalMode === 'edit' ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp'}
          onClose={closeModal}
          footer={(
            <>
              <button type="button" className="btn btn-outline-dark" onClick={closeModal}>Hủy</button>
              <button type="submit" form="supplier-form" className="btn luxury-primary-btn" disabled={actionBusy}>
                {actionBusy ? 'Đang lưu...' : 'Lưu nhà cung cấp'}
              </button>
            </>
          )}
        >
          <form id="supplier-form" className="admin-supplier-form" onSubmit={submitForm}>
            <div className="admin-supplier-form-grid">
              <label>
                <span>Tên nhà cung cấp *</span>
                <input className="form-control" value={form.supplierName} onChange={(event) => updateForm('supplierName', event.target.value)} />
                {renderFieldError('supplierName')}
              </label>
              <label>
                <span>Người đại diện</span>
                <input className="form-control" value={form.representativeName || ''} onChange={(event) => updateForm('representativeName', event.target.value)} />
                {renderFieldError('representativeName')}
              </label>
              <label>
                <span>Số điện thoại *</span>
                <input className="form-control" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} />
                {renderFieldError('phone')}
              </label>
              <label>
                <span>Email *</span>
                <input className="form-control" type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
                {renderFieldError('email')}
              </label>
              <label>
                <span>Trạng thái</span>
                <select className="form-select" value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
                {renderFieldError('status')}
              </label>
              <label className="admin-supplier-field-wide">
                <span>Địa chỉ</span>
                <input className="form-control" value={form.address || ''} onChange={(event) => updateForm('address', event.target.value)} />
                {renderFieldError('address')}
              </label>
              <label className="admin-supplier-field-wide">
                <span>Ghi chú</span>
                <textarea className="form-control" rows={3} value={form.note || ''} onChange={(event) => updateForm('note', event.target.value)} />
                {renderFieldError('note')}
              </label>
            </div>
          </form>
        </SupplierModalShell>
      )}

      {modalMode === 'detail' && selectedSupplier && (
        <SupplierModalShell title="Chi tiết nhà cung cấp" onClose={closeModal}>
          {detailLoading ? (
            <div className="admin-loading"><div className="spinner-border" /> Đang tải chi tiết...</div>
          ) : detail ? (
            <div className="admin-supplier-detail">
              <div className="admin-supplier-detail-card">
                <div className="admin-supplier-name-cell">
                  <span>{initials(detail.supplier.supplierName)}</span>
                  <div>
                    <strong>{detail.supplier.supplierName}</strong>
                    <small>{detail.supplier.supplierCode}</small>
                  </div>
                </div>
                <SupplierStatusBadge status={detail.supplier.status} />
              </div>

              <div className="admin-supplier-detail-grid">
                <article><span>Email</span><strong>{detail.supplier.email}</strong></article>
                <article><span>Số điện thoại</span><strong>{detail.supplier.phone}</strong></article>
                <article><span>Người đại diện</span><strong>{detail.supplier.representativeName || '-'}</strong></article>
                <article><span>Ngày tạo</span><strong>{formatAdminDate(detail.supplier.createdAt)}</strong></article>
                <article><span>Tổng phiếu nhập</span><strong>{formatNumber(detail.summary.totalReceipts)}</strong></article>
                <article><span>Giá trị nhập hàng</span><strong>{formatCurrency(detail.summary.totalImportValue)}</strong></article>
                <article><span>Lần nhập gần nhất</span><strong>{formatAdminDate(detail.summary.lastImportDate)}</strong></article>
                <article className="admin-supplier-detail-wide"><span>Địa chỉ</span><strong>{detail.supplier.address || '-'}</strong></article>
                <article className="admin-supplier-detail-wide"><span>Ghi chú</span><strong>{detail.supplier.note || '-'}</strong></article>
              </div>

              <div className="admin-supplier-history">
                <div className="admin-table-title">
                  <div>
                    <span className="admin-eyebrow">Audit</span>
                    <h3>Lịch sử cập nhật</h3>
                  </div>
                </div>
                {detail.histories.length === 0 ? (
                  <p className="admin-supplier-muted">Chưa có lịch sử cập nhật.</p>
                ) : detail.histories.map((history) => (
                  <div className="admin-supplier-history-row" key={history.historyId}>
                    <span>{history.actionType}</span>
                    <strong>{history.updatedByName || `Admin #${history.updatedBy || '-'}`}</strong>
                    <small>{formatAdminDate(history.updatedAt)}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <AdminEmptyState title="Không tải được chi tiết" description="Vui lòng đóng modal và thử lại." />
          )}
        </SupplierModalShell>
      )}

      {modalMode === 'importResult' && importResult && (
        <SupplierModalShell title="Kết quả import Excel" onClose={closeModal}>
          <div className="admin-supplier-import-result">
            <div className="admin-supplier-import-summary">
              <article><span>Tổng dòng</span><strong>{formatNumber(importResult.totalRows)}</strong></article>
              <article><span>Thành công</span><strong>{formatNumber(importResult.successRows)}</strong></article>
              <article><span>Không nhập được</span><strong>{formatNumber(importResult.failedRows)}</strong></article>
            </div>
            {importResult.errors.length > 0 ? (
              <div className="admin-supplier-import-errors">
                {importResult.errors.map((item) => (
                  <div key={`${item.row}-${item.supplierName}`}>
                    <strong>Dòng {item.row}{item.supplierName ? ` - ${item.supplierName}` : ''}</strong>
                    <span>{item.errors.join(' ')}</span>
                  </div>
                ))}
                {importResult.limitedErrors && <p>Chỉ hiển thị 100 lỗi đầu tiên.</p>}
              </div>
            ) : (
              <p className="admin-supplier-muted">Tất cả dòng dữ liệu hợp lệ đã được import.</p>
            )}
          </div>
        </SupplierModalShell>
      )}
    </div>
  );
}
