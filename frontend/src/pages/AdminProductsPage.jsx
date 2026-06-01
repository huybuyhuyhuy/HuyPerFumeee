import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../store/ToastContext';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatGrid,
  AdminStatusBadge,
  formatAdminCurrency,
} from '../components/Admin/AdminUi';
import { DEFAULT_PRODUCT_IMAGE, resolveProductImage } from '../utils/image';

const PAGE_SIZE = 10;
const DEFAULT_FILTERS = { search: '', brandId: '', categoryId: '', status: '', stockState: '' };
const EMPTY_FORM = {
  name: '',
  sku: '',
  batchCode: '',
  image: '',
  price: '',
  discountPrice: '',
  stock: '0',
  volumeMl: '',
  description: '',
  scentNotes: '',
  isDecant: false,
  status: true,
  categoryId: '',
  brandId: '',
};

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function productFallbackImage(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
}

function productToForm(product) {
  return {
    name: product?.name || '',
    sku: product?.sku || '',
    batchCode: product?.batchCode || '',
    image: product?.image || '',
    price: String(product?.price ?? ''),
    discountPrice: product?.discountPrice === null || product?.discountPrice === undefined
      ? ''
      : String(product.discountPrice),
    stock: String(product?.stock ?? 0),
    volumeMl: product?.volumeMl === null || product?.volumeMl === undefined
      ? ''
      : String(product.volumeMl),
    description: product?.description || '',
    scentNotes: product?.scentNotes || '',
    isDecant: Boolean(product?.isDecant),
    status: product?.status !== false,
    categoryId: product?.categoryId ?? product?.idCategory ?? '',
    brandId: product?.brandId ?? product?.idBrand ?? '',
  };
}

function buildProductPayload(form) {
  return {
    name: form.name.trim(),
    sku: form.sku.trim() || null,
    batchCode: form.batchCode.trim() || null,
    image: form.image.trim(),
    price: Number(form.price),
    discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
    stock: Number(form.stock),
    volumeMl: form.volumeMl === '' ? null : Number(form.volumeMl),
    description: form.description.trim() || null,
    scentNotes: form.scentNotes.trim() || null,
    isDecant: Boolean(form.isDecant),
    status: Boolean(form.status),
    categoryId: form.categoryId === '' ? null : Number(form.categoryId),
    brandId: form.brandId === '' ? null : Number(form.brandId),
  };
}

function validateForm(form) {
  const price = Number(form.price);
  const discountPrice = form.discountPrice === '' ? null : Number(form.discountPrice);
  const stock = Number(form.stock);
  if (!form.name.trim()) return 'Tên sản phẩm không được để trống.';
  if (!Number.isFinite(price) || price < 0) return 'Giá bán phải là số không âm.';
  if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice >= price)) {
    return 'Giá khuyến mãi phải không âm và nhỏ hơn giá bán.';
  }
  if (!Number.isInteger(stock) || stock < 0) return 'Tồn kho phải là số nguyên không âm.';
  return '';
}

export function AdminProductsPage() {
  const { pushToast } = useToast();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalElements: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [options, setOptions] = useState({ brands: [], categories: [] });
  const [stockDrafts, setStockDrafts] = useState({});
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/products', {
        params: { page, pageSize: PAGE_SIZE, ...appliedFilters },
      });
      const data = unwrapApiData(response.data) || {};
      const content = Array.isArray(data.content) ? data.content : [];
      setProducts(content);
      setSummary(data.summary || {});
      setPagination({
        page: Number(data.page || page),
        totalPages: Number(data.totalPages || 1),
        totalElements: Number(data.totalElements || 0),
      });
      setStockDrafts(Object.fromEntries(content.map((product) => [product.id, String(product.stock ?? 0)])));
    } catch (requestError) {
      const message = requestError?.message || 'Không tải được danh sách sản phẩm.';
      setError(message);
      pushToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, appliedFilters]);

  useEffect(() => {
    Promise.all([api.get('/brands'), api.get('/categories')])
      .then(([brandResponse, categoryResponse]) => {
        setOptions({
          brands: unwrapApiData(brandResponse.data) || [],
          categories: unwrapApiData(categoryResponse.data) || [],
        });
      })
      .catch(() => pushToast('Không tải được danh mục hoặc thương hiệu.', 'error'));
  }, []);

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

  const openCreateForm = () => {
    setEditorMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEditForm = async (product) => {
    setEditorMode('edit');
    setEditingId(product.id);
    setEditorOpen(true);
    setEditorLoading(true);
    try {
      const response = await api.get(`/admin/products/${product.id}`);
      setForm(productToForm(unwrapApiData(response.data)));
    } catch (requestError) {
      pushToast(requestError?.message || 'Không tải được sản phẩm để chỉnh sửa.', 'error');
      setEditorOpen(false);
    } finally {
      setEditorLoading(false);
    }
  };

  const updateForm = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm(form);
    if (validationMessage) {
      pushToast(validationMessage, 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildProductPayload(form);
      if (editorMode === 'create') {
        await api.post('/admin/products', payload);
        pushToast('Đã thêm sản phẩm thành công.', 'success');
      } else {
        await api.put(`/admin/products/${editingId}`, payload);
        pushToast('Đã cập nhật sản phẩm thành công.', 'success');
      }
      setEditorOpen(false);
      await load();
    } catch (requestError) {
      pushToast(requestError?.message || 'Không lưu được sản phẩm.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (product) => {
    if (product.status && !window.confirm(`Bạn chắc chắn muốn ẩn sản phẩm "${product.name}"?`)) return;
    setBusyId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/status`, { status: !product.status });
      pushToast(`Đã ${product.status ? 'ẩn' : 'hiển thị'} ${product.name}.`, 'success');
      await load();
    } catch (requestError) {
      pushToast(requestError?.message || 'Không cập nhật được trạng thái sản phẩm.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const saveStock = async (product) => {
    const nextStock = Number(stockDrafts[product.id]);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      pushToast('Tồn kho phải là số nguyên không âm.', 'error');
      return;
    }
    setBusyId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/stock`, { stock: nextStock });
      pushToast(`Đã cập nhật tồn kho ${product.name}.`, 'success');
      await load();
    } catch (requestError) {
      pushToast(requestError?.message || 'Không cập nhật được tồn kho.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa sản phẩm "${product.name}"?`)) return;
    setBusyId(product.id);
    try {
      await api.delete(`/admin/products/${product.id}`);
      pushToast(`Đã xóa ${product.name}.`, 'success');
      await load();
    } catch (requestError) {
      pushToast(requestError?.message || 'Không xóa được sản phẩm.', 'error');
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
            <button type="button" className="btn luxury-primary-btn" onClick={openCreateForm}>Thêm sản phẩm</button>
            <button type="button" className="btn btn-outline-dark" onClick={() => void load()}>Làm mới</button>
          </div>
        )}
      />

      <AdminStatGrid items={stats} />

      {editorOpen && (
        <section className="admin-product-editor" aria-label={editorMode === 'create' ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}>
          <div className="admin-table-title">
            <div>
              <span className="admin-eyebrow">{editorMode === 'create' ? 'Tạo mới' : 'Cập nhật'}</span>
              <h2>{editorMode === 'create' ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
            </div>
            <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setEditorOpen(false)}>Đóng</button>
          </div>
          {editorLoading ? (
            <div className="admin-loading"><div className="spinner-border" /> Đang tải sản phẩm...</div>
          ) : (
            <form className="admin-product-form" onSubmit={saveProduct}>
              <label className="grow-2">Tên sản phẩm
                <input className="form-control" value={form.name} onChange={updateForm('name')} required />
              </label>
              <label>SKU
                <input className="form-control" value={form.sku} onChange={updateForm('sku')} />
              </label>
              <label>Mã lô
                <input className="form-control" value={form.batchCode} onChange={updateForm('batchCode')} />
              </label>
              <label>Thương hiệu
                <select className="form-select" value={form.brandId} onChange={updateForm('brandId')}>
                  <option value="">Chưa có thương hiệu</option>
                  {options.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
              <label>Danh mục
                <select className="form-select" value={form.categoryId} onChange={updateForm('categoryId')}>
                  <option value="">Chưa phân loại</option>
                  {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>Giá bán
                <input type="number" min="0" className="form-control" value={form.price} onChange={updateForm('price')} required />
              </label>
              <label>Giá khuyến mãi
                <input type="number" min="0" className="form-control" value={form.discountPrice} onChange={updateForm('discountPrice')} />
              </label>
              <label>Tồn kho
                <input type="number" min="0" className="form-control" value={form.stock} onChange={updateForm('stock')} required />
              </label>
              <label>Dung tích (ml)
                <input type="number" min="1" className="form-control" value={form.volumeMl} onChange={updateForm('volumeMl')} />
              </label>
              <label className="grow-2">Ảnh sản phẩm
                <input className="form-control" value={form.image} onChange={updateForm('image')} placeholder="/assets/images/..." />
              </label>
              <label className="grow-2">Nốt hương
                <input className="form-control" value={form.scentNotes} onChange={updateForm('scentNotes')} />
              </label>
              <label className="grow-4">Mô tả
                <textarea className="form-control" rows="3" value={form.description} onChange={updateForm('description')} />
              </label>
              <div className="admin-product-switches grow-4">
                <label><input type="checkbox" checked={form.isDecant} onChange={updateForm('isDecant')} /> Sản phẩm chiết</label>
                <label><input type="checkbox" checked={form.status} onChange={updateForm('status')} /> Đang hiển thị</label>
                <button type="submit" className="btn luxury-primary-btn" disabled={saving}>
                  {saving ? 'Đang lưu...' : editorMode === 'create' ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <section className="admin-insight-grid products">
        <article className="admin-insight-card">
          <div className="admin-insight-head compact"><div><span className="admin-eyebrow">Tồn kho</span><h2>Sức khỏe tồn kho</h2></div></div>
          <div className="admin-stock-health">
            <div><strong>{formatNumber(stockTotal)}</strong><span>Tổng đơn vị tồn</span></div>
            <div><strong>{formatNumber(summary.outOfStock)}</strong><span>Hết hàng</span></div>
            <div><strong>{formatNumber(summary.decantCount)}</strong><span>Sản phẩm decant</span></div>
          </div>
        </article>
        <article className="admin-insight-card wide">
          <div className="admin-insight-head">
            <div><span className="admin-eyebrow">Phân bổ danh mục</span><h2>Phân bổ danh mục</h2></div>
            <strong>{formatNumber(categoryBreakdown.length)} nhóm</strong>
          </div>
          <div className="admin-category-bars">
            {categoryBreakdown.length === 0 ? <span className="admin-muted">Chưa có dữ liệu</span> : categoryBreakdown.map((item) => (
              <div className="admin-category-bar" key={item.category}>
                <div><span>{item.category}</span><strong>{formatNumber(item.total)}</strong></div>
                <i><span style={{ width: `${Math.max((Number(item.total || 0) / maxCategoryTotal) * 100, 6)}%` }} /></i>
              </div>
            ))}
          </div>
        </article>
      </section>

      <form className="admin-filter-panel admin-product-filters" onSubmit={applyFilters}>
        <div className="admin-filter-field grow">
          <label htmlFor="admin-product-search">Tìm sản phẩm</label>
          <input id="admin-product-search" className="form-control" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tên, SKU hoặc mã lô" />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-product-brand">Thương hiệu</label>
          <select id="admin-product-brand" className="form-select" value={filters.brandId} onChange={(event) => setFilters({ ...filters, brandId: event.target.value })}>
            <option value="">Tất cả</option>
            {options.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-product-category">Danh mục</label>
          <select id="admin-product-category" className="form-select" value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
            <option value="">Tất cả</option>
            {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="admin-product-status">Trạng thái</label>
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

      {error && <AdminEmptyState title="Không tải được danh sách sản phẩm" description={error} />}

      <section className="admin-table-panel">
        <div className="admin-table-title">
          <div><span className="admin-eyebrow">Danh sách sản phẩm</span><h2>Danh sách sản phẩm</h2></div>
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
                          <input type="number" min="0" className="form-control form-control-sm" aria-label={`Tồn kho ${product.name}`} value={stockDrafts[product.id] ?? ''} onChange={(event) => setStockDrafts({ ...stockDrafts, [product.id]: event.target.value })} />
                          <button type="button" className="btn btn-sm btn-outline-dark" disabled={busyId === product.id} onClick={() => void saveStock(product)}>Lưu</button>
                        </div>
                        {product.stock > 0 && product.stock <= 5 && <span className="admin-status-badge progress admin-low-stock-badge">Sắp hết</span>}
                      </td>
                      <td><AdminStatusBadge status={product.status ? 'active' : 'disabled'} /></td>
                      <td className="text-end">
                        <div className="admin-row-actions justify-content-end">
                          <button type="button" className="btn btn-sm btn-outline-dark" disabled={busyId === product.id} onClick={() => void openEditForm(product)}>Sửa</button>
                          <button type="button" className="btn btn-sm btn-outline-dark" disabled={busyId === product.id} onClick={() => void toggleVisibility(product)}>{product.status ? 'Ẩn' : 'Hiện'}</button>
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled={busyId === product.id} onClick={() => void deleteProduct(product)}>Xóa</button>
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
