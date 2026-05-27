import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api, { unwrapApiData } from '../../services/api';

const links = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/orders', label: 'Đơn hàng' },
  { to: '/admin/users', label: 'Khách hàng' },
  { to: '/admin/reports', label: 'Báo cáo' },
  { to: '/admin/products', label: 'Sản phẩm' },
];
const USER_APP_URL = (import.meta.env.VITE_USER_APP_URL || 'http://localhost:5177').replace(/\/+$/, '');

type RecentOrder = {
  id: number;
  orderCode?: string;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
};

type LowStockProduct = {
  id: number;
  sku?: string;
  name: string;
  stock: number;
  categoryName?: string;
};

type LowStockVariant = {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  volumeLabel?: string;
  stockQuantity: number;
};

function formatNumber(value: unknown) {
  return Math.round(Number(value || 0)).toLocaleString('vi-VN');
}

function formatCurrency(value: unknown) {
  return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`;
}

export function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [noticeError, setNoticeError] = useState('');
  const [buyerCount, setBuyerCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [lowStockVariants, setLowStockVariants] = useState<LowStockVariant[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const loadNotifications = () => {
    setNoticeLoading(true);
    setNoticeError('');
    Promise.all([
      api.get('/admin/dashboard/summary', { params: { range: '30d' } }),
      api.get('/admin/inventory/alerts'),
    ])
      .then(([summaryRes, alertsRes]) => {
        const summary = unwrapApiData<any>(summaryRes.data) || {};
        const alerts = unwrapApiData<any>(alertsRes.data) || {};
        setBuyerCount(Number(summary.summary?.totalCustomers || 0));
        setRecentOrders(Array.isArray(summary.recentOrders) ? summary.recentOrders : []);
        setLowStockProducts(Array.isArray(alerts.products) ? alerts.products : []);
        setLowStockVariants(Array.isArray(alerts.variants) ? alerts.variants : []);
      })
      .catch((err) => {
        setNoticeError(err?.message || 'Không tải được thông báo admin.');
      })
      .finally(() => setNoticeLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const lowStockCount = lowStockProducts.length + lowStockVariants.length;
  const notificationCount = useMemo(() => {
    return lowStockCount + (buyerCount > 0 ? 1 : 0);
  }, [buyerCount, lowStockCount]);
  const lowStockPreview = [
    ...lowStockProducts.slice(0, 3).map((item) => ({
      key: `product-${item.id}`,
      productId: item.id,
      name: item.name,
      meta: `${formatNumber(item.stock)} sản phẩm còn lại`,
      sku: item.sku,
    })),
    ...lowStockVariants.slice(0, Math.max(0, 3 - lowStockProducts.length)).map((item) => ({
      key: `variant-${item.id}`,
      productId: item.productId,
      name: `${item.productName}${item.volumeLabel ? ` - ${item.volumeLabel}` : ''}`,
      meta: `${formatNumber(item.stockQuantity)} phiên bản còn lại`,
      sku: item.sku,
    })),
  ];

  return (
    <div className="huy-admin-shell">
      <header className="huy-admin-topbar">
        <div className="huy-admin-brand-wrap">
          <span className="huy-admin-menu-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <NavLink className="huy-admin-brand" to="/admin">
            <span className="huy-admin-brand-seal">H</span>
            <span>
              <strong>HuyPerfume</strong>
              <small>Admin</small>
            </span>
          </NavLink>
        </div>

        <nav className="huy-admin-nav" aria-label="Điều hướng quản trị">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `huy-admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="huy-admin-actions">
          <a className="huy-admin-store-link" href={`${USER_APP_URL}/home`}>
            Cửa hàng
          </a>
          <div className="huy-admin-notification">
            <button
              className="huy-admin-alert-button"
              type="button"
              aria-label="Thông báo admin"
              aria-expanded={noticeOpen}
              onClick={() => setNoticeOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3.8a5.4 5.4 0 0 0-5.4 5.4v3.1L5 15.4v1.1h14v-1.1l-1.6-3.1V9.2A5.4 5.4 0 0 0 12 3.8Z" />
                <path d="M9.8 18a2.25 2.25 0 0 0 4.4 0" />
              </svg>
              <span className="huy-admin-alert-dot" />
              {notificationCount > 0 && (
                <span className="huy-admin-alert-count">{notificationCount > 99 ? '99+' : notificationCount}</span>
              )}
            </button>

            {noticeOpen && (
              <div className="huy-admin-notice-panel" role="dialog" aria-label="Thông báo vận hành">
                <div className="huy-admin-notice-head">
                  <div>
                    <strong>Thông báo vận hành</strong>
                    <small>Khách mua và tồn kho thấp</small>
                  </div>
                  <button type="button" onClick={loadNotifications} disabled={noticeLoading}>
                    Làm mới
                  </button>
                </div>

                {noticeError && <p className="huy-admin-notice-error">{noticeError}</p>}

                <div className="huy-admin-notice-summary">
                  <Link to="/admin/orders" onClick={() => setNoticeOpen(false)}>
                    <span>Người mua 30 ngày</span>
                    <strong>{noticeLoading ? '...' : formatNumber(buyerCount)}</strong>
                  </Link>
                  <Link to="/admin/products" onClick={() => setNoticeOpen(false)}>
                    <span>Sản phẩm gần hết</span>
                    <strong>{noticeLoading ? '...' : formatNumber(lowStockCount)}</strong>
                  </Link>
                </div>

                <div className="huy-admin-notice-section">
                  <div className="huy-admin-notice-title">
                    <span>Đơn mua gần đây</span>
                    <Link to="/admin/orders" onClick={() => setNoticeOpen(false)}>Xem đơn</Link>
                  </div>
                  {noticeLoading ? (
                    <p className="huy-admin-notice-muted">Đang tải dữ liệu...</p>
                  ) : recentOrders.length === 0 ? (
                    <p className="huy-admin-notice-muted">Chưa có đơn mua mới.</p>
                  ) : recentOrders.slice(0, 3).map((order) => (
                    <Link
                      className="huy-admin-notice-row"
                      to={`/admin/orders/${order.id}`}
                      key={order.id}
                      onClick={() => setNoticeOpen(false)}
                    >
                      <span>
                        <strong>{order.customerName || 'Khách hàng'}</strong>
                        <small>{order.orderCode || `ORD-${String(order.id).padStart(6, '0')}`}</small>
                      </span>
                      <b>{formatCurrency(order.totalAmount)}</b>
                    </Link>
                  ))}
                </div>

                <div className="huy-admin-notice-section">
                  <div className="huy-admin-notice-title">
                    <span>Tồn kho cần xử lý</span>
                    <Link to="/admin/products" onClick={() => setNoticeOpen(false)}>Xem kho</Link>
                  </div>
                  {noticeLoading ? (
                    <p className="huy-admin-notice-muted">Đang kiểm tra tồn kho...</p>
                  ) : lowStockPreview.length === 0 ? (
                    <p className="huy-admin-notice-muted">Không có sản phẩm gần hết.</p>
                  ) : lowStockPreview.map((item) => (
                    <Link
                      className="huy-admin-notice-row warning"
                      to={`/admin/products/${item.productId}/edit`}
                      key={item.key}
                      onClick={() => setNoticeOpen(false)}
                    >
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.sku || 'Chưa có SKU'}</small>
                      </span>
                      <b>{item.meta}</b>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="huy-admin-profile">
            <span className="huy-admin-avatar">{String(user?.name || 'H').charAt(0).toUpperCase()}</span>
            <span className="huy-admin-profile-copy">
              <strong>{user?.name || 'Huy Admin'}</strong>
              <small>Quản trị viên</small>
            </span>
          </div>
          <button type="button" className="huy-admin-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="huy-admin-workspace">
        <Outlet />
      </main>
    </div>
  );
}
