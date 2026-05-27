import { useEffect, useState } from 'react';
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

const PAGE_SIZE = 12;
const DEFAULT_FILTERS = { search: '', role: '', status: '' };

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
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
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/users', { params: { page, pageSize: PAGE_SIZE, ...appliedFilters } })
      .then((res) => {
        const data = unwrapApiData(res.data) || {};
        setUsers(Array.isArray(data.content) ? data.content : []);
        setSummary(data.summary || {});
        setFeatures(data.features || { canManageStatus: false });
        setPagination({
          page: Number(data.page || page),
          totalPages: Number(data.totalPages || 1),
          totalElements: Number(data.totalElements || 0),
        });
      })
      .catch((err) => setError(err?.message || 'Không tải được danh sách người dùng.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, appliedFilters]);

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

  const toggleAccountStatus = async (account) => {
    const nextStatus = account.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    const verb = nextStatus === 'DISABLED' ? 'vô hiệu hóa' : 'mở lại';
    if (!window.confirm(`Bạn chắc chắn muốn ${verb} tài khoản ${account.name || account.email}?`)) return;
    setBusyId(account.id);
    setFeedback('');
    try {
      await api.put(`/admin/users/${account.id}`, { status: nextStatus });
      setFeedback(`Đã ${verb} tài khoản ${account.name || account.email}.`);
      load();
    } catch (err) {
      setError(err?.message || 'Không cập nhật được trạng thái tài khoản.');
    } finally {
      setBusyId(null);
    }
  };

  const stats = [
    { label: 'Tài khoản', value: Number(summary.total || 0).toLocaleString('vi-VN'), hint: 'Toàn hệ thống' },
    { label: 'Khách hàng', value: Number(summary.customers || 0).toLocaleString('vi-VN'), hint: 'Vai trò USER', tone: 'positive' },
    { label: 'Quản trị viên', value: Number(summary.admins || 0).toLocaleString('vi-VN'), hint: 'Vai trò ADMIN' },
    { label: 'Đang hoạt động', value: Number(summary.active || 0).toLocaleString('vi-VN'), hint: features.canManageStatus ? 'Có thể truy cập' : 'Schema hiện tại', tone: 'positive' },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Danh sách khách hàng"
        title="Quản lý người dùng"
        description="Tìm kiếm tài khoản, xem vai trò và truy cập nhanh lịch sử đơn hàng của khách."
        action={<button type="button" className="btn btn-outline-dark" onClick={load}>Làm mới dữ liệu</button>}
      />

      <AdminStatGrid items={stats} />

      {!features.canManageStatus && !loading && (
        <div className="admin-capability-note">
          Trạng thái khóa tài khoản sẽ khả dụng sau khi chạy migration hệ thống xác thực; dữ liệu người dùng hiện vẫn xem và lọc theo vai trò bình thường.
        </div>
      )}

      <form className="admin-filter-panel" onSubmit={applyFilters}>
        <div className="admin-filter-field grow">
          <label htmlFor="admin-user-search">Tìm người dùng</label>
          <input
            id="admin-user-search"
            className="form-control"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Tên, email hoặc số điện thoại"
          />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-user-role">Vai trò</label>
          <select id="admin-user-role" className="form-select" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
            <option value="">Tất cả</option>
            <option value="USER">Khách hàng</option>
            <option value="STAFF">Nhân viên</option>
            <option value="ADMIN">Quản trị</option>
          </select>
        </div>
        {features.canManageStatus && (
          <div className="admin-filter-field">
            <label htmlFor="admin-user-status">Trạng thái</label>
            <select id="admin-user-status" className="form-select" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="DISABLED">Đã khóa</option>
              <option value="LOCKED">Tạm khóa</option>
            </select>
          </div>
        )}
        <button className="btn luxury-primary-btn" type="submit">Lọc</button>
        <button className="btn btn-outline-dark" type="button" onClick={clearFilters}>Xóa lọc</button>
      </form>

      {error && <div className="alert alert-danger admin-alert">{error}</div>}
      {feedback && <div className="alert alert-success admin-alert">{feedback}</div>}

      <section className="admin-table-panel">
        {loading ? (
          <div className="admin-loading"><div className="spinner-border" /> Đang tải người dùng...</div>
        ) : users.length === 0 ? (
          <AdminEmptyState title="Không tìm thấy tài khoản" description="Thử tìm bằng email hoặc thay đổi bộ lọc vai trò." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table admin-table align-middle">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <div className="admin-user-cell">
                          <span>{String(account.name || account.email || '?').charAt(0)}</span>
                          <div>
                            <strong>{account.name || '-'}</strong>
                            <small>#{account.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-contact-cell">
                          <span>{account.email}</span>
                          <small>{account.phone || '-'}</small>
                        </div>
                      </td>
                      <td><span className="admin-role-badge">{account.role}</span></td>
                      <td><AdminStatusBadge status={account.status} /></td>
                      <td>{formatAdminDate(account.created_at)}</td>
                      <td>
                        <div className="admin-row-actions justify-content-end">
                          <Link
                            to={`/admin/orders?userId=${account.id}&userName=${encodeURIComponent(account.name || account.email || '')}`}
                            className="btn btn-sm btn-outline-dark"
                          >
                            Xem đơn
                          </Link>
                          {features.canManageStatus && Number(currentUser?.id) !== Number(account.id) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark"
                              disabled={busyId === account.id}
                              onClick={() => toggleAccountStatus(account)}
                            >
                              {account.status === 'DISABLED' ? 'Mở lại' : 'Khóa'}
                            </button>
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
