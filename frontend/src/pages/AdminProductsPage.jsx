import { useEffect, useState } from 'react';
import api from '../services/api';

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/products')
      .then((res) => {
        const data = unwrapApiData(res.data);
        setProducts(Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []);
      })
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được danh sách sản phẩm.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Admin - Sản phẩm</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const discountPrice = product.discountPrice || product.discount_price || 0;
              const price = discountPrice > 0 ? discountPrice : product.price;

              return (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td>{product.name}</td>
                  <td>{Number(price || 0).toLocaleString('vi-VN')}₫</td>
                  <td>{product.stock}</td>
                  <td>{product.categoryName || product.category?.name || '-'}</td>
                  <td>{product.brandName || product.brand?.name || '-'}</td>
                  <td>{product.status ? 'Hiển thị' : 'Ẩn'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
