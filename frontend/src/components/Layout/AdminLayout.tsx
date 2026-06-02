import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api, { unwrapApiData } from '../../services/api';

const USER_APP_URL = (import.meta.env.VITE_USER_APP_URL || 'http://localhost:5177').replace(/\/+$/, '');

const adminMenu = [
  { to: '/admin/dashboard', label: 'Dashboard', note: 'Tổng quan vận hành', end: true },
  { to: '/admin/products', label: 'Sản phẩm', note: 'Quản lý catalog' },
  { to: '/admin/orders', label: 'Đơn hàng', note: 'Xử lý đơn & trạng thái' },
  { to: '/admin/users', label: 'Khách hàng', note: 'Tài khoản khách hàng' },
  { to: '/admin/inventory', label: 'Tồn kho', note: 'Theo dõi stock' },
  { to: '/admin/decant', label: 'Decant', note: 'Dung tích chiết' },
  { to: '/admin/voucher', label: 'Voucher', note: 'Ưu đãi & mã giảm' },
  { to: '/admin/audit-logs', label: 'Audit logs', note: 'Theo dõi thay đổi' },
  { to: '/admin/reports', label: 'Báo cáo', note: 'Doanh thu & phân tích' },
  { to: '/admin/settings', label: 'Cài đặt', note: 'Thiết lập hệ thống', disabled: true },
];

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

function getBreadcrumbLabel(pathname: string) {
  if (pathname === '/admin' || pathname === '/admin/dashboard') return 'Dashboard';
  if (pathname.startsWith('/admin/products')) return 'Sản phẩm';
  if (pathname.startsWith('/admin/orders')) return 'Đơn hàng';
  if (pathname.startsWith('/admin/users')) return 'Khách hàng';
  if (pathname.startsWith('/admin/reports')) return 'Báo cáo';
  if (pathname.startsWith('/admin/inventory')) return 'Tồn kho';
  if (pathname.startsWith('/admin/decant')) return 'Decant';
  if (pathname.startsWith('/admin/voucher')) return 'Voucher';
  if (pathname.startsWith('/admin/audit-logs')) return 'Audit logs';
  if (pathname.startsWith('/admin/settings')) return 'Cài đặt';
  return 'Dashboard';
}

function getBreadcrumbDetail(pathname: string) {
  if (pathname.includes('/admin/orders/') && pathname !== '/admin/orders') return 'Chi tiết đơn hàng';
  if (pathname.includes('/admin/products/') && pathname.includes('/edit')) return 'Chỉnh sửa sản phẩm';
  if (pathname.includes('/admin/products/') && !pathname.includes('/edit')) return 'Chi tiết sản phẩm';
  if (pathname.includes('/admin/users/') && pathname !== '/admin/users') return 'Chi tiết khách hàng';
  return '';
}

export function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
    Promise.allSettled([
      api.get('/admin/dashboard/summary', { params: { range: '30d' } }),
      api.get('/admin/inventory/alerts'),
    ])
      .then(([summaryResult, alertsResult]) => {
        if (summaryResult.status === 'fulfilled') {
          const summary = unwrapApiData<any>(summaryResult.value.data) || {};
          setBuyerCount(Number(summary.summary?.totalCustomers || 0));
          setRecentOrders(Array.isArray(summary.recentOrders) ? summary.recentOrders : []);
        } else {
          setBuyerCount(0);
          setRecentOrders([]);
        }

        if (alertsResult.status === 'fulfilled') {
          const alerts = unwrapApiData<any>(alertsResult.value.data) || {};
          setLowStockProducts(Array.isArray(alerts.products) ? alerts.products : []);
          setLowStockVariants(Array.isArray(alerts.variants) ? alerts.variants : []);
        } else {
          setLowStockProducts([]);
          setLowStockVariants([]);
        }

        if (summaryResult.status === 'rejected' || alertsResult.status === 'rejected') {
          setNoticeError('Một phần dữ liệu thông báo chưa tải được, hãy bấm Làm mới để thử lại.');
        }
      })
      .finally(() => setNoticeLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNoticeOpen(false);

    let userMovedPage = false;
    const timers: number[] = [];
    const stopCorrections = () => {
      userMovedPage = true;
    };
    const scrollToWorkspace = (behavior: ScrollBehavior) => {
      if (userMovedPage) return;
      window.scrollTo({ top: 0, left: 0, behavior });
      workspaceRef.current?.focus({ preventScroll: true });
    };

    [0, 90, 320].forEach((delay, index) => {
      timers.push(window.setTimeout(() => scrollToWorkspace(index === 0 ? 'smooth' : 'auto'), delay));
    });

    window.addEventListener('wheel', stopCorrections, { passive: true });
    window.addEventListener('touchstart', stopCorrections, { passive: true });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('wheel', stopCorrections);
      window.removeEventListener('touchstart', stopCorrections);
    };
  }, [location.pathname, location.search]);

  const lowStockCount = lowStockProducts.length + lowStockVariants.length;
  const notificationCount = useMemo(() => lowStockCount + (buyerCount > 0 ? 1 : 0), [buyerCount, lowStockCount]);
  const breadcrumbLabel = getBreadcrumbLabel(location.pathname);
  const breadcrumbDetail = getBreadcrumbDetail(location.pathname);
  const lowStockPreview = [
    ...lowStockProducts.slice(0, 2).map((item) => ({
      key: `product-${item.id}`,
      productId: item.id,
      name: item.name,
      meta: `${formatNumber(item.stock)} sản phẩm còn lại`,
      sku: item.sku,
    })),
    ...lowStockVariants.slice(0, 2).map((item) => ({
      key: `variant-${item.id}`,
      productId: item.productId,
      name: `${item.productName}${item.volumeLabel ? ` - ${item.volumeLabel}` : ''}`,
      meta: `${formatNumber(item.stockQuantity)} phiên bản còn lại`,
      sku: item.sku,
    })),
  ];

  return (
    <div className="huy-admin-shell">
      <aside className={`huy-admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="huy-admin-brand-block">
          <Link className="huy-admin-brand" to="/admin" onClick={() => setMenuOpen(false)}>
            <span className="huy-admin-brand-seal">H</span>
            <span>
              <strong>HuyPerfume</strong>
              <small>Admin Luxury</small>
            </span>
          </Link>
          <button type="button" className="huy-admin-sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Đóng menu">
            ×
          </button>
        </div>

        <div className="huy-admin-admin-card">
          <span className="huy-admin-avatar">{String(user?.name || 'A').charAt(0).toUpperCase()}</span>
          <div>
            <strong>{user?.name || 'Admin'}</strong>
            <small>{user?.email || 'Đang đăng nhập'}</small>
          </div>
        </div>

        <nav className="huy-admin-nav" aria-label="Điều hướng quản trị">
          {adminMenu.map((item) => {
            const className = ({ isActive }: { isActive: boolean }) => [
              'huy-admin-nav-link',
              isActive || (item.to === '/admin/dashboard' && location.pathname === '/admin') ? 'active' : '',
              item.disabled ? 'disabled' : '',
            ].filter(Boolean).join(' ');

            const content = (
              <>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                </span>
                <i aria-hidden="true">›</i>
              </>
            );

            if (item.disabled) {
              return (
                <span key={item.to} className="huy-admin-nav-link disabled" aria-disabled="true">
                  {content}
                </span>
              );
            }

            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={className} onClick={() => setMenuOpen(false)}>
                {content}
              </NavLink>
            );
          })}
        </nav>

        <div className="huy-admin-sidebar-footer">
          <Link className="huy-admin-store-link" to="/home">
            Về cửa hàng
          </Link>
          <button type="button" className="huy-admin-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="huy-admin-content">
        <header className="huy-admin-topbar">
          <div className="huy-admin-topbar-left">
            <button type="button" className="huy-admin-menu-button" onClick={() => setMenuOpen((current) => !current)} aria-label="Mở menu admin">
              ☰
            </button>
            <div className="huy-admin-breadcrumb">
              <span>Admin</span>
              <span>/</span>
              <strong>{breadcrumbLabel}</strong>
              {breadcrumbDetail && <><span>/</span><strong>{breadcrumbDetail}</strong></>}
            </div>
          </div>

          <div className="huy-admin-topbar-right">
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
              {notificationCount > 0 && <span className="huy-admin-alert-count">{notificationCount > 99 ? '99+' : notificationCount}</span>}
            </button>
          </div>

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
                <Link to="/admin/inventory" onClick={() => setNoticeOpen(false)}>
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
                  <Link className="huy-admin-notice-row" to={`/admin/orders/${order.id}`} key={order.id} onClick={() => setNoticeOpen(false)}>
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
                  <Link to="/admin/inventory" onClick={() => setNoticeOpen(false)}>Xem kho</Link>
                </div>
                {noticeLoading ? (
                  <p className="huy-admin-notice-muted">Đang kiểm tra tồn kho...</p>
                ) : lowStockPreview.length === 0 ? (
                  <p className="huy-admin-notice-muted">Không có sản phẩm gần hết.</p>
                ) : lowStockPreview.map((item) => (
                  <Link className="huy-admin-notice-row warning" to={`/admin/products/${item.productId}/edit`} key={item.key} onClick={() => setNoticeOpen(false)}>
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
        </header>

        <main ref={workspaceRef} id="admin-main-content" tabIndex={-1} className="huy-admin-workspace">
          <Outlet />
        </main>
      </div>

      {menuOpen && <div className="huy-admin-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
    </div>
  );
}
