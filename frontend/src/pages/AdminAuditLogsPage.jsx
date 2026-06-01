import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { unwrapApiData } from '../services/api';
import { AdminPageHeader, AdminPagination } from '../components/Admin/AdminUi';

const INITIAL_FILTERS = {
  action: '',
  adminId: '',
  targetType: '',
  from: '',
  to: '',
};

const ACTION_OPTIONS = [
  'VOUCHER_CREATE',
  'VOUCHER_UPDATE',
  'VOUCHER_STATUS_UPDATE',
  'VOUCHER_DELETE',
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'PRODUCT_STATUS_UPDATE',
  'PRODUCT_DELETE',
  'PRODUCT_RESET_STOCK',
  'ORDER_STATUS_CHANGE',
  'USER_STATUS_UPDATE',
  'USER_ROLE_UPDATE',
];

const TARGET_OPTIONS = ['voucher', 'product', 'order', 'user'];

const ACTION_LABELS = {
  VOUCHER_CREATE: 'Tạo voucher',
  VOUCHER_UPDATE: 'Sửa voucher',
  VOUCHER_STATUS_UPDATE: 'Đổi trạng thái voucher',
  VOUCHER_DELETE: 'Xóa voucher',
  PRODUCT_CREATE: 'Tạo sản phẩm',
  PRODUCT_UPDATE: 'Sửa sản phẩm',
  PRODUCT_STATUS_UPDATE: 'Đổi trạng thái sản phẩm',
  PRODUCT_DELETE: 'Xóa sản phẩm',
  PRODUCT_RESET_STOCK: 'Cập nhật tồn kho',
  ORDER_STATUS_CHANGE: 'Đổi trạng thái đơn',
  USER_STATUS_UPDATE: 'Đổi trạng thái khách',
  USER_ROLE_UPDATE: 'Đổi quyền khách',
};

const FIELD_LABELS = {
  id: 'ID',
  code: 'Mã',
  name: 'Tên',
  discountType: 'Kiểu giảm',
  discountValue: 'Giá trị giảm',
  minOrderValue: 'Đơn tối thiểu',
  maxDiscountValue: 'Giảm tối đa',
  usageLimit: 'Số lượt dùng',
  usedCount: 'Đã dùng',
  startAt: 'Ngày bắt đầu',
  endAt: 'Ngày hết hạn',
  status: 'Trạng thái',
  stock: 'Tồn kho',
  note: 'Ghi chú',
  role: 'Vai trò',
  createdAt: 'Ngày tạo',
};

const MONEY_FIELDS = new Set(['discountValue', 'minOrderValue', 'maxDiscountValue', 'price', 'total']);
const DATE_FIELDS = new Set(['startAt', 'endAt', 'createdAt', 'updatedAt']);

function addOneDay(dateValue) {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function buildParams(page, pageSize, filters) {
  const params = { page, pageSize };
  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    params[key] = key === 'to' ? addOneDay(value) : value;
  });
  return params;
}

function parseAuditValue(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAuditValue(key, value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Bật' : 'Tắt';
  if (MONEY_FIELDS.has(key) && Number.isFinite(Number(value))) {
    return `${Math.round(Number(value)).toLocaleString('vi-VN')}đ`;
  }
  if (DATE_FIELDS.has(key)) return formatDateTime(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatTarget(targetType, targetId) {
  const label = targetType || 'unknown';
  return `${label}${targetId ? ` #${targetId}` : ''}`;
}

function getActionTone(action) {
  if (String(action).includes('DELETE')) return 'negative';
  if (String(action).includes('CREATE')) return 'positive';
  if (String(action).includes('STATUS') || String(action).includes('ROLE')) return 'progress';
  return 'neutral';
}

function AuditValuePanel({ title, value, emptyText }) {
  const parsed = parseAuditValue(value);

  if (!parsed) {
    return (
      <div className="admin-audit-value-panel muted">
        <strong>{title}</strong>
        <span>{emptyText}</span>
      </div>
    );
  }

  if (typeof parsed !== 'object') {
    return (
      <div className="admin-audit-value-panel">
        <strong>{title}</strong>
        <p>{String(parsed)}</p>
      </div>
    );
  }

  const entries = Object.entries(parsed).filter(([, itemValue]) => itemValue !== undefined);

  return (
    <div className="admin-audit-value-panel">
      <strong>{title}</strong>
      <div className="admin-audit-field-grid">
        {entries.map(([key, itemValue]) => (
          <div className="admin-audit-field" key={key}>
            <span>{FIELD_LABELS[key] || key}</span>
            <b>{formatAuditValue(key, itemValue)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLogCard({ item }) {
  const actionLabel = ACTION_LABELS[item.action] || item.action || 'Không rõ hành động';
  const target = formatTarget(item.targetType, item.targetId);
  const actor = item.adminName || item.adminEmail || item.adminId || '-';

  return (
    <article className="admin-audit-entry">
      <header className="admin-audit-entry-head">
        <div>
          <span className={`admin-status-badge ${getActionTone(item.action)}`}>{actionLabel}</span>
          <h3>{target}</h3>
        </div>
        <time>{formatDateTime(item.createdAt)}</time>
      </header>

      <div className="admin-audit-meta-row">
        <span><strong>Admin</strong>{actor}</span>
        <span><strong>Email</strong>{item.adminEmail || '-'}</span>
        <span><strong>IP</strong>{item.ipAddress || '-'}</span>
      </div>

      <div className="admin-audit-diff-grid">
        <AuditValuePanel title="Trước thay đổi" value={item.oldValue} emptyText="Không có dữ liệu cũ" />
        <AuditValuePanel title="Sau thay đổi" value={item.newValue} emptyText="Không có dữ liệu mới" />
      </div>

      {item.userAgent ? (
        <details className="admin-audit-agent">
          <summary>Thiết bị / trình duyệt</summary>
          <p>{item.userAgent}</p>
        </details>
      ) : null}
    </article>
  );
}

export function AdminAuditLogsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [meta, setMeta] = useState({ totalPages: 1, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/audit-logs', {
        params: buildParams(page, pageSize, appliedFilters),
      });
      const data = unwrapApiData(res.data) || {};
      setItems(Array.isArray(data.content) ? data.content : []);
      setMeta({ totalPages: data.totalPages || 1, totalElements: data.totalElements || 0 });
    } catch (err) {
      setItems([]);
      setError(err?.response?.data?.message || err?.message || 'Không tải được audit logs.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  useEffect(() => { void load(); }, [load]);

  const hasFilters = useMemo(() => Object.values(appliedFilters).some(Boolean), [appliedFilters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event) => {
    event?.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(1);
  };

  return (
    <div className="admin-page admin-audit-page">
      <AdminPageHeader
        eyebrow="Audit logs"
        title="Nhật ký hành động admin"
        description="Theo dõi thao tác quan trọng, dữ liệu trước/sau thay đổi và nguồn truy cập."
        action={(
          <div className="admin-audit-page-size">
            <span>Hiển thị</span>
            <select className="form-select" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size}/trang</option>)}
            </select>
          </div>
        )}
      />

      <form className="admin-filter-panel admin-audit-filters" onSubmit={applyFilters}>
        <label className="admin-filter-field grow">
          <span>Hành động</span>
          <select className="form-select" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)}>
            <option value="">Tất cả hành động</option>
            {ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>{ACTION_LABELS[action] || action}</option>
            ))}
          </select>
        </label>

        <label className="admin-filter-field">
          <span>Đối tượng</span>
          <select className="form-select" value={filters.targetType} onChange={(e) => updateFilter('targetType', e.target.value)}>
            <option value="">Tất cả</option>
            {TARGET_OPTIONS.map((target) => <option key={target} value={target}>{target}</option>)}
          </select>
        </label>

        <label className="admin-filter-field compact">
          <span>Admin ID</span>
          <input className="form-control" inputMode="numeric" value={filters.adminId} onChange={(e) => updateFilter('adminId', e.target.value)} placeholder="VD: 10" />
        </label>

        <label className="admin-filter-field">
          <span>Từ ngày</span>
          <input className="form-control" type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
        </label>

        <label className="admin-filter-field">
          <span>Đến ngày</span>
          <input className="form-control" type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
        </label>

        <div className="admin-audit-filter-actions">
          <button className="btn luxury-primary-btn" type="submit">Áp dụng</button>
          <button className="btn btn-outline-secondary" type="button" onClick={resetFilters}>Xóa lọc</button>
        </div>
      </form>

      {error && <div className="alert alert-danger admin-alert">{error}</div>}

      <section className="admin-audit-log-panel">
        <div className="admin-table-title admin-audit-title">
          <div>
            <span className="admin-eyebrow">Lịch sử</span>
            <h2>{Number(meta.totalElements || 0).toLocaleString('vi-VN')} bản ghi</h2>
          </div>
          {hasFilters ? <span className="admin-audit-filtered">Đang lọc</span> : null}
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="spinner-border" />
            Đang tải audit logs...
          </div>
        ) : items.length ? (
          <div className="admin-audit-list">
            {items.map((item) => <AuditLogCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="admin-empty-state">
            <strong>Chưa có audit log phù hợp</strong>
            <span>Thử đổi bộ lọc hoặc kiểm tra lại khoảng thời gian.</span>
          </div>
        )}

        <AdminPagination
          page={page}
          totalPages={meta.totalPages}
          totalElements={meta.totalElements}
          onChange={setPage}
        />
      </section>
    </div>
  );
}
