import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AdminPageHeader } from '../components/Admin/AdminUi';

export function AdminProductAddPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    discountPrice: '',
    stock: '',
    description: '',
    brandName: '',
    categoryName: '',
    scentNotes: '',
    gender: '',
    concentration: '',
    volumeMl: '',
    status: true,
  });

  const update = (field) => (event) => {
    const value = field === 'status' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const response = await api.post('/admin/products', {
        ...form,
        price: Number(form.price || 0),
        discountPrice: Number(form.discountPrice || 0),
        stock: Number(form.stock || 0),
        volumeMl: form.volumeMl === '' ? null : Number(form.volumeMl),
      });
      const createdId = response?.data?.data?.id || response?.data?.id;
      setFeedback('Đã tạo sản phẩm thành công.');
      if (createdId) {
        navigate(`/admin/products/${createdId}/edit`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không tạo được sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Create product"
        title="Thêm sản phẩm mới"
        description="Tạo nhanh một sản phẩm rồi hoàn thiện trong trang chỉnh sửa chi tiết."
        action={<Link to="/admin/products" className="btn btn-outline-dark">Quay lại danh sách</Link>}
      />

      {error && <div className="alert alert-danger admin-alert">{error}</div>}
      {feedback && <div className="alert alert-success admin-alert">{feedback}</div>}

      <div className="row g-4">
        <div className="col-xl-8">
          <form className="luxury-surface p-4 p-lg-5" onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Tên sản phẩm</label>
                <input className="form-control" value={form.name} onChange={update('name')} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">SKU</label>
                <input className="form-control" value={form.sku} onChange={update('sku')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Thương hiệu</label>
                <input className="form-control" value={form.brandName} onChange={update('brandName')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Danh mục</label>
                <input className="form-control" value={form.categoryName} onChange={update('categoryName')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Giá bán</label>
                <input type="number" min="0" className="form-control" value={form.price} onChange={update('price')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Giá khuyến mãi</label>
                <input type="number" min="0" className="form-control" value={form.discountPrice} onChange={update('discountPrice')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Tồn kho</label>
                <input type="number" min="0" className="form-control" value={form.stock} onChange={update('stock')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Dung tích (ml)</label>
                <input type="number" min="0" className="form-control" value={form.volumeMl} onChange={update('volumeMl')} />
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" checked={form.status} onChange={update('status')} id="admin-new-product-status" />
                  <label className="form-check-label" htmlFor="admin-new-product-status">Đang hiển thị</label>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Giới tính</label>
                <input className="form-control" value={form.gender} onChange={update('gender')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Nồng độ</label>
                <input className="form-control" value={form.concentration} onChange={update('concentration')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Nhóm hương</label>
                <input className="form-control" value={form.scentNotes} onChange={update('scentNotes')} />
              </div>
              <div className="col-12">
                <label className="form-label">Mô tả</label>
                <textarea className="form-control" rows="5" value={form.description} onChange={update('description')} />
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button className="btn btn-dark" type="submit" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo sản phẩm'}</button>
              <Link to="/admin/products" className="btn btn-outline-dark">Hủy</Link>
            </div>
          </form>
        </div>

        <div className="col-xl-4">
          <div className="luxury-surface p-4 h-100">
            <span className="admin-eyebrow">Guide</span>
            <h4 className="mt-2">Luồng tạo sản phẩm</h4>
            <p className="luxury-muted">Tạo nhanh thông tin chính trước, sau đó mở trang chỉnh sửa để bổ sung hình ảnh, mô tả và cấu hình nâng cao.</p>
            <div className="admin-empty-state mt-3">Trang này đã sẵn sàng cho quy trình tạo mới.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
