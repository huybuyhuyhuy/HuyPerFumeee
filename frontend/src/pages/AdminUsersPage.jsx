import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatGrid,
  AdminStatusBadge,
  formatAdminDate,
} from '../components/Admin/AdminUi';
import { formatVnd, getMembershipShortLabel, getMembershipTone } from '../utils/membership';

const PAGE_SIZE = 12;
const DEFAULT_FILTERS = { search: '', role: '', status: '', membershipTier: '' };
const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'USER', label: 'Khách hàng' },
  { value: 'STAFF', label: 'Nhân viên' },
  { value: 'ADMIN', label: 'Quản trị' },
];
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'LOCKED', label: 'LOCKED' },
  { value: 'DISABLED', label: 'DISABLED' },
];

const MEMBERSHIP_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'NORMAL', label: 'Khách hàng thường' },
  { value: 'BRONZE', label: 'Đồng' },
  { value: 'SILVER', label: 'Bạc' },
  { value: 'GOLD', label: 'Vàng' },
  { value: 'DIAMOND', label: 'Kim Cương' },
];

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function initials(value) {
  return String(value || '?').trim().charAt(0).toUpperCase();
}

function MembershipBadge({ tier }) {
  return (
    <span className={`admin-membership-badge ${getMembershipTone(tier)}`}>
      {getMembershipShortLabel(tier)}
    </span>
  );
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [features, setFeatures] = useState({ canManageStatus: false });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalElements: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/admin/users', { params: { page, pageSize: PAGE_SIZE, ...appliedFilters } })
      .then((res) => {
        const data = unwrapApiData(res.data) || {};
        setUsers(Array.isArray(data.content) ? data.content : []);
        setSummary(data.summary || {});
        setFeatures(data.features || { canManageStatus: false });
        setPagination({ page: Number(data.page || page), totalPages: Number(data.totalPages || 1), totalElements: Number(data.totalElements || 0) });
      })
      .catch((err) => setError(err?.message || 'Không tải được danh sách khách hàng.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, appliedFilters]);

  const stats = useMemo(() => ([
    { label: 'Tài khoản', value: Number(summary.total || 0).toLocaleString('vi-VN'), hint: 'Toàn hệ thống' },
    { label: 'Khách hàng', value: Number(summary.customers || 0).toLocaleString('vi-VN'), hint: 'Vai trò USER', tone: 'positive' },
    { label: 'Quản trị viên', value: Number(summary.admins || 0).toLocaleString('vi-VN'), hint: 'Vai trò ADMIN' },
    { label: 'Đang hoạt động', value: Number(summary.active || 0).toLocaleString('vi-VN'), hint: 'ACTIVE', tone: 'positive' },
    { label: 'Bị khóa', value: Number(summary.locked || 0).toLocaleString('vi-VN'), hint: 'LOCKED', tone: 'negative' },
  ]), [summary]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const updateUser = async (userId, endpoint, payload, successText) => {
    setBusy((state) => ({ ...state, [userId]: true }));
    setFeedback('');
    setError('');
    try {
      await api.patch(`/admin/users/${userId}/${endpoint}`, payload);
      setFeedback(successText);
      load();
    } catch (err) {
      setError(err?.message || 'Cập nhật thất bại.');
    } finally {
      setBusy((state) => ({ ...state, [userId]: false }));
    }
  };

  const toggleStatus = (account) => {
    const nextStatus = account.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    const verb = nextStatus === 'LOCKED' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn chắc chắn muốn ${verb} ${account.name || account.email}?`)) return;
    updateUser(account.id, 'status', { status: nextStatus }, `Đã ${verb} tài khoản ${account.name || account.email}.`);
  };

  const changeRole = (account) => {
    const nextRole = window.prompt('Nhập vai trò mới (USER, STAFF, ADMIN):', account.role || 'USER');
    if (!nextRole) return;
    updateUser(account.id, 'role', { role: nextRole.toUpperCase() }, `Đã đổi vai trò của ${account.name || account.email}.`);
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Khách hàng & tài khoản"
        title="Quản lý khách hàng HuyPerFumeee"
        description="Tìm nhanh theo tên, email, số điện thoại; kiểm soát vai trò, trạng thái và truy cập chi tiết khách hàng."
        action={<button type="button" className="btn btn-outline-dark" onClick={load}>Làm mới dữ liệu</button>}
      />

      <AdminStatGrid items={stats} />

      <form className="admin-filter-panel" onSubmit={applyFilters}>
        <div className="admin-filter-field grow">
          <label htmlFor="admin-user-search">Tìm khách hàng</label>
          <input id="admin-user-search" className="form-control" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Tên, email hoặc số điện thoại" />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-user-role">Vai trò</label>
          <select id="admin-user-role" className="form-select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            {ROLE_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-user-status">Trạng thái</label>
          <select id="admin-user-status" className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            {STATUS_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-user-membership">Hạng thành viên</label>
          <select id="admin-user-membership" className="form-select" value={filters.membershipTier} onChange={(e) => setFilters({ ...filters, membershipTier: e.target.value })}>
            {MEMBERSHIP_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <button className="btn luxury-primary-btn" type="submit">Lọc</button>
        <button className="btn btn-outline-dark" type="button" onClick={clearFilters}>Xóa lọc</button>
      </form>

      {error && <div className="alert alert-danger admin-alert">{error}</div>}
      {feedback && <div className="alert alert-success admin-alert">{feedback}</div>}

      <section className="admin-table-panel">
        {loading ? <div className="admin-loading"><div className="spinner-border" /> Đang tải khách hàng...</div> : users.length === 0 ? (
          <AdminEmptyState title="Không tìm thấy khách hàng" description="Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc vai trò/trạng thái." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table admin-table align-middle">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Tổng đơn</th>
                    <th>Tổng chi tiêu</th>
                    <th>Hạng thành viên</th>
                    <th>Ngày tạo</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <div className="admin-user-cell">
                          <span>{initials(account.name || account.email)}</span>
                          <div><strong>{account.name || '-'}</strong><small>#{account.id}</small></div>
                        </div>
                      </td>
                      <td><div className="admin-contact-cell"><span>{account.email}</span><small>{account.phone || '-'}</small></div></td>
                      <td><span className="admin-role-badge">{account.role}</span></td>
                      <td><AdminStatusBadge status={account.status} /></td>
                      <td>{Number(account.totalOrders || 0).toLocaleString('vi-VN')}</td>
                      <td><strong className="admin-money-value">{formatVnd(account.totalSpent)}</strong></td>
                      <td><MembershipBadge tier={account.membershipTier} /></td>
                      <td>{formatAdminDate(account.created_at)}</td>
                      <td>
                        <div className="admin-row-actions justify-content-end">
                          <Link to={`/admin/users/${account.id}`} className="btn btn-sm btn-outline-dark">Xem chi tiết</Link>
                          <Link to={`/admin/orders?userId=${account.id}&userName=${encodeURIComponent(account.name || account.email || '')}`} className="btn btn-sm btn-outline-dark">Xem đơn</Link>
                          {features.canManageStatus && Number(currentUser?.id) !== Number(account.id) && (
                            <button type="button" className="btn btn-sm btn-outline-dark" disabled={busy[account.id]} onClick={() => toggleStatus(account)}>{account.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}</button>
                          )}
                          {features.canManageStatus && Number(currentUser?.id) !== Number(account.id) && (
                            <button type="button" className="btn btn-sm btn-outline-dark" disabled={busy[account.id]} onClick={() => changeRole(account)}>Đổi role</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination {...pagination} onChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}
