import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { AdminEmptyState, AdminPageHeader, AdminStatusBadge, formatAdminCurrency, formatAdminDate } from '../components/Admin/AdminUi';
import { useToast } from '../store/ToastContext';

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function normalizeProduct(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || '',
    sku: raw.sku || '',
    batchCode: raw.batchCode || '',
    description: raw.description || '',
    image: raw.image || '',
    price: raw.price ?? 0,
    discountPrice: raw.discountPrice ?? 0,
    stock: raw.stock ?? 0,
    status: Boolean(raw.status),
    categoryId: raw.categoryId ?? raw.idCategory ?? raw.category?.id ?? '',
    brandId: raw.brandId ?? raw.idBrand ?? raw.brand?.id ?? '',
    categoryName: raw.categoryName || raw.category?.name || '',
    brandName: raw.brandName || raw.brand?.name || '',
    scentNotes: raw.scentNotes || '',
    gender: raw.gender || '',
    concentration: raw.concentration || '',
    volumeMl: raw.volumeMl || '',
    isDecant: Boolean(raw.isDecant),
    createdAt: raw.createdAt || raw.created_at || null,
    updatedAt: raw.updatedAt || raw.updated_at || null,
  };
}

export function AdminProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const numericId = Number(id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    batchCode: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    status: true,
    categoryId: '',
    brandId: '',
    categoryName: '',
    brandName: '',
    scentNotes: '',
    gender: '',
    concentration: '',
    volumeMl: '',
    isDecant: false,
  });
  const [options, setOptions] = useState<{ brands: any[]; categories: any[] }>({ brands: [], categories: [] });
  const [decantInventory, setDecantInventory] = useState<any>(null);
  const [decantPopup, setDecantPopup] = useState<'open' | 'restock' | 'adjust' | null>(null);
  const [decantQty, setDecantQty] = useState('1');
  const [decantReason, setDecantReason] = useState('');
  const [decantMl, setDecantMl] = useState('0');
  const [decantActionLoading, setDecantActionLoading] = useState(false);
  const [decantError, setDecantError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setError('ID sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    api
      .get(`/admin/products/${numericId}`)
      .then((res) => {
        const data = normalizeProduct(unwrapApiData(res.data));
        if (!data) {
          setError('Không tìm thấy sản phẩm.');
          setProduct(null);
          return;
        }
        setProduct(data);
        setForm({
          name: data.name,
          sku: data.sku,
          batchCode: data.batchCode,
          description: data.description,
          price: String(data.price ?? ''),
          discountPrice: String(data.discountPrice ?? ''),
          stock: String(data.stock ?? ''),
          status: data.status,
          categoryId: data.categoryId,
          brandId: data.brandId,
          categoryName: data.categoryName,
          brandName: data.brandName,
          scentNotes: data.scentNotes,
          gender: data.gender,
          concentration: data.concentration,
          volumeMl: String(data.volumeMl ?? ''),
          isDecant: data.isDecant,
        });
      })
      .catch((err) => setError(err?.response?.data?.message || err?.message || 'Không tải được chi tiết sản phẩm.'))
      .finally(() => setLoading(false));
  }, [numericId]);

  useEffect(() => {
    Promise.all([api.get('/brands'), api.get('/categories')])
      .then(([brands, categories]) => setOptions({
        brands: unwrapApiData(brands.data) || [],
        categories: unwrapApiData(categories.data) || [],
      }))
      .catch(() => pushToast('Không tải được danh mục hoặc thương hiệu.', 'error'));
  }, [pushToast]);

  useEffect(() => {
    if (!Number.isFinite(numericId)) return;
    api.get(`/admin/inventory/decant/${numericId}`)
      .then((res) => setDecantInventory(unwrapApiData(res.data)))
      .catch(() => setDecantInventory(null));
  }, [numericId]);

  const handleDecantAction = async () => {
    setDecantActionLoading(true);
    setDecantError('');
    const endpoint = decantPopup === 'open'
      ? '/admin/inventory/decant/open'
      : decantPopup === 'restock'
        ? '/admin/inventory/decant/restock'
        : '/admin/inventory/decant/adjust';

    const body = decantPopup === 'adjust'
      ? { productId: numericId, sealedBottlesDelta: Number(decantQty) || 0, openedMlDelta: Number(decantMl) || 0, reason: decantReason }
      : { productId: numericId, quantity: Number(decantQty) || 1, reason: decantReason };

    try {
      const res = await api.post(endpoint, body);
      setDecantInventory(unwrapApiData(res.data));
      setDecantPopup(null);
    } catch (err: any) {
      setDecantError(err?.response?.data?.message || err?.message || 'Thao tác thất bại');
    } finally {
      setDecantActionLoading(false);
    }
  };

  const displayPrice = useMemo(() => formatAdminCurrency(form.discountPrice || form.price), [form.discountPrice, form.price]);

  const updateField = (field) => (event) => {
    const value = ['status', 'isDecant'].includes(field) ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/products/${numericId}`, {
        ...form,
        price: Number(form.price || 0),
        discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
        stock: Number(form.stock || 0),
        volumeMl: form.volumeMl === '' ? null : Number(form.volumeMl),
        categoryId: form.categoryId === '' ? null : Number(form.categoryId),
        brandId: Number(form.brandId),
      });
      pushToast('Đã cập nhật sản phẩm thành công.', 'success');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không cập nhật được sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa sản phẩm này?');
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    try {
      await api.delete(`/admin/products/${numericId}`);
      pushToast('Đã xóa sản phẩm.', 'success');
      navigate('/admin/products');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không xóa được sản phẩm.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="admin-page"><div className="admin-loading"><div className="spinner-border" /> Đang tải sản phẩm...</div></div>;
  }

  if (error && !product) {
    return (
      <div className="admin-page">
        <AdminEmptyState title="Không tải được sản phẩm" description={error} />
        <div className="mt-3 d-flex gap-2">
          <Link to="/admin/products" className="btn btn-dark">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Chi tiết sản phẩm"
        title={`Chỉnh sửa sản phẩm #${product?.id || numericId}`}
        description="Cập nhật nhanh thông tin cơ bản, tồn kho và trạng thái hiển thị."
        action={<Link to="/admin/products" className="btn btn-outline-dark">Quay lại danh sách</Link>}
      />

      <div className="row g-4">
        <div className="col-xl-8">
          <form className="luxury-surface p-4 p-lg-5" onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Tên sản phẩm</label>
                <input className="form-control" value={form.name} onChange={updateField('name')} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">SKU</label>
                <input className="form-control" value={form.sku} onChange={updateField('sku')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Mã lô</label>
                <input className="form-control" value={form.batchCode} onChange={updateField('batchCode')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Thương hiệu</label>
                <select className="form-select" value={form.brandId} onChange={updateField('brandId')} required>
                  <option value="">Chọn thương hiệu</option>
                  {options.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Danh mục</label>
                <select className="form-select" value={form.categoryId} onChange={updateField('categoryId')}>
                  <option value="">Chưa phân loại</option>
                  {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Giá bán</label>
                <input type="number" min="0" className="form-control" value={form.price} onChange={updateField('price')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Giá khuyến mãi</label>
                <input type="number" min="0" className="form-control" value={form.discountPrice} onChange={updateField('discountPrice')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Tồn kho</label>
                <input type="number" min="0" className="form-control" value={form.stock} onChange={updateField('stock')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Dung tích (ml)</label>
                <input type="number" min="0" className="form-control" value={form.volumeMl} onChange={updateField('volumeMl')} />
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" checked={form.status} onChange={updateField('status')} id="admin-product-status-switch" />
                  <label className="form-check-label" htmlFor="admin-product-status-switch">Đang hiển thị</label>
                </div>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" checked={form.isDecant} onChange={updateField('isDecant')} id="admin-product-decant-switch" />
                  <label className="form-check-label" htmlFor="admin-product-decant-switch">Sản phẩm chiết</label>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Giới tính</label>
                <input className="form-control" value={form.gender} onChange={updateField('gender')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Nồng độ</label>
                <input className="form-control" value={form.concentration} onChange={updateField('concentration')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Nhóm hương</label>
                <input className="form-control" value={form.scentNotes} onChange={updateField('scentNotes')} />
              </div>
              <div className="col-12">
                <label className="form-label">Ảnh sản phẩm</label>
                <input className="form-control" value={form.image} onChange={updateField('image')} placeholder="/assets/images/..." />
              </div>
              <div className="col-12">
                <label className="form-label">Mô tả</label>
                <textarea className="form-control" rows="5" value={form.description} onChange={updateField('description')} />
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button type="submit" className="btn btn-dark" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              <button type="button" className="btn btn-outline-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
              </button>
              <button type="button" className="btn btn-outline-dark" onClick={() => navigate('/admin/products')}>Hủy</button>
            </div>
          </form>
        </div>

        <div className="col-xl-4">
          <div className="luxury-surface p-4 h-100 d-flex flex-column gap-3">
            <div>
              <span className="admin-eyebrow">Xem trước</span>
              <h4 className="mt-2">Tổng quan nhanh</h4>
            </div>
            {product?.image ? (
              <img src={product.image} alt={product.name} className="img-fluid rounded-4 border" />
            ) : (
              <div className="admin-empty-state">Chưa có ảnh đại diện.</div>
            )}
            <div className="d-grid gap-2">
              <div><strong>Trạng thái:</strong> <AdminStatusBadge status={form.status ? 'ACTIVE' : 'DISABLED'} /></div>
              <div><strong>Giá hiển thị:</strong> {displayPrice}</div>
              <div><strong>Tồn kho:</strong> {String(form.stock || 0)}</div>
              <div><strong>Cập nhật gần nhất:</strong> {formatAdminDate(product?.updatedAt || product?.createdAt)}</div>
            </div>

            {decantInventory && (
              <div className="border-top pt-3">
                <span className="admin-eyebrow">Tồn kho chiết</span>
                <h5 className="mt-1">Tồn kho chiết</h5>
                <div className="d-grid gap-2 mt-2">
                  <div><strong>Chai nguyên seal:</strong> {decantInventory.sealedBottles}</div>
                  <div><strong>Đã mở còn lại:</strong> {decantInventory.openedMl}ml</div>
                  <div><strong>Dung tích chai gốc:</strong> {decantInventory.bottleVolumeMl}ml</div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => { setDecantPopup('open'); setDecantQty('1'); setDecantError(''); }}>
                    Mở chai
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => { setDecantPopup('restock'); setDecantQty('1'); setDecantError(''); }}>
                    Nhập chai
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => { setDecantPopup('adjust'); setDecantQty('0'); setDecantMl('0'); setDecantError(''); }}>
                    Điều chỉnh
                  </button>
                </div>
                {decantPopup && (
                  <div className="mt-3 p-3 border rounded-3 bg-light">
                    <h6>
                      {decantPopup === 'open' ? 'Mở chai nguyên seal' : decantPopup === 'restock' ? 'Nhập thêm chai seal' : 'Điều chỉnh tồn kho'}
                    </h6>
                    {decantError && <div className="alert alert-danger py-2 small">{decantError}</div>}
                    {decantPopup === 'adjust' ? (
                      <>
                        <div className="mb-2">
                          <label className="form-label small">Số chai seal (dương: thêm, âm: bớt)</label>
                          <input type="number" className="form-control form-control-sm" value={decantQty} onChange={(e) => setDecantQty(e.target.value)} />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">Số ml đã mở (dương: thêm, âm: bớt)</label>
                          <input type="number" className="form-control form-control-sm" value={decantMl} onChange={(e) => setDecantMl(e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <div className="mb-2">
                        <label className="form-label small">Số lượng chai</label>
                        <input type="number" min="1" className="form-control form-control-sm" value={decantQty} onChange={(e) => setDecantQty(e.target.value)} />
                      </div>
                    )}
                    <div className="mb-2">
                      <label className="form-label small">Ghi chú</label>
                      <input className="form-control form-control-sm" value={decantReason} onChange={(e) => setDecantReason(e.target.value)} placeholder="Lý do..." />
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-dark" onClick={handleDecantAction} disabled={decantActionLoading}>
                        {decantActionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDecantPopup(null)}>Hủy</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
