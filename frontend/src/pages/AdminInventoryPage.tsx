import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapApiData } from '../services/api';
import { useToast } from '../store/ToastContext';
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
const DEFAULT_FILTERS = { lowStock: '', categoryId: '' };

type CategoryOption = {
  id: number | string;
  name: string;
};

type InventoryProduct = {
  id: number | string;
  sku?: string | null;
  name: string;
  stock: number;
  price: number;
  status?: boolean;
  categoryName?: string | null;
  lastSoldDate?: string | null;
  isLowStock?: boolean;
};

type InventoryPagePayload = {
  content?: InventoryProduct[];
  page?: number;
  totalPages?: number;
  totalElements?: number;
};

type LowStockProduct = {
  id: number | string;
  sku?: string | null;
  name: string;
  stock: number;
  categoryName?: string | null;
};

type LowStockVariant = {
  id: number | string;
  productId: number | string;
  productName: string;
  sku?: string | null;
  volumeLabel?: string | null;
  stockQuantity: number;
};

type LowStockAlerts = {
  threshold: number;
  products: LowStockProduct[];
  variants: LowStockVariant[];
};

function formatNumber(value: unknown) {
  return Math.round(Number(value || 0)).toLocaleString('vi-VN');
}

function normalizeInventoryProduct(product: InventoryProduct): InventoryProduct {
  return {
    ...product,
    stock: Number(product.stock || 0),
    price: Number(product.price || 0),
    status: product.status !== false,
    isLowStock: Boolean(product.isLowStock),
  };
}

function normalizeAlerts(payload: Partial<LowStockAlerts> | null | undefined): LowStockAlerts {
  return {
    threshold: Number(payload?.threshold || 5),
    products: Array.isArray(payload?.products)
      ? payload.products.map((item) => ({ ...item, stock: Number(item.stock || 0) }))
      : [],
    variants: Array.isArray(payload?.variants)
      ? payload.variants.map((item) => ({ ...item, stockQuantity: Number(item.stockQuantity || 0) }))
      : [],
  };
}

function getStockTone(stock: number, threshold: number) {
  if (stock <= 0) return 'negative';
  if (stock < threshold) return 'progress';
  return 'positive';
}

function getStockLabel(stock: number, threshold: number) {
  if (stock <= 0) return 'Hết hàng';
  if (stock < threshold) return 'Sắp hết';
  return 'Ổn định';
}

export function AdminInventoryPage() {
  const { pushToast } = useToast();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlerts>({ threshold: 5, products: [], variants: [] });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalElements: 0 });
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const lowStockCount = alerts.products.length + alerts.variants.length;
  const pageStockTotal = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
    [products],
  );

  const loadAlerts = async () => {
    const response = await api.get('/admin/inventory/alerts');
    setAlerts(normalizeAlerts(unwrapApiData<Partial<LowStockAlerts>>(response.data)));
  };

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
      if (appliedFilters.lowStock === 'true') params.lowStock = 'true';
      if (appliedFilters.categoryId) params.categoryId = appliedFilters.categoryId;

      const response = await api.get('/admin/inventory', { params });
      const data = unwrapApiData<InventoryPagePayload>(response.data) || {};
      const content = Array.isArray(data.content) ? data.content.map(normalizeInventoryProduct) : [];

      setProducts(content);
      setPagination({
        page: Number(data.page || page),
        totalPages: Number(data.totalPages || 1),
        totalElements: Number(data.totalElements || 0),
      });
      setStockDrafts(Object.fromEntries(content.map((product) => [String(product.id), String(product.stock ?? 0)])));
    } catch (requestError: any) {
      const message = requestError?.message || 'Không tải được dữ liệu tồn kho.';
      setError(message);
      pushToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, [page, appliedFilters]);

  useEffect(() => {
    api.get('/categories')
      .then((response) => {
        const data = unwrapApiData<CategoryOption[]>(response.data);
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => pushToast('Không tải được danh mục sản phẩm.', 'error'));

    loadAlerts().catch((requestError: any) => {
      pushToast(requestError?.message || 'Không tải được cảnh báo tồn kho.', 'error');
    });
  }, [pushToast]);

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const saveStock = async (product: InventoryProduct) => {
    const key = String(product.id);
    const nextStock = Number(stockDrafts[key]);
    const currentStock = Number(product.stock || 0);
    const delta = nextStock - currentStock;

    if (!Number.isInteger(nextStock) || nextStock < 0) {
      pushToast('Tồn kho phải là số nguyên không âm.', 'error');
      return;
    }

    if (delta === 0) {
      pushToast('Tồn kho không thay đổi.', 'info');
      return;
    }

    setBusyId(key);
    try {
      await api.post('/admin/inventory/adjust', {
        productId: Number(product.id),
        delta,
        reason: 'Cập nhật từ trang tồn kho admin',
      });
      pushToast(`Đã cập nhật tồn kho ${product.name}.`, 'success');
      await Promise.all([loadInventory(), loadAlerts()]);
    } catch (requestError: any) {
      pushToast(requestError?.message || 'Không cập nhật được tồn kho.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const stats = [
    { label: 'SKU theo bộ lọc', value: formatNumber(pagination.totalElements), hint: 'Sản phẩm trong danh sách', icon: 'SKU' },
    { label: 'Cảnh báo tồn kho', value: formatNumber(lowStockCount), hint: `Dưới ${formatNumber(alerts.threshold)} đơn vị`, tone: 'warning', icon: 'LOW' },
    { label: 'Sản phẩm thấp', value: formatNumber(alerts.products.length), hint: 'Theo stock sản phẩm', icon: 'P' },
    { label: 'Variant thấp', value: formatNumber(alerts.variants.length), hint: 'Theo stock phiên bản', tone: 'warning', icon: 'V' },
  ];

  return (
    <div className="admin-page admin-inventory-page">
      <AdminPageHeader
        eyebrow="Tồn kho"
        title="Theo dõi tồn kho"
        description="Dữ liệu lấy trực tiếp từ backend inventory, gồm danh sách sản phẩm, cảnh báo stock thấp và cập nhật nhanh số lượng."
        action={(
          <div className="admin-page-action-row">
            <Link to="/admin/products" className="btn btn-outline-dark">Catalog</Link>
            <button type="button" className="btn luxury-primary-btn" onClick={() => { void loadInventory(); void loadAlerts(); }}>
              Làm mới
            </button>
          </div>
        )}
      />

      <AdminStatGrid items={stats} />

      <form className="admin-filter-panel admin-inventory-filters" onSubmit={applyFilters}>
        <div className="admin-filter-field">
          <label htmlFor="admin-inventory-low-stock">Cảnh báo</label>
          <select
            id="admin-inventory-low-stock"
            className="form-select"
            value={filters.lowStock}
            onChange={(event) => setFilters((current) => ({ ...current, lowStock: event.target.value }))}
          >
            <option value="">Tất cả</option>
            <option value="true">Sắp hết</option>
          </select>
        </div>
        <div className="admin-filter-field grow">
          <label htmlFor="admin-inventory-category">Danh mục</label>
          <select
            id="admin-inventory-category"
            className="form-select"
            value={filters.categoryId}
            onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <button className="btn luxury-primary-btn" type="submit">Lọc tồn kho</button>
        <button className="btn btn-outline-dark" type="button" onClick={clearFilters}>Xóa lọc</button>
      </form>

      {error && <AdminEmptyState title="Không tải được tồn kho" description={error} />}

      <div className="admin-inventory-grid">
        <section className="admin-table-panel admin-inventory-main">
          <div className="admin-table-title">
            <div>
              <span className="admin-eyebrow">Backend inventory</span>
              <h2>Danh sách tồn kho</h2>
            </div>
            <span>{formatNumber(pageStockTotal)} đơn vị trên trang</span>
          </div>

          {loading ? (
            <div className="admin-loading"><div className="spinner-border" /> Đang tải tồn kho...</div>
          ) : products.length === 0 ? (
            <AdminEmptyState title="Không có dữ liệu phù hợp" description="Thử đổi bộ lọc tồn kho hoặc danh mục." />
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
                      <th>Bán gần nhất</th>
                      <th>Trạng thái</th>
                      <th className="text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const key = String(product.id);
                      const tone = getStockTone(product.stock, alerts.threshold);
                      return (
                        <tr key={key}>
                          <td>
                            <div className="admin-inventory-product">
                              <strong>{product.name}</strong>
                              <small>{product.sku || `#${product.id}`}</small>
                            </div>
                          </td>
                          <td>{product.categoryName || '-'}</td>
                          <td><strong>{formatAdminCurrency(product.price)}</strong></td>
                          <td>
                            <div className="admin-stock-editor">
                              <input
                                type="number"
                                min="0"
                                className="form-control form-control-sm"
                                aria-label={`Tồn kho ${product.name}`}
                                value={stockDrafts[key] ?? ''}
                                onChange={(event) => setStockDrafts((current) => ({ ...current, [key]: event.target.value }))}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                disabled={busyId === key}
                                onClick={() => { void saveStock(product); }}
                              >
                                Lưu
                              </button>
                            </div>
                            <span className={`admin-status-badge ${tone}`}>{getStockLabel(product.stock, alerts.threshold)}</span>
                          </td>
                          <td>{formatAdminDate(product.lastSoldDate)}</td>
                          <td><AdminStatusBadge status={product.status ? 'active' : 'disabled'} /></td>
                          <td className="text-end">
                            <Link className="btn btn-sm btn-outline-dark" to={`/admin/products/${product.id}/edit`}>
                              Chi tiết
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <AdminPagination {...pagination} onChange={setPage} />
            </>
          )}
        </section>

        <aside className="admin-inventory-side">
          <section className="admin-surface-card admin-inventory-alert-card">
            <div className="admin-insight-head">
              <div>
                <span className="admin-eyebrow">Cảnh báo</span>
                <h2>Variant gần hết</h2>
              </div>
              <strong>{formatNumber(alerts.variants.length)}</strong>
            </div>
            <div className="admin-inventory-alert-stack">
              {alerts.variants.length === 0 ? (
                <AdminEmptyState title="Không có variant thấp" description="Backend chưa trả cảnh báo variant dưới ngưỡng." />
              ) : alerts.variants.slice(0, 8).map((variant) => (
                <Link
                  className="admin-inventory-alert-row"
                  to={`/admin/products/${variant.productId}/edit`}
                  key={variant.id}
                >
                  <span>
                    <strong>{variant.productName}</strong>
                    <small>{variant.volumeLabel || 'Phiên bản'} · {variant.sku || 'Chưa có SKU'}</small>
                  </span>
                  <b>{formatNumber(variant.stockQuantity)}</b>
                </Link>
              ))}
            </div>
          </section>

          <section className="admin-surface-card admin-inventory-alert-card">
            <div className="admin-insight-head">
              <div>
                <span className="admin-eyebrow">Sản phẩm</span>
                <h2>Stock sản phẩm thấp</h2>
              </div>
              <strong>{formatNumber(alerts.products.length)}</strong>
            </div>
            <div className="admin-inventory-alert-stack">
              {alerts.products.length === 0 ? (
                <AdminEmptyState title="Không có sản phẩm thấp" description="Các cảnh báo hiện tại đang nằm ở variant." />
              ) : alerts.products.slice(0, 6).map((product) => (
                <Link
                  className="admin-inventory-alert-row"
                  to={`/admin/products/${product.id}/edit`}
                  key={product.id}
                >
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.categoryName || product.sku || 'Chưa phân loại'}</small>
                  </span>
                  <b>{formatNumber(product.stock)}</b>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
