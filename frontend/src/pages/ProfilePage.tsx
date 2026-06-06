import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { getCurrentProfile, updateProfile } from '../api/profileApi.js';
import { addressService, formatAddress, type UserAddress, type UserAddressPayload } from '../services/addressService';
import { clampMembershipProgress, formatVnd, getMembershipLabel, getMembershipTone, normalizeMembershipTier } from '../utils/membership';

const emptyAddressForm: UserAddressPayload = {
  label: '',
  recipientName: '',
  phone: '',
  city: '',
  district: '',
  ward: '',
  line1: '',
  line2: '',
  country: 'VN',
  postalCode: '',
  isDefault: false,
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<UserAddressPayload>(emptyAddressForm);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    getCurrentProfile()
      .then((freshUser) => {
        if (!cancelled) setUser({ ...user, ...freshUser });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadAddresses = async () => {
    setAddressLoading(true);
    try {
      setAddresses(await addressService.list());
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Không tải được sổ địa chỉ.' });
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAddresses();
  }, [user?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setAddressForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEdit = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setMessage(null);
    setEditing(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
      });

      setUser({ ...user!, ...updated });
      setEditing(false);
      setMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Cập nhật thất bại, vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...emptyAddressForm,
      recipientName: user?.name || '',
      phone: user?.phone || '',
      isDefault: addresses.length === 0,
    });
  };

  const startEditAddress = (address: UserAddress) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || '',
      recipientName: address.recipientName,
      phone: address.phone,
      city: address.city,
      district: address.district,
      ward: address.ward,
      line1: address.line1,
      line2: address.line2 || '',
      country: address.country || 'VN',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault,
    });
  };

  const validateAddressForm = () => {
    if (!addressForm.recipientName.trim()) return 'Vui lòng nhập tên người nhận.';
    if (!/^\d{10}$/.test(normalizePhone(addressForm.phone))) return 'Số điện thoại cần đúng 10 chữ số.';
    if (!addressForm.city.trim() || !addressForm.district.trim() || !addressForm.ward.trim() || !addressForm.line1.trim()) {
      return 'Vui lòng nhập đủ tỉnh/thành, quận/huyện, phường/xã và địa chỉ chi tiết.';
    }
    return '';
  };

  const handleAddressSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validateAddressForm();
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    setAddressSaving(true);
    setMessage(null);
    const payload = {
      ...addressForm,
      phone: normalizePhone(addressForm.phone),
      recipientName: addressForm.recipientName.trim(),
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      ward: addressForm.ward.trim(),
      line1: addressForm.line1.trim(),
      line2: addressForm.line2?.trim() || '',
      label: addressForm.label?.trim() || '',
    };

    try {
      if (editingAddressId) {
        await addressService.update(editingAddressId, payload);
        setMessage({ type: 'success', text: 'Đã cập nhật địa chỉ.' });
      } else {
        await addressService.create(payload);
        setMessage({ type: 'success', text: 'Đã thêm địa chỉ mới.' });
      }
      resetAddressForm();
      await loadAddresses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Không lưu được địa chỉ.' });
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (address: UserAddress) => {
    if (!window.confirm(`Xóa địa chỉ của ${address.recipientName}?`)) return;
    setAddressSaving(true);
    try {
      await addressService.remove(address.id);
      setMessage({ type: 'success', text: 'Đã xóa địa chỉ.' });
      await loadAddresses();
      if (editingAddressId === address.id) resetAddressForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Không xóa được địa chỉ.' });
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefault = async (address: UserAddress) => {
    setAddressSaving(true);
    try {
      await addressService.setDefault(address.id);
      setMessage({ type: 'success', text: 'Đã chọn địa chỉ mặc định.' });
      await loadAddresses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Không đặt được địa chỉ mặc định.' });
    } finally {
      setAddressSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <p>Vui lòng đăng nhập để xem thông tin tài khoản.</p>
      </div>
    );
  }

  const membershipTier = normalizeMembershipTier(user.membershipTier);
  const membershipLabel = user.membershipLabel || getMembershipLabel(membershipTier);
  const nextTierLabel = user.nextTierLabel || (user.nextTier ? getMembershipLabel(user.nextTier) : null);
  const membershipProgress = clampMembershipProgress(user.membershipProgress);
  const isTopTier = membershipTier === 'DIAMOND';

  return (
    <main className="luxury-page profile-page">
      <div className="container py-5">
        <header className="profile-header">
          <div>
            <p className="section-eyebrow">Tài khoản HuyPerfume</p>
            <h1>Hồ sơ khách hàng</h1>
            <p className="luxury-muted mb-0">Lưu thông tin cá nhân và sổ địa chỉ để checkout nhanh hơn.</p>
          </div>
          {!editing && (
            <button className="btn luxury-primary-btn" onClick={handleEdit}>
              Chỉnh sửa hồ sơ
            </button>
          )}
        </header>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Đóng" />
          </div>
        )}

        <section className={`luxury-surface profile-panel profile-membership-card ${getMembershipTone(membershipTier)}`}>
          <div className="profile-panel-heading profile-membership-heading">
            <div>
              <p className="section-eyebrow">Hạng thành viên của bạn</p>
              <h2>Bạn đang là {membershipLabel}</h2>
            </div>
            <span className={`profile-membership-badge ${getMembershipTone(membershipTier)}`}>
              {membershipLabel}
            </span>
          </div>

          <div className="profile-membership-summary">
            <article>
              <span>Tổng chi tiêu đã ghi nhận</span>
              <strong>{formatVnd(user.totalSpent)}</strong>
            </article>
            <article>
              <span>Hạng tiếp theo</span>
              <strong>{isTopTier ? 'Cao nhất' : nextTierLabel || '-'}</strong>
            </article>
            <article>
              <span>Còn thiếu</span>
              <strong>{isTopTier ? formatVnd(0) : formatVnd(user.amountToNextTier)}</strong>
            </article>
          </div>

          {isTopTier ? (
            <p className="profile-membership-top">Bạn đã đạt hạng thành viên cao nhất của HuyPerfume</p>
          ) : (
            <p className="profile-membership-next">
              Còn {formatVnd(user.amountToNextTier)} để lên {nextTierLabel || 'hạng tiếp theo'}
            </p>
          )}

          <div className="profile-membership-progress" aria-label="Tiến độ lên hạng">
            <span style={{ width: `${membershipProgress}%` }} />
          </div>
          <div className="profile-membership-progress-label">
            <span>{membershipProgress}%</span>
            <small>Chỉ tính các đơn hàng đã giao thành công hoặc hoàn tất</small>
          </div>
        </section>

        <section className="luxury-surface profile-panel">
          <form onSubmit={handleSave}>
            <div className="profile-panel-heading">
              <div>
                <p className="section-eyebrow">Thông tin cá nhân</p>
                <h2>Liên hệ mua hàng</h2>
              </div>
              <span className={`badge ${user.role === 'admin' ? 'bg-dark' : 'bg-secondary'}`}>
                {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
              </span>
            </div>
            <div className="luxury-form-grid">
              <label>
                <span>Họ tên</span>
                <input name="name" value={editing ? form.name : user.name} onChange={handleChange} readOnly={!editing} required />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input name="phone" value={editing ? form.phone : user.phone} onChange={handleChange} readOnly={!editing} inputMode="tel" required />
              </label>
              <label>
                <span>Email</span>
                <input value={user.email} readOnly disabled />
                <small>Email hiện chưa cho phép thay đổi.</small>
              </label>
              <label>
                <span>Ngày tham gia</span>
                <input value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'} readOnly disabled />
              </label>
            </div>

            {editing && (
              <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn luxury-secondary-btn" onClick={() => setEditing(false)} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn luxury-primary-btn" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </form>
        </section>

        <section className="luxury-surface profile-panel">
          <div className="profile-panel-heading">
            <div>
              <p className="section-eyebrow">Sổ địa chỉ</p>
              <h2>Địa chỉ giao hàng</h2>
            </div>
            <button type="button" className="btn luxury-secondary-btn" onClick={resetAddressForm}>
              Thêm địa chỉ
            </button>
          </div>

          <div className="profile-address-layout">
            <div className="profile-address-list">
              {addressLoading ? (
                <p className="luxury-muted">Đang tải địa chỉ...</p>
              ) : addresses.length === 0 ? (
                <p className="luxury-muted">Bạn chưa có địa chỉ lưu sẵn.</p>
              ) : (
                addresses.map((address) => (
                  <article key={address.id} className={`profile-address-card ${address.isDefault ? 'default' : ''}`}>
                    <div>
                      <div className="profile-address-title">
                        <strong>{address.recipientName}</strong>
                        {address.isDefault && <span>Mặc định</span>}
                      </div>
                      <p>{address.phone}</p>
                      <p>{formatAddress(address)}</p>
                    </div>
                    <div className="profile-address-actions">
                      {!address.isDefault && (
                        <button type="button" className="btn btn-sm btn-outline-dark" disabled={addressSaving} onClick={() => handleSetDefault(address)}>
                          Chọn mặc định
                        </button>
                      )}
                      <button type="button" className="btn btn-sm btn-outline-dark" disabled={addressSaving} onClick={() => startEditAddress(address)}>
                        Sửa
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" disabled={addressSaving} onClick={() => handleDeleteAddress(address)}>
                        Xóa
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <form className="profile-address-form" onSubmit={handleAddressSubmit}>
              <h3>{editingAddressId ? 'Sửa địa chỉ' : 'Địa chỉ mới'}</h3>
              <div className="luxury-form-grid">
                <label>
                  <span>Tên người nhận</span>
                  <input name="recipientName" value={addressForm.recipientName} onChange={handleAddressChange} required />
                </label>
                <label>
                  <span>Số điện thoại</span>
                  <input name="phone" value={addressForm.phone} onChange={handleAddressChange} inputMode="tel" required />
                </label>
                <label>
                  <span>Tỉnh/thành</span>
                  <input name="city" value={addressForm.city} onChange={handleAddressChange} required />
                </label>
                <label>
                  <span>Quận/huyện</span>
                  <input name="district" value={addressForm.district} onChange={handleAddressChange} required />
                </label>
                <label>
                  <span>Phường/xã</span>
                  <input name="ward" value={addressForm.ward} onChange={handleAddressChange} required />
                </label>
                <label>
                  <span>Nhãn địa chỉ</span>
                  <input name="label" value={addressForm.label} onChange={handleAddressChange} placeholder="Nhà riêng, công ty..." />
                </label>
              </div>
              <label className="luxury-form-field">
                <span>Địa chỉ chi tiết</span>
                <input name="line1" value={addressForm.line1} onChange={handleAddressChange} placeholder="Số nhà, tên đường" required />
              </label>
              <label className="profile-default-check">
                <input type="checkbox" name="isDefault" checked={addressForm.isDefault} onChange={handleAddressChange} />
                <span>Đặt làm địa chỉ mặc định</span>
              </label>
              <div className="d-flex gap-2 justify-content-end">
                {editingAddressId && (
                  <button type="button" className="btn luxury-secondary-btn" onClick={resetAddressForm} disabled={addressSaving}>
                    Hủy sửa
                  </button>
                )}
                <button type="submit" className="btn luxury-primary-btn" disabled={addressSaving}>
                  {addressSaving ? 'Đang lưu...' : editingAddressId ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
