import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatGrid,
  AdminStatusBadge,
  formatAdminCurrency,
  formatAdminDate,
} from '../components/Admin/AdminUi';

const PAGE_SIZE = 12;
const ORDER_STATUSES = [
  { value: 'Waiting', label: 'Waiting' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];
const ORDER_STATUS_VALUES = ORDER_STATUSES.map((status) => status.value);

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const linkedUserId = searchParams.get('userId') || '';
  const linkedUserName = searchParams.get('userName') || '';
  const initialFilters = { search: '', status: '', paymentMethod: '', dateFrom: '', dateTo: '', userId: linkedUserId };
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalElements: 0 });
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/orders', { params: { page, pageSize: PAGE_SIZE, ...appliedFilters } })
      .then((res) => {
        const data = unwrapApiData(res.data) || {};
        setOrders(Array.isArray(data.listOrders) ? data.listOrders : []);
        setSummary(data.summary || {});
        setPagination({
          page: Number(data.currentOrderPage || page),
          totalPages: Number(data.totalOrderPages || 1),
          totalElements: Number(data.totalOrders || 0),
        });
      })
      .catch((err) => setError(err?.message || 'Không tải được danh sách đơn hàng.'))
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
    const cleared = { search: '', status: '', paymentMethod: '', dateFrom: '', dateTo: '', userId: linkedUserId };
    setFilters(cleared);
    setPage(1);
    setAppliedFilters(cleared);
  };

  const updateStatus = async (orderId, status) => {
    setSavingId(orderId);
    setFeedback('');
    setError('');
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      setFeedback(`Đã cập nhật trạng thái đơn #${orderId} thành ${status}.`);
      load();
    } catch (err) {
      setError(err?.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setSavingId(null);
    }
  };

  const stats = [
    { label: 'Đơn theo bộ lọc', value: Number(summary.total || 0).toLocaleString('vi-VN'), hint: 'Kết quả hiện tại' },
    { label: 'Tổng giá trị', value: formatAdminCurrency(summary.value), hint: 'Theo bộ lọc', tone: 'positive' },
    { label: 'Đang xử lý', value: Number(summary.processing || 0).toLocaleString('vi-VN'), hint: 'Processing / shipped', tone: 'warning' },
    { label: 'Hoàn tất', value: Number(summary.completed || 0).toLocaleString('vi-VN'), hint: 'Paid / delivered', tone: 'positive' },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Order operations"
        title="Quản lý đơn hàng"
        description={linkedUserId ? `Đơn hàng của ${linkedUserName || `tài khoản #${linkedUserId}`}.` : 'Kiểm soát thanh toán, tiến trình giao hàng và lịch sử xử lý.'}
        action={linkedUserId ? <Link to="/admin/orders" className="btn btn-outline-dark">Xem tất cả đơn</Link> : <button type="button" className="btn btn-outline-dark" onClick={load}>Làm mới dữ liệu</button>}
      />

      <AdminStatGrid items={stats} />

      <form className="admin-filter-panel admin-filter-orders" onSubmit={applyFilters}>
        <div className="admin-filter-field grow">
          <label htmlFor="admin-order-search">Tìm đơn hàng</label>
          <input
            id="admin-order-search"
            className="form-control"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Mã đơn hoặc tên khách"
          />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-order-status">Trạng thái</label>
          <select id="admin-order-status" className="form-select" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Tất cả</option>
            {ORDER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-order-payment">Thanh toán</label>
          <select id="admin-order-payment" className="form-select" value={filters.paymentMethod} onChange={(event) => setFilters({ ...filters, paymentMethod: event.target.value })}>
            <option value="">Tất cả</option>
            <option value="COD">COD</option>
            <option value="Banking">Banking</option>
            <option value="MoMo">MoMo</option>
            <option value="ZaloPay">ZaloPay</option>
          </select>
        </div>
        <div className="admin-filter-field compact">
          <label htmlFor="admin-order-from">Từ ngày</label>
          <input id="admin-order-from" className="form-control" type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
        </div>
        <div className="admin-filter-field compact">
          <label htmlFor="admin-order-to">Đến ngày</label>
          <input id="admin-order-to" className="form-control" type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
        </div>
        <button className="btn luxury-primary-btn" type="submit">Lọc</button>
        <button className="btn btn-outline-dark" type="button" onClick={clearFilters}>Xóa lọc</button>
      </form>

      {error && <div className="alert alert-danger admin-alert">{error}</div>}
      {feedback && <div className="alert alert-success admin-alert">{feedback}</div>}

      <section className="admin-table-panel">
        {loading ? (
          <div className="admin-loading"><div className="spinner-border" /> Đang tải đơn hàng...</div>
        ) : orders.length === 0 ? (
          <AdminEmptyState title="Chưa có đơn hàng phù hợp" description="Thử bỏ bớt điều kiện lọc hoặc tìm theo mã đơn khác." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table admin-table align-middle">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>{order.userName || '-'}</td>
                      <td><strong>{formatAdminCurrency(order.total)}</strong></td>
                      <td>{order.paymentMethod || '-'}</td>
                      <td>{formatAdminDate(order.createdAt)}</td>
                      <td><AdminStatusBadge status={order.status} /></td>
                      <td>
                        <div className="admin-row-actions justify-content-end">
                          <select
                            aria-label={`Cập nhật trạng thái đơn ${order.id}`}
                            className="form-select form-select-sm admin-status-select"
                            value={order.status}
                            disabled={savingId === order.id}
                            onChange={(event) => updateStatus(order.id, event.target.value)}
                          >
                            {!ORDER_STATUS_VALUES.includes(order.status) && <option value={order.status}>{order.status}</option>}
                            {ORDER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                          </select>
                          <Link to={`/admin/orders/${order.id}`} className="btn btn-sm btn-outline-dark">Chi tiết</Link>
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
