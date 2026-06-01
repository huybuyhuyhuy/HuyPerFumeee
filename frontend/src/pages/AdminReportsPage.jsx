import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatGrid,
  AdminStatusBadge,
  formatAdminCurrency,
  formatAdminDate,
} from '../components/Admin/AdminUi';
import { DEFAULT_PRODUCT_IMAGE, resolveProductImage } from '../utils/image';

const RANGE_OPTIONS = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '12m', label: '12 tháng' },
];

const FALLBACK_REPORT = {
  range: '30d',
  generatedAt: new Date().toISOString(),
  summary: {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    completionRate: 0,
    refundRate: 0,
    averageOrderValue: 0,
  },
  trend: {
    revenueGrowth: 0,
    orderGrowth: 0,
    customerGrowth: 0,
    productGrowth: 0,
  },
  revenueSeries: [],
  topProducts: [],
  topCategories: [],
  recentOrders: [],
  alerts: [],
};

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatGrowth(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? '+' : ''}${number}%`;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function chartLabel(value, range) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  if (range === '12m' || range === '90d') return `T${date.getMonth() + 1}`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function chartFullLabel(value, range) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  if (range === '12m' || range === '90d') {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function productFallbackImage(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
}

function ReportChartItem({ item, range, maxRevenue, index }) {
  const revenue = Number(item.revenue || 0);
  const orders = Number(item.orders || 0);
  const customers = Number(item.customers || 0);
  const height = Math.max((revenue / maxRevenue) * 100, revenue > 0 ? 8 : 3);
  const edgeClass = index < 3 ? ' is-start' : '';

  return (
    <div className={`admin-report-chart-item${edgeClass}`} tabIndex={0}>
      <div className="admin-report-chart-tooltip" role="tooltip">
        <strong>{chartFullLabel(item.date, range)}</strong>
        <span><b>Doanh thu</b>{formatAdminCurrency(revenue)}</span>
        <span><b>Đơn hàng</b>{formatNumber(orders)}</span>
        <span><b>Khách hàng</b>{formatNumber(customers)}</span>
      </div>
      <span
        className="admin-report-chart-bar"
        style={{
          height: `${height}%`,
          '--bar-delay': `${index * 65}ms`,
        }}
        aria-label={`${chartFullLabel(item.date, range)}: ${formatAdminCurrency(revenue)}, ${formatNumber(orders)} đơn hàng`}
      />
      <small>{chartLabel(item.date, range)}</small>
    </div>
  );
}

function CategoryBar({ item, maxSold }) {
  const totalSold = Number(item.totalSold ?? item.total ?? item.quantity ?? 0);
  const percent = maxSold > 0 ? clampPercent((totalSold / maxSold) * 100) : 0;
  const name = item.name || item.category || 'Chưa phân loại';

  return (
    <div className="admin-category-bar report" tabIndex={0}>
      <div>
        <span>{name}</span>
        <strong>{formatNumber(totalSold)} đã bán</strong>
      </div>
      <i aria-label={`${name}: ${formatNumber(totalSold)} sản phẩm đã bán`}>
        <span style={{ width: `${Math.max(percent, totalSold > 0 ? 8 : 0)}%` }} />
      </i>
      <em>{Math.round(percent)}%</em>
      <p className="admin-category-tooltip">
        {name}: {formatNumber(totalSold)} sản phẩm, chiếm {Math.round(percent)}% so với danh mục đứng đầu.
      </p>
    </div>
  );
}

export function AdminReportsPage() {
  const [range, setRange] = useState('30d');
  const [report, setReport] = useState(FALLBACK_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/reports', { params: { range } })
      .then((res) => setReport(unwrapApiData(res.data) || FALLBACK_REPORT))
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Không tải được báo cáo. Đang hiển thị dữ liệu trống.');
        setReport(FALLBACK_REPORT);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [range]);

  const summary = report.summary || {};
  const trend = report.trend || {};
  const series = Array.isArray(report.revenueSeries) ? report.revenueSeries : [];
  const topProducts = Array.isArray(report.topProducts) ? report.topProducts : [];
  const topCategories = Array.isArray(report.topCategories) ? report.topCategories : [];
  const recentOrders = Array.isArray(report.recentOrders) ? report.recentOrders : [];
  const alerts = Array.isArray(report.alerts) ? report.alerts : [];

  const maxRevenue = Math.max(...series.map((item) => Number(item.revenue || 0)), 1);
  const maxCategorySold = Math.max(
    ...topCategories.map((item) => Number(item.totalSold ?? item.total ?? item.quantity ?? 0)),
    0,
  );

  const stats = useMemo(() => [
    { label: 'Doanh thu', value: formatAdminCurrency(summary.totalRevenue), hint: `${formatGrowth(trend.revenueGrowth)} so với kỳ trước`, tone: 'positive', icon: 'VND' },
    { label: 'Đơn hàng', value: formatNumber(summary.totalOrders), hint: `${formatGrowth(trend.orderGrowth)} tăng trưởng`, icon: 'ORD' },
    { label: 'Khách hàng', value: formatNumber(summary.totalCustomers), hint: `${formatGrowth(trend.customerGrowth)} khách mới`, icon: 'CUS' },
    { label: 'Tỉ lệ hoàn tất', value: `${formatNumber(summary.completionRate)}%`, hint: `Hoàn tiền ${formatNumber(summary.refundRate)}%`, tone: 'positive', icon: 'OK' },
  ], [summary, trend]);

  return (
    <div className="admin-page huy-admin-ops-page admin-reports-page">
      <AdminPageHeader
        eyebrow="Báo cáo kinh doanh"
        title="Báo cáo kinh doanh"
        description="Tổng hợp doanh thu, đơn hàng, khách hàng, sản phẩm bán chạy và cảnh báo vận hành."
        action={(
          <div className="admin-page-action-row">
            <select className="form-select admin-range-select" value={range} onChange={(event) => setRange(event.target.value)} aria-label="Chọn khoảng thời gian báo cáo">
              {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" className="btn btn-outline-dark" onClick={load}>Làm mới</button>
            <Link to="/admin/orders" className="btn luxury-primary-btn">Xem đơn hàng</Link>
          </div>
        )}
      />

      {error && <div className="alert alert-warning admin-alert">{error}</div>}
      {loading && <div className="admin-sync-line">Đang đồng bộ báo cáo...</div>}

      <AdminStatGrid items={stats} />

      <section className="admin-report-grid">
        <article className="admin-insight-card admin-report-revenue">
          <div className="admin-insight-head">
            <div>
              <span className="admin-eyebrow">Tổng quan doanh thu</span>
              <h2>Doanh thu theo thời gian</h2>
            </div>
            <strong>{formatAdminCurrency(summary.averageOrderValue)} / đơn</strong>
          </div>
          <div
            className="admin-report-chart"
            role="img"
            aria-label="Biểu đồ báo cáo doanh thu"
            style={{ '--chart-count': Math.max(series.length, 1) }}
          >
            {series.length === 0 ? (
              <AdminEmptyState title="Chưa có dữ liệu biểu đồ" description="Dữ liệu sẽ hiển thị khi có đơn hàng hợp lệ." />
            ) : series.map((item, index) => (
              <ReportChartItem key={`${item.date}-${index}`} item={item} range={range} maxRevenue={maxRevenue} index={index} />
            ))}
          </div>
        </article>

        <article className="admin-insight-card">
          <div className="admin-insight-head compact">
            <div>
              <span className="admin-eyebrow">Cảnh báo tồn kho</span>
              <h2>Cảnh báo</h2>
            </div>
            <strong>{formatNumber(summary.lowStockCount)}</strong>
          </div>
          <div className="admin-alert-list">
            {alerts.length === 0 ? (
              <AdminEmptyState title="Chưa có cảnh báo mới" description="Tồn kho và vận hành đang ổn định." />
            ) : alerts.slice(0, 4).map((item, index) => (
              <div className="admin-alert-row" key={`${item.type}-${item.productId || index}`}>
                <span>{item.severity || 'info'}</span>
                <strong>{item.message}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-insight-card">
          <div className="admin-insight-head compact">
            <div>
              <span className="admin-eyebrow">Sản phẩm bán chạy</span>
              <h2>Bán chạy</h2>
            </div>
          </div>
          <div className="admin-report-product-list">
            {topProducts.length === 0 ? (
              <AdminEmptyState title="Chưa có sản phẩm bán chạy" description="Dữ liệu sẽ hiển thị khi có doanh thu trong khoảng đã chọn." />
            ) : topProducts.slice(0, 5).map((product) => (
              <div className="admin-report-product" key={product.id}>
                <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" onError={productFallbackImage} />
                <div>
                  <strong>{product.name}</strong>
                  <small>{formatNumber(product.totalSold || product.soldQuantity)} đã bán</small>
                </div>
                <b>{formatAdminCurrency(product.revenue || product.price)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-insight-card admin-report-categories">
          <div className="admin-insight-head compact">
            <div>
              <span className="admin-eyebrow">Danh mục</span>
              <h2>Danh mục nổi bật</h2>
            </div>
          </div>
          <div className="admin-category-bars report">
            {topCategories.length === 0 ? (
              <AdminEmptyState title="Chưa có dữ liệu danh mục" description="Danh mục nổi bật sẽ xuất hiện khi có sản phẩm được bán trong kỳ." />
            ) : topCategories.map((item) => (
              <CategoryBar item={item} maxSold={maxCategorySold} key={item.id || item.name || item.category} />
            ))}
          </div>
        </article>

        <article className="admin-insight-card admin-report-orders">
          <div className="admin-insight-head compact">
            <div>
              <span className="admin-eyebrow">Đơn hàng gần đây</span>
              <h2>Đơn mới nhất</h2>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table admin-table align-middle">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Giá trị</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan="5"><AdminEmptyState title="Chưa có đơn gần đây" description="Dữ liệu sẽ xuất hiện khi có đơn hợp lệ." /></td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><Link to={`/admin/orders/${order.id}`}>{order.orderCode || `#${order.id}`}</Link></td>
                    <td>{order.customerName || '-'}</td>
                    <td><strong>{formatAdminCurrency(order.totalAmount)}</strong></td>
                    <td>{formatAdminDate(order.createdAt)}</td>
                    <td><AdminStatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
