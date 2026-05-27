import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { updateProfile } from '../api/profileApi.js';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dob: user?.dob ? user.dob.split('T')[0] : '',
    address: user?.address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      dob: user?.dob ? user.dob.split('T')[0] : '',
      address: user?.address || '',
    });
    setMessage(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        dob: form.dob || null,
        address: form.address.trim(),
      });

      setUser({ ...user!, ...updated });
      setEditing(false);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Cập nhật thất bại, vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <p>Vui lòng đăng nhập để xem thông tin tài khoản.</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h3 className="mb-1 fw-bold">Thông tin tài khoản</h3>
              <p className="text-muted mb-0 small">Quản lý thông tin cá nhân của bạn</p>
            </div>
            {!editing && (
              <button className="btn luxury-primary-btn" onClick={handleEdit}>
                Chỉnh sửa
              </button>
            )}
          </div>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Đóng" />
            </div>
          )}

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSave}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Họ tên</label>
                    <input
                      className="form-control"
                      name="name"
                      value={editing ? form.name : user.name}
                      onChange={handleChange}
                      readOnly={!editing}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Email</label>
                    <input
                      className="form-control text-muted"
                      value={user.email}
                      readOnly
                      disabled
                    />
                    <small className="text-muted">Email không thể thay đổi</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Số điện thoại</label>
                    <input
                      className="form-control"
                      name="phone"
                      value={editing ? form.phone : user.phone}
                      onChange={handleChange}
                      readOnly={!editing}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Ngày sinh</label>
                    <input
                      className="form-control"
                      type="date"
                      name="dob"
                      value={editing ? form.dob : (user.dob ? user.dob.split('T')[0] : '')}
                      onChange={handleChange}
                      readOnly={!editing}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-medium">Địa chỉ</label>
                    <textarea
                      className="form-control"
                      name="address"
                      rows={2}
                      value={editing ? form.address : (user.address || '')}
                      onChange={handleChange}
                      readOnly={!editing}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Vai trò</label>
                    <div>
                      <span className={`badge ${user.role === 'admin' ? 'bg-dark' : 'bg-secondary'}`}>
                        {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Ngày tham gia</label>
                    <div>
                      <span className="text-muted">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn luxury-secondary-btn"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn luxury-primary-btn"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          Đang lưu...
                        </>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
