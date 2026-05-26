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
    <main className="luxury-page auth-page-shell">
      <div className="container auth-page-container">
        <div className="auth-page-grid">
          <section className="auth-hero-panel luxury-surface">
            <p className="auth-eyebrow">The Perfume Shop</p>
            <h1>Đăng nhập gọn gàng, sang hơn và không vỡ form</h1>
            <p className="auth-hero-copy">
              Một layout rõ ràng, dễ đọc, tối ưu cho cả màn hình lớn lẫn mobile để người dùng đăng nhập nhanh và an toàn.
            </p>

            <div className="auth-benefit-grid">
              <article>
                <strong>Bảo mật</strong>
                <span>Đăng nhập an toàn, hỗ trợ CAPTCHA khi cần.</span>
              </article>
              <article>
                <strong>Đúng vai trò</strong>
                <span>Tự điều hướng giữa khách hàng và quản trị.</span>
              </article>
            </div>

            <div className="auth-trust-strip">
              <span>HTTPS ready</span>
              <span>Responsive</span>
              <span>Accessible</span>
            </div>
          </section>

          <section className="auth-form-panel luxury-surface">
            <div className="auth-form-header">
              <p className="auth-eyebrow">Welcome back</p>
              <h2>Đăng nhập</h2>
              <p>Sử dụng email hoặc số điện thoại cùng mật khẩu để tiếp tục.</p>
            </div>

            {error && <div className="auth-alert" role="alert">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Email hoặc số điện thoại</span>
                <input
                  type="text"
                  value={emailPhone}
                  onChange={(e) => setEmailPhone(e.target.value)}
                  placeholder="Nhập email hoặc số điện thoại"
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                <span>Mật khẩu</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                />
              </label>

              {captchaRequired && (
                <div className="auth-captcha-wrap">
                  <div className="auth-captcha-notice">
                    Bạn đã nhập sai thông tin đăng nhập từ 3 lần. Vui lòng nhập mã xác nhận để tiếp tục.
                  </div>
                  <CaptchaChallenge
                    purpose="login"
                    proof={captchaProof}
                    onChange={updateCaptchaProof}
                    refreshKey={captchaRefreshKey}
                  />
                </div>
              )}

              <div className="auth-form-footnote">Chúng tôi sẽ tự điều hướng theo quyền của bạn.</div>

              <button className="btn btn-dark btn-lg w-100 rounded-4" disabled={loading || (captchaRequired && !captchaProof.captchaToken)}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="auth-register-link">
              <Link to="/register">Chưa có tài khoản? Đăng ký ngay</Link>
            </div>

            <p className="auth-role-note">
              {appMode === 'admin'
                ? 'Tài khoản khách hàng sẽ được chuyển về trang mua hàng.'
                : 'Tài khoản admin sẽ được chuyển thẳng vào trang quản trị.'}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
