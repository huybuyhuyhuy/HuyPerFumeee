import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { unwrapApiData } from '../services/api';
import { AdminPageHeader } from '../components/Admin/AdminUi';
import { useToast } from '../store/ToastContext';

const EMPTY_FORM = {
  name: '',
  sku: '',
  batchCode: '',
  image: '',
  price: '',
  discountPrice: '',
  stock: '0',
  volumeMl: '',
  description: '',
  scentNotes: '',
  isDecant: false,
  status: true,
  categoryId: '',
  brandId: '',
};

export function AdminProductAddPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [options, setOptions] = useState<{ brands: any[]; categories: any[] }>({ brands: [], categories: [] });

  useEffect(() => {
    Promise.all([api.get('/brands'), api.get('/categories')])
      .then(([brands, categories]) => setOptions({
        brands: unwrapApiData<any[]>(brands.data),
        categories: unwrapApiData<any[]>(categories.data),
      }))
      .catch(() => pushToast('Không tải được danh mục hoặc thương hiệu.', 'error'));
  }, [pushToast]);

  const update = (field: keyof typeof EMPTY_FORM) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.brandId) {
      pushToast('Vui lòng chọn thương hiệu.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/admin/products', {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
        stock: Number(form.stock),
        volumeMl: form.volumeMl === '' ? null : Number(form.volumeMl),
        categoryId: form.categoryId === '' ? null : Number(form.categoryId),
        brandId: Number(form.brandId),
      });
      const created = unwrapApiData<any>(data);
      pushToast('Đã tạo sản phẩm thành công.', 'success');
      navigate(`/admin/products/${created.id}/edit`);
    } catch (error: any) {
      pushToast(error?.message || 'Không tạo được sản phẩm.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Tạo sản phẩm"
        title="Thêm sản phẩm mới"
        description="Nhập thông tin catalog và tồn kho cho sản phẩm mới."
        action={<Link to="/admin/products" className="btn btn-outline-dark">Quay lại danh sách</Link>}
      />
      <form className="admin-product-editor admin-product-form" onSubmit={handleSubmit}>
        <label className="grow-2">Tên sản phẩm
          <input className="form-control" value={form.name} onChange={update('name')} required />
        </label>
        <label>SKU
          <input className="form-control" value={form.sku} onChange={update('sku')} />
        </label>
        <label>Mã lô
          <input className="form-control" value={form.batchCode} onChange={update('batchCode')} />
        </label>
        <label>Thương hiệu
          <select className="form-select" value={form.brandId} onChange={update('brandId')} required>
            <option value="">Chọn thương hiệu</option>
            {options.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        </label>
        <label>Danh mục
          <select className="form-select" value={form.categoryId} onChange={update('categoryId')}>
            <option value="">Chưa phân loại</option>
            {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label>Giá bán
          <input type="number" min="0" className="form-control" value={form.price} onChange={update('price')} required />
        </label>
        <label>Giá khuyến mãi
          <input type="number" min="0" className="form-control" value={form.discountPrice} onChange={update('discountPrice')} />
        </label>
        <label>Tồn kho
          <input type="number" min="0" className="form-control" value={form.stock} onChange={update('stock')} required />
        </label>
        <label>Dung tích (ml)
          <input type="number" min="1" className="form-control" value={form.volumeMl} onChange={update('volumeMl')} />
        </label>
        <label className="grow-2">Ảnh sản phẩm
          <input className="form-control" value={form.image} onChange={update('image')} />
        </label>
        <label className="grow-2">Nốt hương
          <input className="form-control" value={form.scentNotes} onChange={update('scentNotes')} />
        </label>
        <label className="grow-4">Mô tả
          <textarea className="form-control" rows={4} value={form.description} onChange={update('description')} />
        </label>
        <div className="admin-product-switches">
          <label><input type="checkbox" checked={form.isDecant} onChange={update('isDecant')} /> Sản phẩm chiết</label>
          <label><input type="checkbox" checked={form.status} onChange={update('status')} /> Đang hiển thị</label>
          <button className="btn luxury-primary-btn" type="submit" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo sản phẩm'}</button>
          <Link to="/admin/products" className="btn btn-outline-dark">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
