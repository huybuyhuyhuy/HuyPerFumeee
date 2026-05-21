import { useAuth } from '../hooks/useAuth.js';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <h3 className="mb-4">Thông tin tài khoản</h3>
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Họ tên</label>
                <input className="form-control" value={user?.name || ''} readOnly />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" value={user?.email || ''} readOnly />
              </div>
              <div className="mb-3">
                <label className="form-label">Vai trò</label>
                <input className="form-control" value={user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
