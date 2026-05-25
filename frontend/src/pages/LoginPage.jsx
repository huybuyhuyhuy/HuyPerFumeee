import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaptchaChallenge } from '../components/Auth/CaptchaChallenge';
import { useAuth } from '../hooks/useAuth';

const appMode = typeof __HUY_PERFUME_APP__ === 'undefined' ? 'user' : __HUY_PERFUME_APP__;
const USER_APP_URL = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5177';
const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5178';
const AUTH_TRANSFER_KEY = 'huyperfume-auth-transfer';
const EMPTY_CAPTCHA_PROOF = { captchaToken: '', captchaAnswer: '' };

function isAdminUser(user) {
  return String(user?.role || '').toLowerCase() === 'admin';
}

function cleanUrl(url) {
  return url.replace(/\/$/, '');
}

function getUserHomeUrl() {
  return `${cleanUrl(USER_APP_URL)}/home`;
}

function getAdminHomeUrl() {
  return `${cleanUrl(ADMIN_APP_URL)}/admin`;
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
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaProof, setCaptchaProof] = useState(EMPTY_CAPTCHA_PROOF);
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const updateCaptchaProof = useCallback((nextProof) => setCaptchaProof(nextProof), []);

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
      const authPayload = await login(emailPhone, password, captchaRequired ? captchaProof : undefined);
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
      if (err?.response?.data?.data?.captchaRequired) {
        setCaptchaRequired(true);
        setCaptchaProof(EMPTY_CAPTCHA_PROOF);
        setCaptchaRefreshKey((current) => current + 1);
      }
      setError(err?.response?.data?.message || err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid luxury-page py-4 py-lg-5">
      <div className="row g-4 justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-lg-5 d-none d-lg-block">
          <div className="luxury-surface p-5 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ minHeight: 720 }}>
            <div>
              <p className="text-uppercase luxury-muted small mb-3">The Perfume Shop</p>
              <h1 className="display-6 fw-semibold mb-3">Trải nghiệm đăng nhập sang trọng và nhanh chóng</h1>
              <p className="luxury-muted mb-0">
                Quản lý tài khoản an toàn, chuyển hướng thông minh giữa trang khách hàng và quản trị.
              </p>
            </div>

            <div className="row g-3 mt-4">
              <div className="col-6">
                <div className="rounded-4 border p-3 bg-white bg-opacity-75 h-100">
                  <div className="fw-semibold mb-1">Bảo mật</div>
                  <div className="small text-muted">Xác thực nhanh, trải nghiệm mượt mà.</div>
                </div>
              </div>
              <div className="col-6">
                <div className="rounded-4 border p-3 bg-white bg-opacity-75 h-100">
                  <div className="fw-semibold mb-1">Đồng bộ</div>
                  <div className="small text-muted">Tự động điều hướng đúng vai trò.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5 col-xl-4">
          <div className="luxury-surface p-4 p-lg-5 shadow-sm">
            <div className="mb-4">
              <p className="text-uppercase luxury-muted small mb-2">Welcome back</p>
              <h2 className="mb-2 fw-semibold">Đăng nhập</h2>
              <p className="text-muted mb-0">Sử dụng email hoặc số điện thoại cùng mật khẩu để tiếp tục.</p>
            </div>

            {error && <div className="alert alert-danger border-0 rounded-4">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email hoặc số điện thoại</label>
                <input
                  className="form-control form-control-lg rounded-4"
                  value={emailPhone}
                  onChange={(e) => setEmailPhone(e.target.value)}
                  placeholder="Nhập email hoặc số điện thoại"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Mật khẩu</label>
                <input
                  type="password"
                  className="form-control form-control-lg rounded-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                />
              </div>
              {captchaRequired && (
                <>
                  <div className="auth-captcha-notice mb-3">
                    Bạn đã nhập sai thông tin đăng nhập từ 3 lần. Vui lòng nhập mã xác nhận để tiếp tục.
                  </div>
                  <CaptchaChallenge
                    purpose="login"
                    proof={captchaProof}
                    onChange={updateCaptchaProof}
                    refreshKey={captchaRefreshKey}
                  />
                </>
              )}
              <div className="d-flex justify-content-between align-items-center mb-4 small text-muted">
                <span>Chúng tôi sẽ tự điều hướng theo quyền của bạn.</span>
              </div>
              <button className="btn btn-dark btn-lg w-100 rounded-4" disabled={loading || (captchaRequired && !captchaProof.captchaToken)}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="text-center mt-3">
              <Link to="/register" className="text-decoration-none fw-medium">
                Chưa có tài khoản? Đăng ký ngay
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
