import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatGrid,
  AdminStatusBadge,
  formatAdminCurrency,
} from '../components/Admin/AdminUi';
import { resolveProductImage } from '../utils/image';

const PAGE_SIZE = 10;
const DEFAULT_FILTERS = { search: '', status: '', stockState: '' };

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function productFallbackImage(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = '/assets/images/1.webp';
}

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalElements: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [stockDrafts, setStockDrafts] = useState({});
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/products', { params: { page, pageSize: PAGE_SIZE, ...appliedFilters } })
      .then((res) => {
        const data = unwrapApiData(res.data) || {};
        const content = Array.isArray(data.content) ? data.content : [];
        setProducts(content);
        setSummary(data.summary || {});
        setPagination({
          page: Number(data.page || page),
          totalPages: Number(data.totalPages || 1),
          totalElements: Number(data.totalElements || 0),
        });
        setStockDrafts(Object.fromEntries(content.map((product) => [product.id, String(product.stock ?? 0)])));
      })
      .catch((err) => setError(err?.message || 'Không tải được danh sách sản phẩm.'))
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

  const toggleVisibility = async (product) => {
    setBusyId(product.id);
    setFeedback('');
    setError('');
    try {
      await api.put(`/admin/products/${product.id}`, { status: !product.status });
      setFeedback(`Đã ${product.status ? 'ẩn' : 'hiển thị'} ${product.name}.`);
      load();
    } catch (err) {
      setError(err?.message || 'Không cập nhật được trạng thái sản phẩm.');
    } finally {
      setBusyId(null);
    }
  };

  const saveStock = async (product) => {
    const nextStock = Number(stockDrafts[product.id]);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setError('Tồn kho phải là số nguyên không âm.');
      return;
    }
    setBusyId(product.id);
    setFeedback('');
    setError('');
    try {
      await api.post(`/admin/products/${product.id}/reset-stock`, { stock: nextStock });
      setFeedback(`Đã cập nhật tồn kho ${product.name}.`);
      load();
    } catch (err) {
      setError(err?.message || 'Không cập nhật được tồn kho.');
    } finally {
      setBusyId(null);
    }
  };

  const stats = [
    { label: 'Tổng sản phẩm', value: formatNumber(summary.total), hint: 'Trong danh mục', icon: 'SKU' },
    { label: 'Đang hiển thị', value: formatNumber(summary.active), hint: 'Có thể mua', tone: 'positive', icon: 'ON' },
    { label: 'Sắp hết hàng', value: formatNumber(summary.lowStock), hint: 'Còn 1 - 5 chai', tone: 'warning', icon: 'LOW' },
    { label: 'Giá trị tồn kho', value: formatAdminCurrency(summary.stockValue), hint: 'Ước tính theo giá bán', tone: 'positive', icon: 'VND' },
  ];

  const categoryBreakdown = Array.isArray(summary.categoryBreakdown) ? summary.categoryBreakdown : [];
  const maxCategoryTotal = Math.max(...categoryBreakdown.map((item) => Number(item.total || 0)), 1);
  const stockTotal = Number(summary.totalStock || 0);

  return (
    <div className="admin-page huy-admin-ops-page">
      <AdminPageHeader
        eyebrow="Quản lý danh mục"
        title="Quản lý sản phẩm"
        description="Theo dõi danh mục, tồn kho, giá bán và trạng thái hiển thị của boutique."
        action={(
          <div className="admin-page-action-row">
            <Link to="/admin/reports" className="btn btn-outline-dark">Báo cáo</Link>
            <Link to="/admin/products/add" className="btn luxury-primary-btn">Thêm sản phẩm</Link>
            <button type="button" className="btn btn-outline-dark" onClick={load}>Làm mới</button>
          </div>
        )}
      />

      <AdminStatGrid items={stats} />

      <section className="admin-insight-grid products">
        <article className="admin-insight-card">
          <div className="admin-insight-head compact">
            <div>
              <span className="admin-eyebrow">Tồn kho</span>
              <h2>Sức khỏe tồn kho</h2>
            </div>
          </div>
          <div className="admin-stock-health">
            <div>
              <strong>{formatNumber(stockTotal)}</strong>
              <span>Tổng đơn vị tồn</span>
            </div>
            <div>
              <strong>{formatNumber(summary.outOfStock)}</strong>
              <span>Hết hàng</span>
            </div>
            <div>
              <strong>{formatNumber(summary.decantCount)}</strong>
              <span>Sản phẩm decant</span>
            </div>
          </div>
        </article>

        <article className="admin-insight-card wide">
          <div className="admin-insight-head">
            <div>
              <span className="admin-eyebrow">Phân bố danh mục</span>
              <h2>Phân bổ danh mục</h2>
            </div>
            <strong>{formatNumber(categoryBreakdown.length)} nhóm</strong>
          </div>
          <div className="admin-category-bars">
            {categoryBreakdown.length === 0 ? <span className="admin-muted">Chưa có dữ liệu</span> : categoryBreakdown.map((item) => (
              <div className="admin-category-bar" key={item.category}>
                <div>
                  <span>{item.category}</span>
                  <strong>{formatNumber(item.total)}</strong>
                </div>
                <i><span style={{ width: `${Math.max((Number(item.total || 0) / maxCategoryTotal) * 100, 6)}%` }} /></i>
              </div>
            ))}
          </div>
        </article>
      </section>

      <form className="admin-filter-panel" onSubmit={applyFilters}>
        <div className="admin-filter-field grow">
          <label htmlFor="admin-product-search">Tìm sản phẩm</label>
          <input
            id="admin-product-search"
            className="form-control"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Tên, SKU hoặc mã lô"
          />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-product-status">Hiển thị</label>
          <select id="admin-product-status" className="form-select" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Tất cả</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đang ẩn</option>
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-product-stock">Tồn kho</label>
          <select id="admin-product-stock" className="form-select" value={filters.stockState} onChange={(event) => setFilters({ ...filters, stockState: event.target.value })}>
            <option value="">Tất cả</option>
            <option value="low">Sắp hết</option>
            <option value="out">Hết hàng</option>
            <option value="available">Sẵn hàng</option>
          </select>
        </div>
        <button className="btn luxury-primary-btn" type="submit">Lọc</button>
        <button className="btn btn-outline-dark" type="button" onClick={clearFilters}>Xóa lọc</button>
      </form>

      {error && <div className="alert alert-danger admin-alert">{error}</div>}
      {feedback && <div className="alert alert-success admin-alert">{feedback}</div>}

      <section className="admin-table-panel">
        <div className="admin-table-title">
          <div>
            <span className="admin-eyebrow">Danh sách sản phẩm</span>
            <h2>Danh sách sản phẩm</h2>
          </div>
          <span>{formatNumber(pagination.totalElements)} sản phẩm</span>
        </div>
        {loading ? (
          <div className="admin-loading"><div className="spinner-border" /> Đang tải sản phẩm...</div>
        ) : products.length === 0 ? (
          <AdminEmptyState title="Không có sản phẩm phù hợp" description="Thử thay đổi từ khóa hoặc bộ lọc tồn kho." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table admin-table align-middle">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" onError={productFallbackImage} />
                          <div>
                            <strong>{product.name}</strong>
                            <small>{product.sku || `#${product.id}`} · {product.brandName || 'Chưa có thương hiệu'}</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.categoryName || '-'}</td>
                      <td><strong>{formatAdminCurrency(product.discountPrice > 0 ? product.discountPrice : product.price)}</strong></td>
                      <td>
                        <div className="admin-stock-editor">
                          <input
                            type="number"
                            min="0"
                            className="form-control form-control-sm"
                            aria-label={`Tồn kho ${product.name}`}
                            value={stockDrafts[product.id] ?? ''}
                            onChange={(event) => setStockDrafts({ ...stockDrafts, [product.id]: event.target.value })}
                          />
                          <button type="button" className="btn btn-sm btn-outline-dark" disabled={busyId === product.id} onClick={() => saveStock(product)}>
                            Lưu
                          </button>
                        </div>
                      </td>
                      <td><AdminStatusBadge status={product.status ? 'active' : 'disabled'} /></td>
                      <td className="text-end">
                        <div className="admin-row-actions justify-content-end">
                          <Link to={`/admin/products/${product.id}/edit`} className="btn btn-sm btn-outline-dark">Chi tiết</Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            disabled={busyId === product.id}
                            onClick={() => toggleVisibility(product)}
                          >
                            {product.status ? 'Ẩn' : 'Hiển thị'}
                          </button>
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
