import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AdminEmptyState, AdminStatusBadge } from '../components/Admin/AdminUi';
import { DEFAULT_PRODUCT_IMAGE, resolveProductImage } from '../utils/image';

const EMPTY_DASHBOARD = {
  totalRevenue: 0,
  totalOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  averageOrderValue: 0,
  totalUsers: 0,
  newUsersThisMonth: 0,
  totalProducts: 0,
  lowStockProducts: 0,
  charts: { revenue: [], orders: [], users: [] },
  trend: { revenueGrowth: 0, orderGrowth: 0, customerGrowth: 0, productGrowth: 0 },
  topProducts: [],
  recentOrders: [],
};

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return `${Math.round(asNumber(value)).toLocaleString('vi-VN')}₫`;
}

function formatNumber(value) {
  return Math.round(asNumber(value)).toLocaleString('vi-VN');
}

function formatGrowth(value) {
  const number = asNumber(value);
  return `${number > 0 ? '+' : ''}${number}%`;
}

function formatMonth(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function mergeMonthlyCharts(charts = {}) {
  const orders = new Map(asArray(charts.orders).map((row) => [String(row.monthStart), asNumber(row.orders)]));
  const users = new Map(asArray(charts.users).map((row) => [String(row.monthStart), asNumber(row.users)]));
  const months = new Set([
    ...asArray(charts.revenue).map((row) => String(row.monthStart)),
    ...orders.keys(),
    ...users.keys(),
  ]);

  return [...months]
    .filter(Boolean)
    .sort()
    .map((monthStart) => {
      const revenueRow = asArray(charts.revenue).find((row) => String(row.monthStart) === monthStart);
      return {
        monthStart,
        revenue: asNumber(revenueRow?.revenue),
        orders: orders.get(monthStart) || 0,
        users: users.get(monthStart) || 0,
      };
    });
}

function productFallbackImage(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
}

function MetricCard({ metric }) {
  return (
    <article className="huy-admin-metric-card">
      <div className="huy-admin-metric-head">
        <span>{metric.label}</span>
        <i className={`huy-admin-metric-icon ${metric.tone}`} aria-hidden="true">{metric.icon}</i>
      </div>
      <strong>{metric.value}</strong>
      <div className="huy-admin-metric-meta">
        <small>{metric.hint}</small>
        {metric.delta !== undefined && <span className={metric.delta >= 0 ? 'positive' : 'negative'}>{formatGrowth(metric.delta)}</span>}
      </div>
      <Link to={metric.to}>Xem chi tiết <span aria-hidden="true">↗</span></Link>
    </article>
  );
}

function RevenueChart({ rows }) {
  const hasData = rows.some((row) => row.revenue > 0 || row.orders > 0 || row.users > 0);
  const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1);
  const maxOrders = Math.max(...rows.map((row) => row.orders), 1);

  if (!hasData) {
    return <AdminEmptyState title="Chưa có dữ liệu biểu đồ" description="Khi có đơn hàng hoặc user mới, biểu đồ sẽ tự cập nhật." />;
  }

  return (
    <>
      <div className="huy-admin-profit-chart" role="img" aria-label="Biểu đồ doanh thu và đơn hàng theo tháng" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(52px, 1fr))` }}>
        {rows.map((row, index) => (
          <div className={`huy-admin-profit-month${index === rows.length - 1 ? ' active' : ''}`} key={row.monthStart}>
            <div className="huy-admin-bar-pair">
              {index === rows.length - 1 && <span className="huy-admin-chart-tooltip">{formatCurrency(row.revenue)}</span>}
              <span
                className="huy-admin-bar sales"
                title={`${formatNumber(row.orders)} đơn`}
                style={{
                  height: `${Math.max((row.orders / maxOrders) * 100, row.orders ? 8 : 0)}%`,
                  '--bar-delay': `${index * 70}ms`,
                }}
              />
              <span
                className="huy-admin-bar revenue"
                title={formatCurrency(row.revenue)}
                style={{
                  height: `${Math.max((row.revenue / maxRevenue) * 100, row.revenue ? 10 : 0)}%`,
                  '--bar-delay': `${index * 70 + 45}ms`,
                }}
              />
            </div>
            <small title={`${formatNumber(row.users)} user mới`}>{formatMonth(row.monthStart)}</small>
          </div>
        ))}
      </div>
      <div className="huy-admin-legends">
        <span><i className="sales" /> Đơn hàng</span>
        <span><i className="revenue" /> Doanh thu</span>
      </div>
    </>
  );
}

function TopProducts({ products }) {
  if (!products.length) {
    return <AdminEmptyState title="Chưa có sản phẩm bán chạy" description="Top sản phẩm sẽ xuất hiện khi có order_items từ các đơn hợp lệ." />;
  }

  return (
    <div className="huy-admin-product-list">
      {products.map((product) => (
        <article className="huy-admin-product" key={product.id}>
          <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" onError={productFallbackImage} />
          <div>
            <strong>{product.name}</strong>
            <small>{formatNumber(product.soldQuantity ?? product.totalSold)} đã bán · {formatCurrency(product.revenue)}</small>
          </div>
          <b>{formatCurrency(product.discountPrice > 0 ? product.discountPrice : product.price)}</b>
        </article>
      ))}
    </div>
  );
}

function RecentOrders({ orders }) {
  if (!orders.length) {
    return <AdminEmptyState title="Chưa có đơn hàng gần đây" description="Đơn mới sẽ hiển thị tại đây sau khi khách checkout." />;
  }

  return (
    <div className="huy-admin-recent-list">
      {orders.map((order) => (
        <article className="huy-admin-recent-order" key={order.id}>
          <div>
            <strong>#{order.id}</strong>
            <span>{order.userName || 'Khách vãng lai'}</span>
          </div>
          <AdminStatusBadge status={order.status} />
          <b>{formatCurrency(order.total)}</b>
          <time>{formatDateTime(order.createdAt)}</time>
        </article>
      ))}
    </div>
  );
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.allSettled([
      api.get('/admin/dashboard'),
      api.get('/admin/dashboard/summary', { params: { range: '30d' } }),
    ])
      .then(([dashboardResult, summaryResult]) => {
        if (dashboardResult.status === 'rejected') throw dashboardResult.reason;
        const data = unwrapApiData(dashboardResult.value.data) || {};
        const summaryData = summaryResult.status === 'fulfilled' ? unwrapApiData(summaryResult.value.data) || {} : {};
        setDashboard({
          ...EMPTY_DASHBOARD,
          ...data,
          charts: { ...EMPTY_DASHBOARD.charts, ...(data.charts || {}) },
          trend: { ...EMPTY_DASHBOARD.trend, ...(data.trend || {}), ...(summaryData.trend || {}) },
          topProducts: asArray(data.topProducts),
          recentOrders: asArray(data.recentOrders),
        });
      })
      .catch((err) => setError(err?.message || 'Không tải được dashboard admin.'))
      .finally(() => setLoading(false));
  }, []);

  const chartRows = useMemo(() => mergeMonthlyCharts(dashboard.charts), [dashboard.charts]);
  const metrics = [
    {
      label: 'Doanh thu',
      value: formatCurrency(dashboard.totalRevenue),
      delta: dashboard.trend?.revenueGrowth,
      hint: 'Đơn đã giao, hoàn tất hoặc thanh toán hợp lệ',
      icon: '₫',
      tone: 'gold',
      to: '/admin/orders',
    },
    {
      label: 'Tổng đơn',
      value: formatNumber(dashboard.totalOrders),
      delta: dashboard.trend?.orderGrowth ?? dashboard.orderGrowth,
      hint: `${formatNumber(dashboard.completedOrders)} đơn hoàn thành`,
      icon: '↗',
      tone: 'sage',
      to: '/admin/orders',
    },
    {
      label: 'Đơn hoàn thành',
      value: formatNumber(dashboard.completedOrders),
      hint: 'Đã giao / hoàn tất',
      icon: '✓',
      tone: 'blue',
      to: '/admin/orders',
    },
    {
      label: 'Đơn hủy',
      value: formatNumber(dashboard.cancelledOrders),
      hint: 'Đơn đã hủy hoặc thất bại',
      icon: '↺',
      tone: 'rose',
      to: '/admin/orders',
    },
    {
      label: 'Giá trị đơn TB',
      value: formatCurrency(dashboard.averageOrderValue),
      hint: 'Tính trên đơn có doanh thu',
      icon: 'Ø',
      tone: 'gold',
      to: '/admin/reports',
    },
    {
      label: 'User mới tháng này',
      value: formatNumber(dashboard.newUsersThisMonth),
      delta: dashboard.trend?.customerGrowth,
      hint: `${formatNumber(dashboard.totalUsers)} user đang theo dõi`,
      icon: '●',
      tone: 'blue',
      to: '/admin/users',
    },
    {
      label: 'Sản phẩm sắp hết',
      value: formatNumber(dashboard.lowStockProducts ?? dashboard.lowStockCount),
      hint: `${formatNumber(dashboard.totalProducts)} sản phẩm đang bán`,
      icon: '!',
      tone: 'rose',
      to: '/admin/inventory',
    },
  ];

  return (
    <div className="huy-admin-dashboard">
      <section className="huy-admin-welcome">
        <div>
          <p className="huy-admin-eyebrow">Tổng quan</p>
          <h1>Dashboard quản trị</h1>
          <p>Theo dõi doanh thu, đơn hàng, user, tồn kho và sản phẩm bán chạy từ dữ liệu SQL Server.</p>
        </div>
        <div className="huy-admin-welcome-controls">
          {loading && <span className="huy-admin-sync">Đang đồng bộ...</span>}
          <Link to="/admin/reports" className="huy-admin-export">
            <span aria-hidden="true">↗</span>
            Báo cáo
          </Link>
        </div>
      </section>

      {error && <p className="huy-admin-data-note">{error}</p>}

      <section className="huy-admin-metrics" aria-label="Chỉ số dashboard">
        {metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}
      </section>

      <div className="huy-admin-dashboard-grid">
        <section className="huy-admin-panel huy-admin-profit">
          <div className="huy-admin-panel-head">
            <div>
              <p className="huy-admin-eyebrow">Biểu đồ</p>
              <h2>Doanh thu, đơn hàng và user mới</h2>
            </div>
            <span className="huy-admin-change">6 tháng</span>
          </div>
          <div className="huy-admin-profit-summary">
            <strong>{formatCurrency(dashboard.totalRevenue)}</strong>
            <span>{formatNumber(dashboard.totalOrders)} đơn</span>
          </div>
          <RevenueChart rows={chartRows} />
        </section>

        <section className="huy-admin-panel huy-admin-products">
          <div className="huy-admin-panel-head compact">
            <div>
              <p className="huy-admin-eyebrow">Sản phẩm</p>
              <h2>Top sản phẩm bán chạy</h2>
            </div>
            <Link to="/admin/products">Xem tất cả</Link>
          </div>
          <TopProducts products={dashboard.topProducts.slice(0, 5)} />
        </section>

        <section className="huy-admin-panel huy-admin-recent-orders">
          <div className="huy-admin-panel-head compact">
            <div>
              <p className="huy-admin-eyebrow">Đơn hàng</p>
              <h2>Đơn mới gần đây</h2>
            </div>
            <Link to="/admin/orders">Quản lý đơn</Link>
          </div>
          <RecentOrders orders={dashboard.recentOrders.slice(0, 8)} />
        </section>
      </div>
    </div>
  );
}
