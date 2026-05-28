import { getOrderStatusLabel, getOrderStatusTone } from '../../constants/orderStatus';

export function formatAdminCurrency(value) {
  return `₫${Math.round(Number(value || 0)).toLocaleString('vi-VN')}`;
}

export function formatAdminDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
}

export function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="admin-page-header">
      <div>
        <span className="admin-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="admin-page-actions">{action}</div>}
    </header>
  );
}

export function AdminStatGrid({ items }) {
  return (
    <section className="admin-kpi-grid" aria-label="Tổng quan">
      {items.map((item) => (
        <article className={`admin-kpi-card ${item.tone || ''}`} key={item.label}>
          {item.icon && <span className="admin-kpi-icon" aria-hidden="true">{item.icon}</span>}
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.hint && <small>{item.hint}</small>}
        </article>
      ))}
    </section>
  );
}

export function AdminPagination({ page, totalPages, totalElements, onChange }) {
  if (!totalPages || totalPages <= 1) {
    return <p className="admin-results-note">{Number(totalElements || 0).toLocaleString('vi-VN')} kết quả</p>;
  }

  return (
    <footer className="admin-pagination">
      <span>{Number(totalElements || 0).toLocaleString('vi-VN')} kết quả · Trang {page}/{totalPages}</span>
      <div>
        <button type="button" className="btn btn-outline-dark btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Trước
        </button>
        <button type="button" className="btn btn-outline-dark btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Sau
        </button>
      </div>
    </footer>
  );
}

export function AdminEmptyState({ title, description }) {
  return (
    <div className="admin-empty-state">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

export function AdminStatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase();
  const labelMap = {
    active: 'Đang hiển thị',
    disabled: 'Đã ẩn',
    locked: 'Đã khóa',
    pending_verification: 'Chờ xác minh',
  };
  const fallbackTone = ['active'].includes(normalized)
    ? 'positive'
    : ['pending_verification'].includes(normalized)
      ? 'progress'
      : ['disabled', 'locked'].includes(normalized)
        ? 'negative'
        : 'neutral';
  const label = labelMap[normalized] || getOrderStatusLabel(status);
  const tone = labelMap[normalized] ? fallbackTone : getOrderStatusTone(status);
  return <span className={`admin-status-badge ${tone}`}>{label}</span>;
}

export function AdminQuickNav({ items }) {
  return (
    <nav className="admin-quick-nav" aria-label="Điều hướng nhanh admin">
      {items.map((item) => (
        <a key={item.to} href={item.to} className={`admin-quick-nav-link${item.active ? ' active' : ''}`}>
          <strong>{item.label}</strong>
          {item.description && <small>{item.description}</small>}
        </a>
      ))}
    </nav>
  );
}
