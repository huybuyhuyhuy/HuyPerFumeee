import { useEffect, useState } from 'react';
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
    totalRevenue: 68837000,
    totalOrders: 12485,
    totalCustomers: 4263,
    totalProducts: 326,
    lowStockCount: 18,
    completionRate: 78,
    refundRate: 2,
    averageOrderValue: 1650000,
  },
  trend: {
    revenueGrowth: 12,
    orderGrowth: 8,
    customerGrowth: 5,
    productGrowth: 3,
  },
  revenueSeries: [
    { date: '2026-05-01', revenue: 4200000, orders: 32, customers: 18 },
    { date: '2026-05-05', revenue: 6100000, orders: 44, customers: 27 },
    { date: '2026-05-10', revenue: 5300000, orders: 37, customers: 21 },
    { date: '2026-05-15', revenue: 7800000, orders: 52, customers: 33 },
    { date: '2026-05-20', revenue: 8600000, orders: 58, customers: 36 },
    { date: '2026-05-25', revenue: 9400000, orders: 63, customers: 39 },
  ],
  topProducts: [
    { id: 1, name: 'Dior Sauvage EDP', image: '/assets/images/1.webp', revenue: 18600000, totalSold: 64, price: 2950000 },
    { id: 2, name: 'Chanel Coco Mademoiselle', image: '/assets/images/9.webp', revenue: 15200000, totalSold: 42, price: 3650000 },
    { id: 3, name: 'YSL Libre', image: '/assets/images/14.webp', revenue: 12100000, totalSold: 38, price: 3200000 },
  ],
  topCategories: [
    { id: 1, name: 'Nước hoa nam', totalSold: 128 },
    { id: 2, name: 'Nước hoa nữ', totalSold: 104 },
    { id: 3, name: 'Luxury collection', totalSold: 72 },
  ],
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

function chartLabel(value, range) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  if (range === '12m' || range === '90d') {
    return `T${date.getMonth() + 1}`;
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function productFallbackImage(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
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
        setError(err?.message || 'Không tải được báo cáo. Đang hiển thị dữ liệu mẫu.');
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

  const stats = [
    { label: 'Doanh thu', value: formatAdminCurrency(summary.totalRevenue), hint: `${formatGrowth(trend.revenueGrowth)} so với kỳ trước`, tone: 'positive', icon: 'VND' },
    { label: 'Đơn hàng', value: formatNumber(summary.totalOrders), hint: `${formatGrowth(trend.orderGrowth)} tăng trưởng`, icon: 'ORD' },
    { label: 'Khách hàng', value: formatNumber(summary.totalCustomers), hint: `${formatGrowth(trend.customerGrowth)} khách mới`, icon: 'CUS' },
    { label: 'Tỉ lệ hoàn tất', value: `${formatNumber(summary.completionRate)}%`, hint: `Hoàn tiền ${formatNumber(summary.refundRate)}%`, tone: 'positive', icon: 'OK' },
  ];

  return (
    <div className="admin-page huy-admin-ops-page">
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
          <div className="admin-report-chart" role="img" aria-label="Biểu đồ báo cáo doanh thu">
            {series.map((item, index) => (
              <div className="admin-report-chart-item" key={`${item.date}-${item.revenue}`}>
                <span
                  style={{
                    height: `${Math.max((Number(item.revenue || 0) / maxRevenue) * 100, 8)}%`,
                    '--bar-delay': `${index * 65}ms`,
                  }}
                >
                  <i>{formatAdminCurrency(item.revenue)}</i>
                </span>
                <small>{chartLabel(item.date, range)}</small>
              </div>
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
            {topProducts.slice(0, 5).map((product) => (
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

        <article className="admin-insight-card">
          <div className="admin-insight-head compact">
            <div>
              <span className="admin-eyebrow">Danh mục</span>
              <h2>Danh mục nổi bật</h2>
            </div>
          </div>
          <div className="admin-category-bars report">
            {topCategories.length === 0 ? <span className="admin-muted">Chưa có dữ liệu</span> : topCategories.map((item) => (
              <div className="admin-category-bar" key={item.id || item.name}>
                <div>
                  <span>{item.name}</span>
                  <strong>{formatNumber(item.totalSold)}</strong>
                </div>
                <i><span style={{ width: `${Math.min(Math.max(Number(item.totalSold || 0), 8), 100)}%` }} /></i>
              </div>
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
