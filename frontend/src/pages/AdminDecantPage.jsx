import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { AdminPageHeader, AdminStatusBadge, formatAdminCurrency, formatAdminDate } from '../components/Admin/AdminUi';
import '../styles/admin-decant.css';

const PRESET_DECANT_SIZES = [5, 10, 20];
const DEFAULT_OPTION_FORM = { preset: '5', customVolumeMl: '', price: '450000', status: true };
const DEFAULT_BATCH_FORM = { remainingVolumeMl: '', reason: '' };

function unwrapApiData(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isActiveStatus(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value ?? '').trim().toUpperCase();
  return normalized === '' || normalized === '1' || normalized === 'TRUE' || normalized === 'ACTIVE';
}

function AdminDecantModal({ title, description, children, onClose }) {
  return (
    <div className="admin-decant-modal-layer" role="presentation">
      <button type="button" className="admin-decant-modal-backdrop" aria-label="Đóng modal" onClick={onClose} />
      <section className="admin-decant-modal" role="dialog" aria-modal="true" aria-labelledby="admin-decant-modal-title">
        <div className="admin-decant-modal-head">
          <div>
            <h3 id="admin-decant-modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="admin-decant-modal-close" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
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
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [optionForm, setOptionForm] = useState(DEFAULT_OPTION_FORM);
  const [batchModal, setBatchModal] = useState(null);
  const [batchForm, setBatchForm] = useState(DEFAULT_BATCH_FORM);

  const selectedProduct = useMemo(() => products.find((p) => String(p.id) === String(selectedId)) || null, [products, selectedId]);
  const bottleCount = toNumber(selectedProduct?.sealed_bottles ?? selectedProduct?.stock);
  const bottleVolumeMl = toNumber(selectedProduct?.bottle_volume_ml || selectedProduct?.total_volume_ml || 100, 100);
  const remainingMl = toNumber(selectedProduct?.remaining_volume_ml);
  const isOpenedBottle = Boolean(toNumber(selectedProduct?.is_opened_bottle) > 0 || remainingMl < bottleCount * bottleVolumeMl);
  const activeOptions = useMemo(() => options.filter((opt) => isActiveStatus(opt.status)), [options]);
  const minOptionMl = useMemo(() => {
    if (!activeOptions.length) return 0;
    return activeOptions.reduce((min, opt) => {
      const volume = toNumber(opt.volume_ml ?? opt.volumeMl);
      return volume > 0 ? Math.min(min, volume) : min;
    }, Number.POSITIVE_INFINITY);
  }, [activeOptions]);
  const isBelowSmallestOption = selectedProduct && minOptionMl > 0 && remainingMl < minOptionMl;

  const summary = useMemo(() => {
    const totalBottles = products.reduce((sum, item) => sum + toNumber(item.sealed_bottles ?? item.stock), 0);
    const openedCount = products.filter((item) => {
      const total = toNumber(item.sealed_bottles ?? item.stock);
      const volume = toNumber(item.bottle_volume_ml || item.total_volume_ml || 100, 100);
      return toNumber(item.is_opened_bottle) > 0 || toNumber(item.remaining_volume_ml) < total * volume;
    }).length;
    const totalRemainingMl = products.reduce((sum, item) => sum + toNumber(item.remaining_volume_ml), 0);
    return { totalBottles, openedCount, totalRemainingMl, activeDecants: activeOptions.length };
  }, [products, activeOptions.length]);

  const loadProducts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const productRes = await api.get('/admin/decant/products');
      const data = unwrapApiData(productRes.data) || {};
      const content = Array.isArray(data.content) ? data.content : [];
      setProducts(content);
      setSelectedId((current) => current || (content[0]?.id ? String(content[0].id) : ''));
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được dữ liệu decant.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadSelected = useCallback(async (productId = selectedId) => {
    if (!productId) return;
    setError('');
    try {
      const [batchRes, optionRes, movementRes] = await Promise.all([
        api.get(`/admin/products/${productId}/batches`),
        api.get(`/admin/products/${productId}/decant-options`),
        api.get('/admin/inventory/decant/movements', { params: { productId } }),
      ]);
      setBatches(Array.isArray(unwrapApiData(batchRes.data)?.content) ? unwrapApiData(batchRes.data).content : []);
      setOptions(Array.isArray(unwrapApiData(optionRes.data)?.content) ? unwrapApiData(optionRes.data).content : []);
      setMovements(Array.isArray(unwrapApiData(movementRes.data)?.content) ? unwrapApiData(movementRes.data).content : []);
    } catch (err) {
      setBatches([]);
      setOptions([]);
      setMovements([]);
      setError(getErrorMessage(err, 'Không tải được thông tin decant.'));
    }
  }, [selectedId]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { void loadSelected(selectedId); }, [loadSelected, selectedId]);

  const refreshSelectedData = async () => {
    await Promise.all([
      loadProducts({ silent: true }),
      loadSelected(selectedId),
    ]);
  };

  const filtered = products.filter((product) => {
    const keyword = `${product.name} ${product.sku || ''}`.toLowerCase();
    const matchesSearch = keyword.includes(search.toLowerCase());
    const matchesLow = !onlyLow || toNumber(product.remaining_volume_ml) <= 20;
    return matchesSearch && matchesLow;
  });

  const openOptionModal = (volumeMl = 5) => {
    setModalError('');
    setOptionForm({ ...DEFAULT_OPTION_FORM, preset: String(volumeMl), customVolumeMl: '' });
    setOptionModalOpen(true);
  };

  const submitOption = async (event) => {
    event.preventDefault();
    const volumeMl = optionForm.preset === 'custom' ? toNumber(optionForm.customVolumeMl) : toNumber(optionForm.preset);
    const price = toNumber(optionForm.price, -1);
    if (!selectedId) return setModalError('Vui lòng chọn sản phẩm trước.');
    if (!Number.isInteger(volumeMl) || volumeMl <= 0) return setModalError('Dung tích chiết phải là số ml hợp lệ.');
    if (price <= 0) return setModalError('Giá bán phải lớn hơn 0.');

    setSaving(true);
    setModalError('');
    setError('');
    try {
      await api.post(`/admin/products/${selectedId}/decant-options`, {
        volumeMl,
        price,
        status: Boolean(optionForm.status),
      });
      setFeedback(`Đã lưu option ${volumeMl}ml.`);
      setOptionModalOpen(false);
      await refreshSelectedData();
    } catch (err) {
      setModalError(getErrorMessage(err, 'Không lưu được option decant.'));
    } finally {
      setSaving(false);
    }
  };

  const openBatchModal = (batch) => {
    setModalError('');
    setBatchModal(batch);
    setBatchForm({
      remainingVolumeMl: String(batch.remaining_volume_ml ?? batch.remainingVolumeMl ?? 0),
      reason: '',
    });
  };

  const submitBatchRemaining = async (event) => {
    event.preventDefault();
    if (!batchModal) return;
    const next = toNumber(batchForm.remainingVolumeMl, -1);
    const total = toNumber(batchModal.total_volume_ml ?? batchModal.totalVolumeMl);
    if (!Number.isFinite(next) || next < 0) return setModalError('Remaining ml không được âm.');
    if (next > total) return setModalError('Remaining ml không được vượt total volume của batch.');

    setSaving(true);
    setModalError('');
    setError('');
    try {
      await api.patch(`/admin/batches/${batchModal.id}`, {
        remainingVolumeMl: next,
        reason: batchForm.reason || 'Admin cập nhật remaining ml',
        movementType: 'MANUAL_ADJUST',
      });
      setFeedback('Đã cập nhật remaining ml của batch.');
      setBatchModal(null);
      await refreshSelectedData();
    } catch (err) {
      setModalError(getErrorMessage(err, 'Không cập nhật được batch.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleOptionStatus = async (option) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/decant-options/${option.id}`, {
        volumeMl: toNumber(option.volume_ml ?? option.volumeMl),
        price: toNumber(option.price),
        status: !isActiveStatus(option.status),
      });
      setFeedback('Đã cập nhật trạng thái option.');
      await loadSelected(selectedId);
    } catch (err) {
      setError(getErrorMessage(err, 'Không cập nhật được option.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page admin-decant-page">
      <AdminPageHeader eyebrow="Decant" title="Quản lý chai gốc & option chiết" description="Bán full bottle và decant 5ml/10ml/20ml với cảnh báo chai gần hết." />
      {error && <div className="alert alert-danger admin-alert">{error}</div>}
      {feedback && <div className="alert alert-success admin-alert">{feedback}</div>}
      {loading && <div className="admin-empty-state compact">Đang tải dữ liệu decant...</div>}

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
            ) : filtered.map((product) => {
              const totalBottles = toNumber(product.sealed_bottles ?? product.stock);
              const bottleVolume = toNumber(product.bottle_volume_ml || product.total_volume_ml || 100, 100);
              const opened = toNumber(product.is_opened_bottle) > 0 || toNumber(product.remaining_volume_ml) < totalBottles * bottleVolume;
              const lowProduct = toNumber(product.remaining_volume_ml) <= 20;
              return (
                <button key={product.id} type="button" className={`admin-list-item ${String(selectedId) === String(product.id) ? 'active' : ''}`} onClick={() => setSelectedId(String(product.id))}>
                  <div className="admin-inventory-product">
                    <strong>{product.name}</strong>
                    <small>{product.sku || ''}</small>
                  </div>
                  <div>
                    <strong>{totalBottles} chai</strong>
                    <small>{bottleVolume}ml/chai</small>
                    <small className={lowProduct ? 'admin-decant-low-text' : ''}>ML còn: {toNumber(product.remaining_volume_ml)}ml</small>
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
            ) : batches.map((batch) => {
              const batchRemaining = toNumber(batch.remaining_volume_ml ?? batch.remainingVolumeMl);
              const batchTotal = toNumber(batch.total_volume_ml ?? batch.totalVolumeMl);
              const batchLow = batchRemaining < 20;
              return (
                <div key={batch.id} className="admin-list-item">
                  <div className="admin-inventory-product">
                    <strong>{batch.batch_code || `Batch #${batch.id}`}</strong>
                    <small>{formatAdminDate(batch.created_at)}</small>
                  </div>
                  <div>
                    <strong className={batchLow ? 'admin-decant-low-text' : ''}>{batchRemaining}ml</strong>
                    <small>{batchRemaining < batchTotal ? 'Đã mở nắp' : 'Chưa mở nắp'}</small>
                    <small>Total: {batchTotal}ml</small>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => openBatchModal(batch)}>Cập nhật ml</button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-surface-card admin-decant-card">
          <h3>3. Decant</h3>
          <p className="mb-3">Tạo và quản lý size chiết preset hoặc size tùy chỉnh.</p>
          <div className="admin-decant-option-row">
            {PRESET_DECANT_SIZES.map((volume) => (
              <button key={volume} type="button" className="btn btn-sm luxury-primary-btn" onClick={() => openOptionModal(volume)}>{volume}ml</button>
            ))}
            <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => openOptionModal('custom')}>Size tùy chỉnh</button>
          </div>
          {options.length > 0 ? (
            <div className="admin-decant-option-grid">
              {options.map((opt) => {
                const active = isActiveStatus(opt.status);
                const volume = toNumber(opt.volume_ml ?? opt.volumeMl);
                const units = volume > 0 ? Math.floor(remainingMl / volume) : 0;
                return (
                  <article key={opt.id} className="admin-decant-option-card">
                    <div className="admin-decant-option-card-top">
                      <strong>{volume}ml decant</strong>
                      <AdminStatusBadge status={active ? 'ACTIVE' : 'LOCKED'} />
                    </div>
                    <p>{formatAdminCurrency(opt.price)}</p>
                    <small>Còn khoảng {units} phần chiết từ tổng ml hiện tại.</small>
                    <div className="admin-decant-option-actions">
                      <button type="button" className="btn btn-sm btn-outline-dark" disabled={saving} onClick={() => toggleOptionStatus(opt)}>
                        {active ? 'Tắt option' : 'Bật option'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state compact">Chưa có option decant. Hãy tạo 5ml / 10ml / 20ml hoặc size tùy chỉnh để hiển thị tại đây.</div>
          )}

          <h4 className="mt-3">Lịch sử chiết</h4>
          {movements.length > 0 ? (
            <div className="admin-movement-timeline">
              {movements.slice(0, 8).map((movement) => {
                const batchCode = movement.batch_code || movement.batchCode || '';
                const orderId = movement.order_id || movement.orderId || null;
                const adminName = movement.admin_name || movement.adminName || '';
                return (
                  <article key={movement.id} className="admin-movement-item">
                    <div className="admin-movement-badge">{movement.movement_type}</div>
                    <div className="admin-movement-body">
                      <strong>{movement.reference || movement.product_name || selectedProduct?.name || formatAdminDate(movement.created_at)}</strong>
                      <small>{toNumber(movement.quantity_ml)}ml · {batchCode ? `Batch ${batchCode}` : 'Chưa gắn batch'}{orderId ? ` · Order #${orderId}` : ''}</small>
                      <small>{adminName ? `Admin: ${adminName} · ` : ''}{formatAdminDate(movement.created_at)}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state compact">Chưa có lịch sử chiết cho sản phẩm này.</div>
          )}
        </section>
      </div>

      {selectedProduct && remainingMl <= 20 && <div className="alert alert-warning admin-alert mt-3">Cảnh báo: batch của sản phẩm đang còn dưới 20ml.</div>}
      {isBelowSmallestOption && <div className="alert alert-warning admin-alert mt-3">Cảnh báo: sản phẩm không còn đủ ml cho option nhỏ nhất ({minOptionMl}ml).</div>}

      {optionModalOpen && (
        <AdminDecantModal
          title="Tạo option decant"
          description="Chọn size preset hoặc nhập size tùy chỉnh, sau đó đặt giá bán và trạng thái."
          onClose={() => setOptionModalOpen(false)}
        >
          <form className="admin-decant-form" onSubmit={submitOption}>
            {modalError && <div className="alert alert-danger admin-alert">{modalError}</div>}
            <div className="admin-decant-size-picker">
              {PRESET_DECANT_SIZES.map((volume) => (
                <button
                  key={volume}
                  type="button"
                  className={optionForm.preset === String(volume) ? 'active' : ''}
                  onClick={() => setOptionForm((form) => ({ ...form, preset: String(volume), customVolumeMl: '' }))}
                >
                  {volume}ml
                </button>
              ))}
              <button
                type="button"
                className={optionForm.preset === 'custom' ? 'active' : ''}
                onClick={() => setOptionForm((form) => ({ ...form, preset: 'custom' }))}
              >
                Tùy chỉnh
              </button>
            </div>
            {optionForm.preset === 'custom' && (
              <label className="admin-decant-field">
                <span>Size tùy chỉnh (ml)</span>
                <input type="number" min="1" step="1" value={optionForm.customVolumeMl} onChange={(e) => setOptionForm((form) => ({ ...form, customVolumeMl: e.target.value }))} />
              </label>
            )}
            <label className="admin-decant-field">
              <span>Giá bán</span>
              <input type="number" min="0" step="1000" value={optionForm.price} onChange={(e) => setOptionForm((form) => ({ ...form, price: e.target.value }))} />
            </label>
            <label className="admin-decant-check">
              <input type="checkbox" checked={optionForm.status} onChange={(e) => setOptionForm((form) => ({ ...form, status: e.target.checked }))} />
              <span>Đang active</span>
            </label>
            <div className="admin-decant-modal-actions">
              <button type="button" className="btn btn-outline-dark" onClick={() => setOptionModalOpen(false)}>Hủy</button>
              <button type="submit" className="btn luxury-primary-btn" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu option'}</button>
            </div>
          </form>
        </AdminDecantModal>
      )}

      {batchModal && (
        <AdminDecantModal
          title="Cập nhật remaining ml"
          description={batchModal.batch_code ? `Batch ${batchModal.batch_code}` : `Batch #${batchModal.id}`}
          onClose={() => setBatchModal(null)}
        >
          <form className="admin-decant-form" onSubmit={submitBatchRemaining}>
            {modalError && <div className="alert alert-danger admin-alert">{modalError}</div>}
            <div className="admin-decant-form-summary">
              <div><span>Total volume</span><strong>{toNumber(batchModal.total_volume_ml ?? batchModal.totalVolumeMl)}ml</strong></div>
              <div><span>Remaining hiện tại</span><strong>{toNumber(batchModal.remaining_volume_ml ?? batchModal.remainingVolumeMl)}ml</strong></div>
            </div>
            <label className="admin-decant-field">
              <span>Remaining ml mới</span>
              <input type="number" min="0" step="1" value={batchForm.remainingVolumeMl} onChange={(e) => setBatchForm((form) => ({ ...form, remainingVolumeMl: e.target.value }))} />
            </label>
            <label className="admin-decant-field">
              <span>Lý do chỉnh tay</span>
              <textarea rows="3" value={batchForm.reason} onChange={(e) => setBatchForm((form) => ({ ...form, reason: e.target.value }))} placeholder="Ví dụ: kiểm kê cuối ngày, chai hoàn kho, hao hụt demo..." />
            </label>
            <div className="admin-decant-modal-actions">
              <button type="button" className="btn btn-outline-dark" onClick={() => setBatchModal(null)}>Hủy</button>
              <button type="submit" className="btn luxury-primary-btn" disabled={saving}>{saving ? 'Đang lưu...' : 'Cập nhật batch'}</button>
            </div>
          </form>
        </AdminDecantModal>
      )}
    </div>
  );
}
