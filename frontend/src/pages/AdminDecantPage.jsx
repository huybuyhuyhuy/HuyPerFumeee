import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { AdminPageHeader, AdminStatusBadge, formatAdminCurrency, formatAdminDate } from '../components/Admin/AdminUi';
import '../styles/admin-decant.css';

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export function AdminDecantPage() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [batches, setBatches] = useState([]);
  const [options, setOptions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const selectedProduct = useMemo(() => products.find((p) => String(p.id) === String(selectedId)) || null, [products, selectedId]);
  const bottleCount = Number(selectedProduct?.sealed_bottles ?? selectedProduct?.stock ?? 0);
  const bottleVolumeMl = Number(selectedProduct?.bottle_volume_ml || selectedProduct?.total_volume_ml || 100);
  const remainingMl = Number(selectedProduct?.remaining_volume_ml ?? 0);
  const isOpenedBottle = Boolean(Number(selectedProduct?.is_opened_bottle ?? 0) > 0 || remainingMl < bottleCount * bottleVolumeMl);
  const summary = useMemo(() => {
    const totalBottles = products.reduce((sum, item) => sum + Number(item.sealed_bottles ?? item.stock ?? 0), 0);
    const openedCount = products.filter((item) => Number(item.is_opened_bottle ?? 0) > 0 || Number(item.remaining_volume_ml || 0) < Number(item.sealed_bottles ?? item.stock ?? 0) * Number(item.bottle_volume_ml || item.total_volume_ml || 100)).length;
    const totalRemainingMl = products.reduce((sum, item) => sum + Number(item.remaining_volume_ml ?? 0), 0);
    const activeDecants = options.filter((opt) => opt.status).length;
    return { totalBottles, openedCount, totalRemainingMl, activeDecants };
  }, [products, options]);

  const load = async () => {
    setLoading(true);
    try {
      const [productRes] = await Promise.all([api.get('/admin/decant/products')]);
      const data = unwrapApiData(productRes.data) || {};
      setProducts(Array.isArray(data.content) ? data.content : []);
      if (!selectedId && data.content?.[0]?.id) setSelectedId(String(data.content[0].id));
    } catch (err) {
      setError(err?.message || 'Không tải được dữ liệu decant.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    setError('');
    Promise.all([
      api.get(`/admin/products/${selectedId}/batches`),
      api.get(`/admin/products/${selectedId}/decant-options`),
      api.get('/admin/inventory/decant/movements', { params: { productId: selectedId } }),
    ]).then(([batchRes, optionRes, movementRes]) => {
      setBatches(Array.isArray(unwrapApiData(batchRes.data)?.content) ? unwrapApiData(batchRes.data).content : []);
      setOptions(Array.isArray(unwrapApiData(optionRes.data)?.content) ? unwrapApiData(optionRes.data).content : []);
      setMovements(Array.isArray(unwrapApiData(movementRes.data)?.content) ? unwrapApiData(movementRes.data).content : []);
    }).catch((err) => {
      setBatches([]);
      setOptions([]);
      setMovements([]);
      setError(err?.message || 'Khong tai duoc thong tin decant.');
    });
  }, [selectedId]);

  const filtered = products.filter((p) => `${p.name} ${p.sku || ''}`.toLowerCase().includes(search.toLowerCase()) && (!onlyLow || Number(p.remaining_volume_ml || 0) <= 20));

  const createOption = async (volumeMl) => {
    setError('');
    try {
      await api.post(`/admin/products/${selectedId}/decant-options`, { volumeMl, price: Number(window.prompt(`Giá cho ${volumeMl}ml`, '450000') || 0), status: true });
      setFeedback(`Đã tạo option ${volumeMl}ml.`);
      const optionRes = await api.get(`/admin/products/${selectedId}/decant-options`);
      setOptions(Array.isArray(unwrapApiData(optionRes.data)?.content) ? unwrapApiData(optionRes.data).content : []);
    } catch (err) { setError(err?.message || 'Không tạo được option.'); }
  };

  const updateBatchRemaining = async (batch) => {
    const next = Number(window.prompt('Nhập remaining ml mới', String(batch.remaining_volume_ml)) || batch.remaining_volume_ml);
    if (Number.isNaN(next) || next < 0 || next > Number(batch.total_volume_ml)) return;
    setError('');
    try {
      await api.patch(`/admin/batches/${batch.id}`, { remainingVolumeMl: next });
    setFeedback('Đã cập nhật batch.');
      const batchRes = await api.get(`/admin/products/${selectedId}/batches`);
      setBatches(Array.isArray(unwrapApiData(batchRes.data)?.content) ? unwrapApiData(batchRes.data).content : []);
    } catch (err) {
      setError(err?.message || 'Khong cap nhat duoc batch.');
    }
  };

  return (
    <div className="admin-page admin-decant-page">
      <AdminPageHeader eyebrow="Decant" title="Quản lý chai gốc & option chiết" description="Bán full bottle và decant 5ml/10ml/20ml với cảnh báo chai gần hết." />
      {error && <div className="alert alert-danger admin-alert">{error}</div>}
      {feedback && <div className="alert alert-success admin-alert">{feedback}</div>}
      <div className="admin-filter-panel admin-decant-toolbar">
        <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm sản phẩm" />
        <label><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Chỉ xem chai gần hết</label>
      </div>
      <div className="admin-decant-summary-hero">
        <div className="admin-decant-stat">
          <span>Tổng chai nguyên seal</span>
          <strong>{summary.totalBottles}</strong>
        </div>
        <div className="admin-decant-stat warning">
          <span>Chai đã mở</span>
          <strong>{summary.openedCount}</strong>
        </div>
        <div className="admin-decant-stat">
          <span>Tổng ml còn</span>
          <strong>{summary.totalRemainingMl}ml</strong>
        </div>
        <div className="admin-decant-stat success">
          <span>Decant active</span>
          <strong>{summary.activeDecants}</strong>
        </div>
      </div>
      <div className="admin-decant-cards">
        <section className="admin-surface-card admin-decant-card">
          <h3>1. Chai gốc</h3>
          <p className="mb-3">Danh sách chai nguyên seal đang còn trong kho.</p>
          <div className="admin-list-stack">
            {filtered.length === 0 ? (
              <div className="admin-empty-state compact">Chưa có chai gốc phù hợp với bộ lọc hiện tại.</div>
            ) : filtered.map((p) => {
              const totalBottles = Number(p.sealed_bottles || p.stock || 0);
              const bottleVolume = Number(p.bottle_volume_ml || p.total_volume_ml || 100);
              const opened = Number(p.is_opened_bottle || 0) > 0 || Number(p.remaining_volume_ml || 0) < totalBottles * bottleVolume;
              return (
                <button key={p.id} type="button" className={`admin-list-item ${String(selectedId) === String(p.id) ? 'active' : ''}`} onClick={() => setSelectedId(String(p.id))}>
                  <div className="admin-inventory-product">
                    <strong>{p.name}</strong>
                    <small>{p.sku || ''}</small>
                  </div>
                  <div>
                    <strong>{totalBottles} chai</strong>
                    <small>{bottleVolume}ml/chai</small>
                    <small>Số chai còn: {totalBottles}</small>
                  </div>
                  <div>
                    <AdminStatusBadge status={opened ? 'ACTIVE' : 'LOCKED'} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="admin-surface-card admin-decant-card">
          <h3>2. Chai mở nắp</h3>
          {selectedProduct && (
            <div className="mb-3 admin-decant-summary">
              <div><span>Số chai còn</span><strong>{bottleCount}</strong></div>
              <div><span>Dung tích mỗi chai</span><strong>{bottleVolumeMl}ml/chai</strong></div>
              <div><span>Trạng thái</span><strong>{isOpenedBottle ? 'Đã mở nắp' : 'Chưa mở nắp'}</strong></div>
              <div><span>ML còn lại</span><strong>{remainingMl}ml</strong></div>
            </div>
          )}
          <h4>Batch chai gốc</h4>
          <div className="admin-list-stack">
            {batches.length === 0 ? (
              <div className="admin-empty-state compact">Chưa có batch nào cho chai gốc này.</div>
            ) : batches.map((batch) => (
              <div key={batch.id} className="admin-list-item">
                <div className="admin-inventory-product">
                  <strong>{batch.batch_code || `Batch #${batch.id}`}</strong>
                  <small>{formatAdminDate(batch.created_at)}</small>
                </div>
                <div>
                  <strong>{batch.remaining_volume_ml}ml</strong>
                  <small>{batch.remaining_volume_ml < batch.total_volume_ml ? 'Đã mở nắp' : 'Chưa mở nắp'}</small>
                </div>
                <button className="btn btn-sm btn-outline-dark" onClick={() => updateBatchRemaining(batch)}>Cập nhật ml</button>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-surface-card admin-decant-card">
          <h3>3. Decant</h3>
          <p className="mb-3">Tạo và quản lý các size chiết 5ml / 10ml / 20ml.</p>
          <div className="admin-decant-option-row">
            {[5, 10, 20].map((v) => <button key={v} className="btn btn-sm luxury-primary-btn" onClick={() => createOption(v)}>{v}ml</button>)}
          </div>
          {options.length > 0 ? (
            <div className="admin-decant-option-grid">
              {options.map((opt) => (
                <article key={opt.id} className="admin-decant-option-card">
                  <div className="admin-decant-option-card-top">
                    <strong>{opt.volume_ml}ml decant</strong>
                    <AdminStatusBadge status={opt.status ? 'ACTIVE' : 'LOCKED'} />
                  </div>
                  <p>{formatAdminCurrency(opt.price)}</p>
                  <small>Option chiết sẵn cho sản phẩm này.</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state compact">Chưa có option decant. Hãy tạo 5ml / 10ml / 20ml để hiển thị tại đây.</div>
          )}
          <h4 className="mt-3">Lịch sử chiết</h4>
          {movements.length > 0 ? (
            <div className="admin-movement-timeline">
              {movements.slice(0, 5).map((m) => (
                <article key={m.id} className="admin-movement-item">
                  <div className="admin-movement-badge">{m.movement_type}</div>
                  <div className="admin-movement-body">
                    <strong>{m.reference || formatAdminDate(m.created_at)}</strong>
                    <small>{Number(m.quantity_ml || 0)}ml · {Number(m.quantity_bottles || 0)} chai</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state compact">Chưa có lịch sử chiết cho sản phẩm này.</div>
          )}
        </section>
      </div>
      {selectedProduct && Number(selectedProduct.remaining_volume_ml || 0) <= 20 && <div className="alert alert-warning admin-alert mt-3">Cảnh báo: chai gần hết ml.</div>}
    </div>
  );
}
