import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CaptchaChallenge } from '../components/Auth/CaptchaChallenge';
import { useAuth } from '../hooks/useAuth';
import { cartService } from '../services/cartService';
import { useToast } from '../store/ToastContext';
import { useWishlist } from '../store/WishlistContext';
import { consumePendingCustomerAction } from '../utils/pendingCustomerAction';

const appMode = typeof __HUY_PERFUME_APP__ === 'undefined' ? 'user' : __HUY_PERFUME_APP__;
const USER_APP_URL = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5177';
const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5178';
const AUTH_TRANSFER_KEY = 'huyperfume-auth-transfer';
const EMPTY_CAPTCHA_PROOF = { captchaToken: '', captchaAnswer: '' };
const ADMIN_ENTER_DELAY_MS = 1400;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [adminEntering, setAdminEntering] = useState(false);
  const [adminTransitionProgress, setAdminTransitionProgress] = useState(0);
  const { login, user } = useAuth();
  const { addToWishlist } = useWishlist();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = typeof location.state?.from === 'string' ? location.state.from : '/';
  const updateCaptchaProof = useCallback((nextProof) => setCaptchaProof(nextProof), []);
  const adminDataLoaded = Math.min(30, Math.round(adminTransitionProgress * 0.3));

  const runPendingCustomerAction = useCallback(async () => {
    const pendingAction = consumePendingCustomerAction();
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'cart') {
        await cartService.addItem(pendingAction.productId, pendingAction.quantity || 1, pendingAction.variantId ?? null);
        pushToast('Đã thêm sản phẩm vào giỏ hàng.', 'success');
        return;
      }

      if (pendingAction.type === 'wishlist') {
        addToWishlist(pendingAction.product);
        pushToast('Đã thêm sản phẩm vào danh sách yêu thích.', 'success');
      }
    } catch (err) {
      pushToast(err?.message || 'Đăng nhập thành công, nhưng chưa thể hoàn tất thao tác vừa chọn.', 'error');
    }
  }, [addToWishlist, pushToast]);

  useEffect(() => {
    if (!adminEntering) {
      setAdminTransitionProgress(0);
      return undefined;
    }

    const startedAt = Date.now();
    const progressIntervalMs = 35;
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt + progressIntervalMs;
      const nextProgress = Math.min(100, Math.round((elapsed / ADMIN_ENTER_DELAY_MS) * 100));
      setAdminTransitionProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
      }
    }, progressIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [adminEntering]);

  useEffect(() => {
    if (!user || loading || adminEntering) return;

    if (appMode === 'admin' && !isAdminUser(user)) {
      transferStoredAuthTo(getUserHomeUrl(), user);
      return;
    }

    if (appMode !== 'admin' && isAdminUser(user)) {
      transferStoredAuthTo(getAdminHomeUrl(), user);
      return;
    }

    navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo, loading, adminEntering]);

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

      if (appMode === 'admin' && isAdminUser(loggedInUser)) {
        setAdminEntering(true);
        await wait(ADMIN_ENTER_DELAY_MS);
        navigate('/', { replace: true });
        return;
      }

      if (appMode !== 'admin' && isAdminUser(loggedInUser)) {
        setAdminEntering(true);
        await wait(ADMIN_ENTER_DELAY_MS);
        transferAuthTo(getAdminHomeUrl(), authPayload);
        return;
      }

      await runPendingCustomerAction();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setAdminEntering(false);
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
    <>
      {adminEntering && (
        <div className="admin-login-transition" aria-live="polite" aria-busy="true">
          <div className="admin-login-transition-card">
            <div className="admin-login-orb" aria-hidden="true">
              <span></span>
            </div>

            <div className="admin-login-logo">Quản trị HuyPerfume</div>

            <h2>Đang mở bảng quản trị</h2>

            <div className="admin-login-stage-text">
              <span>Đang xác thực quyền quản trị...</span>
              <span>Đang tải dashboard...</span>
            </div>

            <div className="admin-login-metrics">
              <div>
                <small>Dữ liệu quyền</small>
                <strong>{adminDataLoaded}/30</strong>
              </div>
              <div>
                <small>Dashboard</small>
                <strong>{adminTransitionProgress}%</strong>
              </div>
            </div>

            <div className="admin-login-progress" aria-label={`Đã tải ${adminTransitionProgress}%`}>
              <span style={{ width: `${adminTransitionProgress}%` }}></span>
            </div>

            <p>Đang chuẩn bị không gian quản trị luxury cho cửa hàng nước hoa của bạn.</p>
          </div>
        </div>
      )}

      <main className="luxury-page auth-page-shell">
      <div className="container auth-page-container">
        <div className="auth-page-grid">
          <section className="auth-hero-panel luxury-surface">
            <p className="auth-eyebrow">HuyPerfume</p>
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
              <span>Bảo mật HTTPS</span>
              <span>Tương thích đa thiết bị</span>
              <span>Dễ tiếp cận</span>
            </div>
          </section>

          <section className="auth-form-panel luxury-surface">
            <div className="auth-form-header">
              <p className="auth-eyebrow">Chào mừng trở lại</p>
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

              <button className="btn btn-dark btn-lg w-100 rounded-4" disabled={loading || adminEntering || (captchaRequired && !captchaProof.captchaToken)}>
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
    </>
  );
}
