import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MONTH_COUNT = 6;

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function formatCurrency(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}₫`;
}

function monthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildRecentMonths(count = MONTH_COUNT) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('vi-VN', { month: 'short' }),
      fullLabel: date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
    };
  });
}

function mergeSeries(rows = [], field) {
  const values = new Map(rows.map((row) => [monthKey(row.monthStart), Number(row[field] || 0)]));
  return buildRecentMonths().map((month) => ({ ...month, value: values.get(month.key) || 0 }));
}

function getDelta(series) {
  const current = series.at(-1)?.value || 0;
  const previous = series.at(-2)?.value || 0;
  if (previous === 0) return current === 0 ? '0%' : '+100%';
  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`;
}

function LineChart({ data, formatter }) {
  const width = 640;
  const height = 220;
  const paddingX = 28;
  const paddingY = 18;
  const max = Math.max(...data.map((item) => item.value), 0);
  const usableHeight = height - paddingY * 2;
  const usableWidth = width - paddingX * 2;
  const points = data.map((item, index) => {
    const x = paddingX + (usableWidth * index) / Math.max(data.length - 1, 1);
    const y = height - paddingY - (max === 0 ? 0 : (item.value / max) * usableHeight);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${path} L ${points.at(-1)?.x || paddingX} ${height - paddingY} L ${points[0]?.x || paddingX} ${height - paddingY} Z`;

  return (
    <div className="admin-chart-shell">
      <svg className="admin-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ doanh thu">
        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = height - paddingY - usableHeight * step;
          return <line key={step} x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="admin-chart-grid-line" />;
        })}
        <path d={areaPath} className="admin-chart-area" />
        <path d={path} className="admin-chart-line" />
        {points.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="4.5" className="admin-chart-dot" />
            <title>{`${point.fullLabel}: ${formatter(point.value)}`}</title>
          </g>
        ))}
      </svg>
      <div className="admin-chart-labels">
        {data.map((item) => (
          <span key={item.key}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, ariaLabel }) {
  const max = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className="admin-bar-chart" role="img" aria-label={ariaLabel}>
      {data.map((item) => {
        const height = max === 0 ? 0 : Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0);
        return (
          <div className="admin-bar-column" key={item.key}>
            <div className="admin-bar-track">
              <div className="admin-bar" style={{ height: `${height}%` }} title={`${item.fullLabel}: ${item.value}`} />
            </div>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/admin/dashboard')
      .then((res) => setStats(unwrapApiData(res.data) || {}))
      .catch((err) => setError(err?.message || 'Không tải được dashboard admin.'))
      .finally(() => setLoading(false));
  }, []);

  const revenueSeries = useMemo(() => mergeSeries(stats.charts?.revenue, 'revenue'), [stats.charts?.revenue]);
  const orderSeries = useMemo(() => mergeSeries(stats.charts?.orders, 'orders'), [stats.charts?.orders]);
  const userSeries = useMemo(() => mergeSeries(stats.charts?.users, 'users'), [stats.charts?.users]);

  const cards = [
    { label: 'Doanh thu', value: formatCurrency(stats.totalRevenue), meta: `${getDelta(revenueSeries)} so với tháng trước` },
    { label: 'Tổng đơn hàng', value: Number(stats.totalOrders || 0).toLocaleString('vi-VN'), meta: `${getDelta(orderSeries)} so với tháng trước` },
    { label: 'Đơn hoàn thành', value: Number(stats.completedOrders || 0).toLocaleString('vi-VN'), meta: 'Đã giao / hoàn tất' },
    { label: 'Giá trị đơn TB', value: formatCurrency(stats.averageOrderValue), meta: 'Trên đơn ghi nhận doanh thu' },
    { label: 'Người dùng', value: Number(stats.totalUsers || 0).toLocaleString('vi-VN'), meta: `+${Number(stats.newUsersThisMonth || 0).toLocaleString('vi-VN')} tháng này` },
    { label: 'Sản phẩm', value: Number(stats.totalProducts || 0).toLocaleString('vi-VN'), meta: 'Đang quản lý' },
  ];

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div className="container luxury-page">
      <div className="luxury-surface p-4 p-lg-5 mb-4">
        <p className="text-uppercase luxury-muted small mb-1">Admin analytics</p>
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end">
          <div>
            <h3 className="mb-2">Quản trị - Dashboard</h3>
            <p className="mb-0 luxury-muted">Tổng hợp vận hành, doanh thu và tăng trưởng người dùng trong 6 tháng gần nhất.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/admin/products" className="btn btn-outline-dark btn-sm">Sản phẩm</Link>
            <Link to="/admin/users" className="btn btn-outline-dark btn-sm">Người dùng</Link>
            <Link to="/admin/orders" className="btn btn-outline-dark btn-sm">Đơn hàng</Link>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        {cards.map((stat) => (
          <div className="col-12 col-sm-6 col-xl-4" key={stat.label}>
            <div className="luxury-surface admin-stat-card p-4 h-100">
              <span className="luxury-muted small">{stat.label}</span>
              <h3 className="mb-2 mt-2">{stat.value}</h3>
              <small className="admin-stat-meta">{stat.meta}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-8">
          <div className="luxury-surface p-4 h-100">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <p className="text-uppercase luxury-muted small mb-1">Revenue</p>
                <h5 className="mb-0">Doanh thu theo tháng</h5>
              </div>
              <strong>{formatCurrency(revenueSeries.at(-1)?.value || 0)}</strong>
            </div>
            <LineChart data={revenueSeries} formatter={formatCurrency} />
          </div>
        </div>

        <div className="col-xl-4">
          <div className="luxury-surface p-4 h-100">
            <div className="mb-3">
              <p className="text-uppercase luxury-muted small mb-1">Orders</p>
              <h5 className="mb-0">Đơn hàng theo tháng</h5>
            </div>
            <BarChart data={orderSeries} ariaLabel="Biểu đồ đơn hàng" />
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-5">
          <div className="luxury-surface p-4 h-100">
            <div className="mb-3">
              <p className="text-uppercase luxury-muted small mb-1">Users</p>
              <h5 className="mb-0">Người dùng mới</h5>
            </div>
            <BarChart data={userSeries} ariaLabel="Biểu đồ người dùng mới" />
          </div>
        </div>

        <div className="col-xl-7">
          <div className="luxury-surface p-4 h-100">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div>
                <p className="text-uppercase luxury-muted small mb-1">Products</p>
                <h5 className="mb-0">Top sản phẩm bán chạy</h5>
              </div>
              <Link to="/admin/products" className="btn btn-outline-dark btn-sm">Quản lý</Link>
            </div>
            {stats.topProducts?.length > 0 ? (
              <div className="admin-top-products">
                {stats.topProducts.map((product, index) => (
                  <div className="admin-top-product" key={product.id}>
                    <span>#{index + 1}</span>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{formatCurrency(product.discountPrice > 0 ? product.discountPrice : product.price)}</small>
                    </div>
                    <b>{Number(product.totalSold || 0).toLocaleString('vi-VN')} đã bán</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="luxury-muted mb-0">Chưa có dữ liệu bán hàng.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
