import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { resolveProductImage } from '../utils/image';

const FALLBACK_METRICS = {
  sales: 12485,
  customers: 4263,
  revenue: 68837000,
  refunds: 187,
  profit: 98643240,
  orders: 456370,
};

const FALLBACK_DAY_VALUES = [
  { revenue: 8600000, sales: 6100000 },
  { revenue: 10400000, sales: 7600000 },
  { revenue: 7200000, sales: 5100000 },
  { revenue: 12800000, sales: 9100000 },
  { revenue: 15400000, sales: 11200000 },
  { revenue: 9800000, sales: 7200000 },
  { revenue: 17800000, sales: 13100000 },
];

const FALLBACK_WEEK_VALUES = [
  { revenue: 42000000, sales: 31000000 },
  { revenue: 52000000, sales: 39000000 },
  { revenue: 47000000, sales: 35000000 },
  { revenue: 61000000, sales: 45000000 },
  { revenue: 74000000, sales: 54000000 },
  { revenue: 68000000, sales: 50000000 },
  { revenue: 98643240, sales: 72000000 },
  { revenue: 82000000, sales: 60000000 },
];

const PROFIT_RANGES = {
  day: {
    label: 'Theo ngày',
    apiParams: { range: '7d', groupBy: 'day' },
    fallback: FALLBACK_DAY_VALUES,
  },
  week: {
    label: 'Theo tuần',
    apiParams: { range: '90d', groupBy: 'week' },
    fallback: FALLBACK_WEEK_VALUES,
  },
};

const FALLBACK_PRODUCTS = [
  { id: 'dior', name: 'Dior Sauvage EDP', category: 'Nước hoa nam', price: 2950000, image: '/assets/images/1.webp' },
  { id: 'chanel', name: 'Chanel Coco Mademoiselle', category: 'Eau de Parfum', price: 3650000, image: '/assets/images/9.webp' },
  { id: 'ysl', name: 'YSL Libre', category: 'Nước hoa nữ', price: 3200000, image: '/assets/images/14.webp' },
  { id: 'tom-ford', name: 'Tom Ford Black Orchid', category: 'Luxury collection', price: 4980000, image: '/assets/images/20.webp' },
];

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function formatCurrency(value) {
  return `₫${Math.round(Number(value || 0)).toLocaleString('vi-VN')}`;
}

function formatNumber(value) {
  return Math.round(Number(value || 0)).toLocaleString('vi-VN');
}

function formatDateKey(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function getChartDate(row) {
  return row?.date || row?.period || row?.monthStart || row?.createdAt;
}

function getFallbackDate(mode, index, count) {
  const today = new Date();
  const daysBack = mode === 'week' ? (count - 1 - index) * 7 : count - 1 - index;
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysBack);
}

function getPeriodLabel(date, mode, index) {
  if (mode === 'week') return `Tuần ${index + 1}`;
  const label = date.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getPeriodFullLabel(date, mode) {
  return mode === 'week'
    ? `Tuần bắt đầu ${date.toLocaleDateString('vi-VN')}`
    : date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function normalizeProfitRows(rows = [], mode = 'day') {
  const limit = mode === 'week' ? 8 : 7;
  return rows
    .filter((row) => getChartDate(row))
    .slice(-limit)
    .map((row, index, list) => {
      const date = new Date(getChartDate(row));
      const revenue = Number(row.revenue || 0);
      return {
        key: `${mode}-${formatDateKey(date)}-${index}`,
        label: getPeriodLabel(date, mode, index),
        fullLabel: getPeriodFullLabel(date, mode),
        revenue,
        sales: Math.round(revenue * 0.74),
        active: index === list.length - 1,
      };
    });
}

function buildFallbackPeriods(mode = 'day') {
  const fallback = PROFIT_RANGES[mode].fallback;
  return fallback.map((item, index) => {
    const date = getFallbackDate(mode, index, fallback.length);
    return {
      key: `${mode}-fallback-${index}`,
      label: getPeriodLabel(date, mode, index),
      fullLabel: getPeriodFullLabel(date, mode),
      revenue: item.revenue,
      sales: item.sales,
      active: index === fallback.length - 1,
    };
  });
}

function buildProfitPeriods(rows = [], mode = 'day') {
  const normalized = normalizeProfitRows(rows, mode);
  return normalized.length > 0 ? normalized : buildFallbackPeriods(mode);
}

function normalizeOrderTrend(rows = []) {
  const source = Array.isArray(rows) && rows.length > 0
    ? rows
    : FALLBACK_DAY_VALUES.map((item, index) => ({
        date: getFallbackDate('day', index, FALLBACK_DAY_VALUES.length),
        orders: Math.max(1, Math.round(item.revenue / 1600000)),
        revenue: item.revenue,
      }));

  return source.slice(-14).map((row, index) => {
    const date = new Date(row.date || row.period || row.monthStart || Date.now());
    return {
      key: `order-trend-${formatDateKey(date)}-${index}`,
      date,
      label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      orders: Number(row.orders || row.total || 0),
      revenue: Number(row.revenue || 0),
    };
  });
}

function getOrderSparklineGeometry(points = []) {
  const width = 400;
  const height = 150;
  const padX = 10;
  const padTop = 18;
  const padBottom = 24;
  const maxOrders = Math.max(...points.map((point) => point.orders), 1);
  const minOrders = Math.min(...points.map((point) => point.orders), 0);
  const range = Math.max(maxOrders - minOrders, 1);
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    ...point,
    x: padX + step * index,
    y: padTop + ((maxOrders - point.orders) / range) * (height - padTop - padBottom),
  }));

  if (coords.length === 0) return { linePath: '', fillPath: '', coords };

  const linePath = coords.reduce((path, point, index) => {
    if (index === 0) return `M${point.x} ${point.y}`;
    const previous = coords[index - 1];
    const cpX = (previous.x + point.x) / 2;
    return `${path} C${cpX} ${previous.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  const first = coords[0];
  const last = coords[coords.length - 1];
  const baseline = height - 12;

  return {
    linePath,
    fillPath: `${linePath} L${last.x} ${baseline} L${first.x} ${baseline} Z`,
    coords,
  };
}

function productFallbackImage(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = '/assets/images/1.webp';
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
        <span className={`huy-admin-change ${metric.change.startsWith('-') ? 'down' : ''}`}>{metric.change}</span>
        <small>so với kỳ trước</small>
      </div>
      <Link to={metric.to}>Xem chi tiết <span aria-hidden="true">↗</span></Link>
    </article>
  );
}

function ProfitChart({ periods, mode }) {
  const max = Math.max(...periods.map((period) => period.revenue), 1);

  return (
    <div
      className="huy-admin-profit-chart"
      role="img"
      aria-label={`Biểu đồ tổng quan lợi nhuận ${mode === 'week' ? 'theo tuần' : 'theo ngày'}`}
      style={{ gridTemplateColumns: `repeat(${periods.length}, minmax(42px, 1fr))` }}
    >
      {periods.map((period, index) => (
        <div className={`huy-admin-profit-month${period.active ? ' active' : ''}`} key={period.key}>
          <div className="huy-admin-bar-pair">
            {period.active && <span className="huy-admin-chart-tooltip">{formatCurrency(period.revenue)}</span>}
            <span
              className="huy-admin-bar sales"
              style={{
                height: `${Math.max((period.sales / max) * 100, 8)}%`,
                '--bar-delay': `${index * 70}ms`,
              }}
            />
            <span
              className="huy-admin-bar revenue"
              style={{
                height: `${Math.max((period.revenue / max) * 100, 10)}%`,
                '--bar-delay': `${index * 70 + 45}ms`,
              }}
            />
          </div>
          <small title={period.fullLabel}>{period.label}</small>
        </div>
      ))}
    </div>
  );
}

function OrdersSparkline({ points }) {
  const geometry = getOrderSparklineGeometry(points);
  const lastPoint = geometry.coords[geometry.coords.length - 1];
  const maxOrders = Math.max(...points.map((point) => point.orders), 1);

  return (
    <svg className="huy-admin-orders-chart" viewBox="0 0 400 150" role="img" aria-label="Xu hướng đơn hàng khách hàng">
      <defs>
        <linearGradient id="huyOrdersFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8de55" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#b8de55" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="huy-admin-orders-grid" d="M8 126 H392 M8 86 H392 M8 46 H392" />
      {geometry.fillPath && <path className="huy-admin-orders-fill" d={geometry.fillPath} />}
      {geometry.linePath && <path className="huy-admin-orders-line" d={geometry.linePath} pathLength="1" />}
      {geometry.coords.map((point, index) => (
        <circle
          className="huy-admin-orders-mini-dot"
          cx={point.x}
          cy={point.y}
          r={index === geometry.coords.length - 1 ? 0 : 2.1}
          key={point.key}
          style={{ '--dot-delay': `${index * 55 + 420}ms` }}
        />
      ))}
      {lastPoint && <circle className="huy-admin-orders-dot" cx={lastPoint.x} cy={lastPoint.y} r="6" />}
    </svg>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState({});
  const [profitRange, setProfitRange] = useState('day');
  const [profitRows, setProfitRows] = useState([]);
  const [profitLoading, setProfitLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/admin/dashboard')
      .then((res) => setStats(unwrapApiData(res.data) || {}))
      .catch((err) => setError(err?.message || 'Không tải được dashboard admin. Đang hiển thị dữ liệu mẫu.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const meta = PROFIT_RANGES[profitRange] || PROFIT_RANGES.day;
    setProfitLoading(true);
    api
      .get('/admin/dashboard/charts', { params: meta.apiParams })
      .then((res) => {
        const data = unwrapApiData(res.data) || {};
        setProfitRows(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setProfitRows([]))
      .finally(() => setProfitLoading(false));
  }, [profitRange]);

  const hasApiData = Object.keys(stats).length > 0;
  const periods = useMemo(() => buildProfitPeriods(profitRows, profitRange), [profitRows, profitRange]);
  const products = stats.topProducts?.length > 0
    ? stats.topProducts.slice(0, 4).map((product) => ({
        ...product,
        category: 'Nước hoa cao cấp',
        image: resolveProductImage(product.image),
      }))
    : FALLBACK_PRODUCTS;

  const metrics = [
    {
      label: 'Tổng doanh số',
      value: formatNumber(hasApiData ? stats.totalOrders : FALLBACK_METRICS.sales),
      change: '+3.1%',
      icon: '↗',
      tone: 'sage',
      to: '/admin/orders',
    },
    {
      label: 'Khách hàng',
      value: formatNumber(hasApiData ? stats.totalUsers : FALLBACK_METRICS.customers),
      change: '+1.8%',
      icon: '◎',
      tone: 'blue',
      to: '/admin/users',
    },
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(hasApiData ? stats.totalRevenue : FALLBACK_METRICS.revenue),
      change: '+2.4%',
      icon: '₫',
      tone: 'gold',
      to: '/admin/orders',
    },
    {
      label: 'Yêu cầu hoàn tiền',
      value: formatNumber(hasApiData ? stats.refundedOrders : FALLBACK_METRICS.refunds),
      change: '-0.6%',
      icon: '↺',
      tone: 'rose',
      to: '/admin/orders',
    },
  ];
  const selectedRangeTotal = periods.reduce((sum, period) => sum + Number(period.revenue || 0), 0);
  const profitValue = selectedRangeTotal || Number(stats.totalProfit || (hasApiData ? stats.totalRevenue : FALLBACK_METRICS.profit));
  const customerOrderValue = hasApiData ? stats.totalOrders : FALLBACK_METRICS.orders;
  const orderTrend = useMemo(() => normalizeOrderTrend(stats.orderTrend || stats.charts?.orders || []), [stats.orderTrend, stats.charts?.orders]);
  const rawOrderGrowth = Number(hasApiData ? stats.orderGrowth : 9.4);
  const orderGrowth = Number.isFinite(rawOrderGrowth) ? rawOrderGrowth : 0;
  const latestOrderDay = orderTrend[orderTrend.length - 1];
  const peakOrderDay = orderTrend.reduce((best, point) => (point.orders > best.orders ? point : best), orderTrend[0] || { orders: 0 });

  return (
    <div className="huy-admin-dashboard">
      <section className="huy-admin-welcome">
        <div>
          <p className="huy-admin-eyebrow">Tổng quan</p>
          <h1>Xin chào, Huy</h1>
          <p>Tổng quan doanh thu, đơn hàng, khách hàng và hiệu suất bán nước hoa.</p>
        </div>
        <div className="huy-admin-welcome-controls">
          {(loading || profitLoading) && <span className="huy-admin-sync">Đang đồng bộ...</span>}
          <button type="button" className="huy-admin-export">
            <span aria-hidden="true">↓</span>
            Xuất báo cáo
          </button>
        </div>
      </section>

      {error && <p className="huy-admin-data-note">{error}</p>}

      <section className="huy-admin-metrics" aria-label="Chỉ số kinh doanh">
        {metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}
      </section>

      <div className="huy-admin-dashboard-grid">
        <section className="huy-admin-panel huy-admin-profit">
          <div className="huy-admin-panel-head">
            <div>
              <p className="huy-admin-eyebrow">Hiệu suất</p>
              <h2>Tổng quan lợi nhuận</h2>
            </div>
            <select aria-label="Lọc thời gian" value={profitRange} onChange={(event) => setProfitRange(event.target.value)}>
              {Object.entries(PROFIT_RANGES).map(([value, item]) => (
                <option key={value} value={value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="huy-admin-profit-summary">
            <strong>{formatCurrency(profitValue)}</strong>
            <span className="huy-admin-change">+8.4%</span>
          </div>
          <div className="huy-admin-legends">
            <span><i className="sales" /> Tổng bán</span>
            <span><i className="revenue" /> Tổng doanh thu</span>
          </div>
          <ProfitChart periods={periods} mode={profitRange} />
        </section>

        <section className="huy-admin-panel huy-admin-products">
          <div className="huy-admin-panel-head compact">
            <div>
              <p className="huy-admin-eyebrow">Sản phẩm</p>
              <h2>Sản phẩm bán chạy</h2>
            </div>
            <Link to="/admin/products">Xem tất cả</Link>
          </div>
          <div className="huy-admin-product-list">
            {products.map((product) => (
              <article className="huy-admin-product" key={product.id}>
                <img src={product.image} alt={product.name} loading="lazy" onError={productFallbackImage} />
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.category}</small>
                </div>
                <b>{formatCurrency(product.discountPrice > 0 ? product.discountPrice : product.price)}</b>
              </article>
            ))}
          </div>
        </section>

        <section className="huy-admin-panel huy-admin-orders-overview">
          <div className="huy-admin-panel-head compact">
            <div>
              <p className="huy-admin-eyebrow">Đơn hàng</p>
              <h2>Đơn hàng khách hàng</h2>
            </div>
            <span className={`huy-admin-change ${orderGrowth < 0 ? 'down' : ''}`}>
              {orderGrowth > 0 ? '+' : ''}{orderGrowth}%
            </span>
          </div>
          <strong className="huy-admin-order-total">{formatNumber(customerOrderValue)}</strong>
          <div className="huy-admin-order-stats">
            <span><b>{formatNumber(latestOrderDay?.orders || 0)}</b> hôm nay</span>
            <span><b>{formatNumber(peakOrderDay?.orders || 0)}</b> cao nhất 14 ngày</span>
            <span><b>{formatCurrency(latestOrderDay?.revenue || 0)}</b> doanh thu gần nhất</span>
          </div>
          <OrdersSparkline points={orderTrend} />
        </section>
      </div>
    </div>
  );
}
