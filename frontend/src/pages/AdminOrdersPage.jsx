import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const userName = searchParams.get('userName') || '';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const requestParams = useMemo(() => {
    const params = { page: 1, pageSize: 50 };
    if (userId) params.userId = userId;
    return params;
  }, [userId]);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/orders', { params: requestParams })
      .then((res) => {
        const data = unwrapApiData(res.data);
        setOrders(Array.isArray(data?.listOrders) ? data.listOrders : Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được danh sách đơn hàng.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [requestParams]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    } catch (err) {
      alert(err?.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h3 className="mb-1">Admin - Đơn hàng</h3>
          {userId && (
            <div className="luxury-muted small">
              Lịch sử đơn hàng của {userName || `tài khoản #${userId}`}
            </div>
          )}
        </div>
        {userId && (
          <Link to="/orders" className="btn btn-outline-dark btn-sm">
            Xem tất cả đơn
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 ? (
        <div className="luxury-surface p-4 text-center luxury-muted">
          Chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-dark">
              <tr>
                <th>Mã đơn</th>
                <th>Khách</th>
                <th>Tổng</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.user_name || order.userName || '-'}</td>
                  <td>{Number(order.total || 0).toLocaleString('vi-VN')}₫</td>
                  <td>{order.payment_method || order.paymentMethod || '-'}</td>
                  <td><span className="badge bg-secondary">{order.status}</span></td>
                  <td className="d-flex gap-2">
                    <select
                      className="form-select form-select-sm"
                      value={order.status}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                    >
                      {['Waiting', 'Paid', 'Processing', 'Delivered', 'Completed', 'Cancelled'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-dark">Chi tiết</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
