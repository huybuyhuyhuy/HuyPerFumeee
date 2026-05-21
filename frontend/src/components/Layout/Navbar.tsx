import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useWishlist } from '../../store/WishlistContext';

const navLinks = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/products?categoryId=4', label: 'Cao cấp' },
  { to: '/products?categoryId=5', label: 'Mini size' },
  { to: '/#contact', label: 'Liên hệ' },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.4 5.6c-1.6-1.7-4.2-1.7-5.8 0L12 8.2 9.4 5.6c-1.6-1.7-4.2-1.7-5.8 0-1.8 1.8-1.8 4.7 0 6.5L12 20l8.4-7.9c1.8-1.8 1.8-4.7 0-6.5Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.5 8.5h11l.8 11H5.7l.8-11Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}

export function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const { count } = useWishlist();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg luxury-navbar sticky-top">
      <div className="container py-2">
        <Link className="navbar-brand luxury-brand d-flex align-items-center gap-2" to="/" aria-label="HuyPerfume">
          <img src="/assets/icon/logo.png" alt="HuyPerfume" width="34" height="34" />
          <span>HuyPerfume</span>
        </Link>

        <button
          className="navbar-toggler luxury-navbar-toggler shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Mở menu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav luxury-nav mx-lg-auto gap-lg-1">
            {navLinks.map((item) => (
              <li className="nav-item" key={item.label}>
                <NavLink
                  className={({ isActive }) => `nav-link luxury-nav-link ${isActive ? 'active' : ''}`}
                  to={item.to}
                  end={item.end}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-lg-center gap-2 gap-lg-3 ms-lg-auto flex-wrap justify-content-end mt-3 mt-lg-0">
            <Link className="icon-pill text-decoration-none" to="/products" aria-label="Tìm kiếm sản phẩm">
              <SearchIcon />
            </Link>
            <Link className="icon-pill text-decoration-none" to="/wishlist" aria-label="Yêu thích">
              <HeartIcon />
              {count > 0 && <span className="icon-pill-badge">{count}</span>}
            </Link>
            <Link className="icon-pill text-decoration-none" to="/cart" aria-label="Giỏ hàng">
              <BagIcon />
            </Link>

            {isLoggedIn ? (
              <div className="dropdown">
                <button className="btn luxury-account-btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-none d-md-inline">{user?.name}</span>
                  <span className="d-inline d-md-none">Tài khoản</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end luxury-dropdown shadow-sm border-0">
                  <li><Link className="dropdown-item" to="/profile">Tài khoản</Link></li>
                  <li><Link className="dropdown-item" to="/orders">Đơn hàng</Link></li>
                  {isAdmin && <li><a className="dropdown-item" href="http://localhost:5178/">Quản trị</a></li>}
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Đăng xuất</button></li>
                </ul>
              </div>
            ) : (
              <>
                <Link className="btn luxury-secondary-btn" to="/login">Đăng nhập</Link>
                <Link className="btn luxury-primary-btn" to="/register">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
