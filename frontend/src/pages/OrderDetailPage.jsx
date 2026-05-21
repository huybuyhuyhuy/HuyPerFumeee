import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { resolveProductImage } from '../utils/image';

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID đơn hàng không hợp lệ');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    orderService
      .getOrder(Number(id))
      .then((data) => setOrder(data))
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được chi tiết đơn hàng.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  if (error) {
    return (
      <div className="container py-4">
        <h3 className="mb-4">Chi tiết đơn hàng</h3>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Chi tiết đơn hàng #{order.id}</h3>
        <Link to="/orders" className="btn btn-outline-dark btn-sm">
          Quay lại
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <strong>Ngày đặt:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}
            </div>
            <div className="col-md-4">
              <strong>Thanh toán:</strong> {order.paymentMethod}
            </div>
            <div className="col-md-4">
              <strong>Trạng thái:</strong> {order.status}
            </div>
            <div className="col-md-6">
              <strong>SĐT giao hàng:</strong> {order.phone || '-'}
            </div>
            <div className="col-md-6">
              <strong>Địa chỉ:</strong> {order.shippingAddress || '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Sản phẩm</h5>
          {Array.isArray(order.items) && order.items.length > 0 ? (
            <>
              {order.items.map((item) => (
                <div key={item.id} className="d-flex align-items-center justify-content-between border-bottom py-2">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={resolveProductImage(item.productImage)}
                      alt={item.productName}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                    />
                    <div>
                      <div>{item.productName}</div>
                      <small className="text-muted">SL: {item.quantity}</small>
                    </div>
                  </div>
                  <div className="fw-semibold">{item.price.toLocaleString('vi-VN')}₫</div>
                </div>
              ))}
              <div className="d-flex justify-content-end mt-3">
                <h5 className="mb-0">Tổng: {order.total.toLocaleString('vi-VN')}₫</h5>
              </div>
            </>
          ) : (
            <p className="text-muted mb-0">Không có sản phẩm trong đơn hàng.</p>
          )}
        </div>
      </div>
    </div>
  );
}

