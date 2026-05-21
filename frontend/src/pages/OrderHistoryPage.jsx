import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';

export function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    orderService
      .getUserOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []))
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được lịch sử đơn hàng.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  if (error) {
    return (
      <div className="container py-4">
        <h3 className="mb-4">Lịch sử đơn hàng</h3>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const statusColor = (status) => {
    switch (status) {
      case 'Waiting':
        return 'warning';
      case 'Paid':
        return 'info';
      case 'Completed':
      case 'Delivered':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4">Lịch sử đơn hàng</h3>
      {orders.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Bạn chưa có đơn hàng nào.</p>
          <Link to="/products" className="btn btn-dark">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>Mã đơn</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{order.total.toLocaleString('vi-VN')}₫</td>
                  <td>{order.paymentMethod}</td>
                  <td>
                    <span className={`badge bg-${statusColor(order.status)}`}>{order.status}</span>
                  </td>
                  <td>
                    <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-dark">
                      Chi tiết
                    </Link>
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

