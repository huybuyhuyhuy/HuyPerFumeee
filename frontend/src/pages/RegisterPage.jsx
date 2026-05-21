import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    repassword: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.repassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container luxury-page">
      <div className="row justify-content-center">
        <div className="col-lg-7 col-xl-6">
          <div className="luxury-surface p-4 p-lg-5">
            <p className="text-uppercase luxury-muted small mb-1">Create your account</p>
            <h3 className="mb-4">Đăng ký tài khoản</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Họ tên *</label>
                <input className="form-control" value={form.name} onChange={update('name')} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" value={form.email} onChange={update('email')} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Số điện thoại</label>
                <input className="form-control" value={form.phone} onChange={update('phone')} />
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Mật khẩu *</label>
                  <input type="password" className="form-control" value={form.password} onChange={update('password')} required minLength={6} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Xác nhận mật khẩu *</label>
                  <input type="password" className="form-control" value={form.repassword} onChange={update('repassword')} required />
                </div>
              </div>
              <div className="mb-4 mt-3">
                <label className="form-label">Địa chỉ</label>
                <input className="form-control" value={form.address} onChange={update('address')} />
              </div>
              <button className="btn btn-dark w-100" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </form>
            <div className="text-center mt-3">
              <Link to="/login" className="text-decoration-none">
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

