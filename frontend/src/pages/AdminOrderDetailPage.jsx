import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Thiếu mã đơn hàng.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    api
      .get(`/admin/orders/${id}`)
      .then((res) => {
        const data = unwrapApiData(res.data);
        setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được chi tiết đơn hàng.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Admin - Chi tiết đơn #{id}</h3>
        <Link to="/admin/orders" className="btn btn-outline-dark btn-sm">Quay lại</Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-dark">
            <tr>
              <th>Mã sản phẩm</th>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Giá</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.itemId || item.item_id}>
                <td>#{item.itemId || item.item_id}</td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{Number(item.price || 0).toLocaleString('vi-VN')}₫</td>
                <td>{item.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
