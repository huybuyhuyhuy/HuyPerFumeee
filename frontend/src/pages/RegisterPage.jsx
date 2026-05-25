import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaptchaChallenge } from '../components/Auth/CaptchaChallenge';
import { useAuth } from '../hooks/useAuth';

const EMPTY_CAPTCHA_PROOF = { captchaToken: '', captchaAnswer: '' };

export function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    repassword: '',
    address: '',
  });
  const [captchaProof, setCaptchaProof] = useState(EMPTY_CAPTCHA_PROOF);
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateCaptchaProof = useCallback((nextProof) => setCaptchaProof(nextProof), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.repassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ ...form, ...captchaProof });
      navigate('/home');
    } catch (err) {
      if (err?.response?.data?.data?.captchaRequired) {
        setCaptchaProof(EMPTY_CAPTCHA_PROOF);
        setCaptchaRefreshKey((current) => current + 1);
      }
      setError(err?.response?.data?.message || err?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid luxury-page py-4 py-lg-5">
      <div className="row g-4 justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-lg-5 order-lg-2 d-none d-lg-block">
          <div className="luxury-surface p-5 h-100 shadow-sm d-flex flex-column justify-content-between" style={{ minHeight: 720 }}>
            <div>
              <p className="text-uppercase luxury-muted small mb-3">Join The Perfume Shop</p>
              <h1 className="display-6 fw-semibold mb-3">Tạo tài khoản để mua sắm và theo dõi đơn hàng dễ dàng hơn</h1>
              <p className="luxury-muted mb-0">
                Đăng ký chỉ với vài thông tin cơ bản để nhận trải nghiệm cá nhân hóa và quản lý đơn hàng tiện lợi.
              </p>
            </div>
            <div className="row g-3 mt-4">
              <div className="col-6">
                <div className="rounded-4 border p-3 bg-white bg-opacity-75 h-100">
                  <div className="fw-semibold mb-1">Nhanh gọn</div>
                  <div className="small text-muted">Hoàn tất đăng ký trong vài bước đơn giản.</div>
                </div>
              </div>
              <div className="col-6">
                <div className="rounded-4 border p-3 bg-white bg-opacity-75 h-100">
                  <div className="fw-semibold mb-1">Cá nhân hóa</div>
                  <div className="small text-muted">Dễ dàng lưu thông tin giao hàng của bạn.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5 col-xl-4 order-lg-1">
          <div className="luxury-surface p-4 p-lg-5 shadow-sm">
            <div className="mb-4">
              <p className="text-uppercase luxury-muted small mb-2">Create your account</p>
              <h2 className="mb-2 fw-semibold">Đăng ký tài khoản</h2>
              <p className="text-muted mb-0">Điền thông tin bên dưới để bắt đầu hành trình mua sắm.</p>
            </div>

            {error && <div className="alert alert-danger border-0 rounded-4">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Họ tên *</label>
                <input className="form-control form-control-lg rounded-4" value={form.name} onChange={update('name')} placeholder="Nhập họ tên" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control form-control-lg rounded-4" value={form.email} onChange={update('email')} placeholder="Nhập email" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Số điện thoại *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  className="form-control form-control-lg rounded-4"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="Nhập 10 chữ số"
                  required
                />
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Mật khẩu *</label>
                  <input
                    type="password"
                    className="form-control form-control-lg rounded-4"
                    value={form.password}
                    onChange={update('password')}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    minLength={6}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    className="form-control form-control-lg rounded-4"
                    value={form.repassword}
                    onChange={update('repassword')}
                    placeholder="Nhập lại mật khẩu"
                    required
                  />
                </div>
              </div>
              <div className="mb-4 mt-3">
                <label className="form-label">Địa chỉ</label>
                <input className="form-control form-control-lg rounded-4" value={form.address} onChange={update('address')} placeholder="Nhập địa chỉ" />
              </div>
              <CaptchaChallenge
                purpose="register"
                proof={captchaProof}
                onChange={updateCaptchaProof}
                refreshKey={captchaRefreshKey}
              />
              <button className="btn btn-dark btn-lg w-100 rounded-4" disabled={loading || !captchaProof.captchaToken}>
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </form>

            <div className="text-center mt-3">
              <Link to="/login" className="text-decoration-none fw-medium">
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
