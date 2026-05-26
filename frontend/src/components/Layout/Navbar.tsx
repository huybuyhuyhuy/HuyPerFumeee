import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useWishlist } from '../../store/WishlistContext';
import { productService } from '../../services/productService';

const navLinks = [
  { to: '/home', label: 'Trang chủ' },
  { to: '/products', label: 'Sản phẩm' },
  { to: '/home#contact', label: 'Liên hệ' },
];
const ADMIN_APP_URL = (import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5178').replace(/\/+$/, '');
const NAVBAR_TOP_THRESHOLD = 12;

type NavbarCategory = {
  id: string;
  name: string;
  productCount: number;
};

function SearchIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>); }
function HeartIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.4 5.6c-1.6-1.7-4.2-1.7-5.8 0L12 8.2 9.4 5.6c-1.6-1.7-4.2-1.7-5.8 0-1.8 1.8-1.8 4.7 0 6.5L12 20l8.4-7.9c1.8-1.8 1.8-4.7 0-6.5Z" /></svg>); }
function BagIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 8.5h11l.8 11H5.7l.8-11Z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></svg>); }
function ShieldIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 5 6v5c0 4.4 2.8 7.7 7 10 4.2-2.3 7-5.6 7-10V6z" /><path d="m9.4 12 1.7 1.8 3.8-4.1" /></svg>); }
function TruckIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 7h11v10H3z" /><path d="M14 10h4l3 3v4h-7z" /><path d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>); }
function GiftIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 10h16v10H4z" /><path d="M4 10h16V6H4z" /><path d="M12 6v14" /><path d="M12 6c-1-3-5-4-6-2.1C5.2 5.7 8 6 12 6Z" /><path d="M12 6c1-3 5-4 6-2.1.8 1.8-2 2.1-6 2.1Z" /></svg>); }
function MenuIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" /></svg>); }
function CloseIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg>); }
function ChevronIcon() { return (<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 10 5 5 5-5" /></svg>); }

function isNavLinkActive(pathname: string, search: string, hash: string, to: string) {
  const categoryId = new URLSearchParams(search).get('categoryId');

  if (to === '/home') return pathname === '/home' && hash !== '#contact';
  if (to === '/home#contact') return pathname === '/home' && hash === '#contact';
  return pathname.startsWith('/products') && !(pathname === '/products' && categoryId);
}

export function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const { count } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<NavbarCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/home'); };

  useEffect(() => {
    const onScroll = () => {
      const movedFromTop = window.scrollY > NAVBAR_TOP_THRESHOLD;
      setScrolled(movedFromTop);
      setHidden(movedFromTop);
      if (movedFromTop) setCategoriesOpen(false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    let active = true;

    productService
      .getCategories()
      .then((data) => {
        if (!active) return;
        setCategories(
          (Array.isArray(data) ? data : [])
            .map((category) => ({
              id: String(category?.id || '').trim(),
              name: String(category?.name || '').trim(),
              productCount: Number(category?.productCount || 0),
            }))
            .filter((category) => category.id && category.name)
        );
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('navbar-menu-open', mobileOpen);
    return () => document.body.classList.remove('navbar-menu-open');
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen && !categoriesOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setCategoriesOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen, categoriesOpen]);

  const accountLabel = useMemo(() => (isLoggedIn ? user?.name || 'Tài khoản' : 'Tài khoản'), [isLoggedIn, user?.name]);
  const activeCategoryId = new URLSearchParams(location.search).get('categoryId');
  const categoryActive = location.pathname === '/products' && Boolean(activeCategoryId);

  return (
    <nav className={`navbar navbar-expand-lg luxury-navbar sticky-top ${scrolled ? 'is-scrolled' : ''} ${hidden && !mobileOpen ? 'is-hidden' : ''} ${mobileOpen ? 'is-menu-open' : ''}`}>
      <div className="luxury-navbar-topbar">
        <div className="container luxury-navbar-topbar-inner">
          <div className="luxury-navbar-benefits" aria-label="Cam kết dịch vụ">
            <span><ShieldIcon /> Chính hãng 100%</span>
            <span className="d-none d-md-inline-flex"><TruckIcon /> Giao nhanh toàn quốc</span>
            <span className="d-none d-xl-inline-flex"><GiftIcon /> Gói quà tinh tế</span>
          </div>
          <a className="luxury-navbar-support" href="tel:0900000000">
            <span className="d-none d-sm-inline">Tư vấn:</span> 0900 000 000
          </a>
        </div>
      </div>

      <div className="container luxury-navbar-main py-2 py-lg-3">
        <Link className="navbar-brand luxury-brand d-flex align-items-center gap-2" to="/home" aria-label="HuyPerfume">
          <span className="luxury-brand-mark">
            <img src="/assets/icon/logo.png" alt="" width="38" height="38" />
          </span>
          <span className="luxury-brand-copy">
            <strong>HuyPerfume</strong>
            <small>Luxury fragrance boutique</small>
          </span>
        </Link>

        <button
          className="navbar-toggler luxury-navbar-toggler shadow-none"
          type="button"
          aria-label="Mở menu"
          aria-expanded={mobileOpen}
          aria-controls="navbarNav"
          onClick={() => setMobileOpen((value) => !value)}
        >
          <MenuIcon />
        </button>

        <div className={`navbar-shell ${mobileOpen ? 'is-open' : ''}`} id="navbarNav">
          <div className="navbar-shell-header d-lg-none">
            <div>
              <span className="navbar-shell-kicker">HuyPerfume</span>
              <strong>Menu</strong>
            </div>
            <button type="button" className="icon-pill navbar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
              <CloseIcon />
            </button>
          </div>

          <ul className="navbar-nav luxury-nav mx-lg-auto gap-lg-1">
            {navLinks.slice(0, 2).map((item) => {
              const active = isNavLinkActive(location.pathname, location.search, location.hash, item.to);

              return (
                <li className="nav-item" key={item.label}>
                  <Link className={`nav-link luxury-nav-link ${active ? 'active' : ''}`} to={item.to} aria-current={active ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className={`nav-item luxury-category-nav ${categoriesOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className={`nav-link luxury-nav-link luxury-category-trigger ${categoryActive ? 'active' : ''}`}
                aria-expanded={categoriesOpen}
                aria-controls="navbar-categories"
                onClick={() => setCategoriesOpen((value) => !value)}
              >
                Danh mục
                <ChevronIcon />
              </button>
              <ul className="luxury-category-menu" id="navbar-categories">
                {categoriesLoading && <li className="luxury-category-status">Đang tải danh mục...</li>}
                {!categoriesLoading && categories.length === 0 && <li className="luxury-category-status">Chưa có danh mục</li>}
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      to={`/products?categoryId=${encodeURIComponent(category.id)}`}
                      className={activeCategoryId === category.id ? 'active' : ''}
                      onClick={() => {
                        setCategoriesOpen(false);
                        setMobileOpen(false);
                      }}
                    >
                      <span>{category.name}</span>
                      <small>{category.productCount} sản phẩm</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            {navLinks.slice(2).map((item) => {
              const active = isNavLinkActive(location.pathname, location.search, location.hash, item.to);

              return (
                <li className="nav-item" key={item.label}>
                  <Link className={`nav-link luxury-nav-link ${active ? 'active' : ''}`} to={item.to} aria-current={active ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="navbar-actions ms-lg-auto mt-3 mt-lg-0">
            <div className="navbar-mobile-promise d-lg-none">
              <strong>Trải nghiệm boutique</strong>
              <span>Chính hãng, đóng gói tinh tế, hỗ trợ mỗi ngày.</span>
            </div>

            <div className="navbar-quick-actions">
              <Link className="icon-pill navbar-search-action text-decoration-none" to="/products" aria-label="Tìm kiếm sản phẩm">
                <SearchIcon />
                <span className="navbar-search-label">Tìm mùi hương</span>
                <span className="navbar-mobile-label">Tìm kiếm</span>
              </Link>
              <Link className="icon-pill text-decoration-none" to="/wishlist" aria-label="Yêu thích">
                <HeartIcon />
                <span className="navbar-mobile-label">Yêu thích</span>
                {count > 0 && <span className="icon-pill-badge">{count}</span>}
              </Link>
              <Link className="icon-pill text-decoration-none" to="/cart" aria-label="Giỏ hàng">
                <BagIcon />
                <span className="navbar-mobile-label">Giỏ hàng</span>
              </Link>
            </div>

            <div className="navbar-auth-actions">
              {isLoggedIn ? (
                <div className="dropdown">
                  <button className="btn luxury-account-btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <span className="d-none d-md-inline">{accountLabel}</span>
                    <span className="d-inline d-md-none">Tài khoản</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end luxury-dropdown shadow-sm border-0">
                    <li><Link className="dropdown-item" to="/profile">Tài khoản</Link></li>
                    <li><Link className="dropdown-item" to="/orders">Đơn hàng</Link></li>
                    {isAdmin && <li><a className="dropdown-item" href={`${ADMIN_APP_URL}/admin`}>Quản trị</a></li>}
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
      </div>
    </nav>
  );
}
