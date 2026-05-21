import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const appMode = typeof __HUY_PERFUME_APP__ === 'undefined' ? 'user' : __HUY_PERFUME_APP__;
const USER_APP_URL = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5177';
const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5178';
const AUTH_TRANSFER_KEY = 'huyperfume-auth-transfer';

function isAdminUser(user) {
  return String(user?.role || '').toLowerCase() === 'admin';
}

function cleanUrl(url) {
  return url.replace(/\/$/, '');
}

function getUserHomeUrl() {
  return `${cleanUrl(USER_APP_URL)}/`;
}

function getAdminHomeUrl() {
  return `${cleanUrl(ADMIN_APP_URL)}/`;
}

function transferAuthTo(url, authPayload) {
  window.name = JSON.stringify({
    type: AUTH_TRANSFER_KEY,
    token: authPayload.token,
    user: authPayload.user,
    expiresAt: Date.now() + 30_000,
  });

  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.assign(url);
}

function transferStoredAuthTo(url, user) {
  const token = sessionStorage.getItem('token');
  if (!token) {
    window.location.assign(url);
    return;
  }

  transferAuthTo(url, { token, user });
}

export function LoginPage() {
  const [emailPhone, setEmailPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    if (appMode === 'admin' && !isAdminUser(user)) {
      transferStoredAuthTo(getUserHomeUrl(), user);
      return;
    }

    if (appMode !== 'admin' && isAdminUser(user)) {
      transferStoredAuthTo(getAdminHomeUrl(), user);
      return;
    }

    navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const authPayload = await login(emailPhone, password);
      const loggedInUser = authPayload.user;

      if (appMode === 'admin' && !isAdminUser(loggedInUser)) {
        transferAuthTo(getUserHomeUrl(), authPayload);
        return;
      }

      if (appMode !== 'admin' && isAdminUser(loggedInUser)) {
        transferAuthTo(getAdminHomeUrl(), authPayload);
        return;
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container luxury-page">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="luxury-surface p-4 p-lg-5">
            <p className="text-uppercase luxury-muted small mb-1">Welcome back</p>
            <h3 className="mb-4">Đăng nhập</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email hoặc số điện thoại</label>
                <input className="form-control" value={emailPhone} onChange={(e) => setEmailPhone(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="form-label">Mật khẩu</label>
                <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-dark w-100" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
            <div className="text-center mt-3">
              <Link to="/register" className="text-decoration-none">
                Chưa có tài khoản? Đăng ký
              </Link>
            </div>
            {appMode === 'admin' ? (
              <p className="luxury-muted small text-center mt-3 mb-0">
                Tài khoản khách hàng sẽ được chuyển về trang mua hàng.
              </p>
            ) : (
              <p className="luxury-muted small text-center mt-3 mb-0">
                Tài khoản admin sẽ được chuyển thẳng vào trang quản trị.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
