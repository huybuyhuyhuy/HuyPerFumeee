import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/admin', label: 'Dashboard', description: 'Tổng quan hệ thống' },
  { to: '/admin/products', label: 'Sản phẩm', description: 'Quản lý catalog' },
  { to: '/admin/orders', label: 'Đơn hàng', description: 'Theo dõi xử lý' },
  { to: '/admin/users', label: 'Người dùng', description: 'Tài khoản khách hàng' },
];
const USER_APP_URL = (import.meta.env.VITE_USER_APP_URL || 'http://localhost:5177').replace(/\/+$/, '');

export function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-eyebrow">Admin panel</span>
          <h2>HuyPerfume</h2>
          {user?.name && <small>Xin chào, {user.name}</small>}
        </div>

        <nav className="admin-sidebar-nav" aria-label="Điều hướng quản trị">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </NavLink>
          ))}
        </nav>

        <a className="admin-storefront-link" href={`${USER_APP_URL}/home`}>
          Về trang cửa hàng
        </a>
        <button type="button" className="btn luxury-primary-btn admin-logout-btn mt-auto" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <div className="admin-shell-content">
        <header className="admin-shell-topbar">
          <div>
            <span className="admin-eyebrow">Admin workspace</span>
            <h1>Điều khiển hệ thống</h1>
          </div>
        </header>
        <main className="admin-workspace-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
