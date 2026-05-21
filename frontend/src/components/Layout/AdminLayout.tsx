import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/orders', label: 'Đơn hàng' },
  { to: '/users', label: 'Người dùng' },
];

export function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="container py-4">
      <div className="luxury-surface p-4 p-lg-5 mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <p className="text-uppercase luxury-muted small mb-1">Admin panel</p>
            <h3 className="mb-0">Quản trị HuyPerfume</h3>
            {user?.name && <small className="luxury-muted">Đang đăng nhập: {user.name}</small>}
          </div>
          <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
            {links.map((item) => (
              <Link key={item.to} to={item.to} className="btn btn-outline-dark">
                {item.label}
              </Link>
            ))}
            <button type="button" className="btn luxury-primary-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
