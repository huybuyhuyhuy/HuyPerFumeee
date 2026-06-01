import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { voucherService } from '../services/voucherService';
import { clearCartVoucher, readCartVoucher, saveCartVoucher } from '../utils/cartVoucherStorage';
import { resolveProductImage } from '../utils/image';
import { formatVnCurrency } from '../utils/formatters';
import '../styles/cart.css';

function getCartItemSelection(product) {
  const itemType = String(product?.itemType || '').toUpperCase();
  const selectedVariantType = String(product?.selectedVariant?.type || '').toUpperCase();
  const isDecant = itemType === 'DECANT' || selectedVariantType === 'DECANT';
  const volumeMl = product?.selectedVolumeMl || product?.selectedVariant?.volumeMl || null;

  return {
    isDecant,
    label: isDecant
      ? `Chiết ${volumeMl || ''}ml`.trim()
      : (product?.selectedVariant?.volume || product?.selectedVariant?.label || 'Full chai'),
    options: {
      itemType: isDecant ? 'DECANT' : 'FULL_BOTTLE',
      volumeMl: isDecant ? volumeMl : null,
    },
  };
}

function formatVoucherDiscount(voucher) {
  if (!voucher) return '';
  if (voucher.discountType === 'PERCENT') {
    const percent = Number(voucher.discountValue || voucher.discountPercent || 0);
    return `${Number.isInteger(percent) ? percent : percent.toLocaleString('vi-VN')}%`;
  }
  return formatVnCurrency(voucher.discountValue);
}

function getVoucherErrorMessage(error) {
  const responseData = error?.response?.data || {};
  return responseData?.data?.message || responseData?.message || error?.message || 'Không áp dụng được mã voucher.';
}

export function CartPage() {
  const { cart, loading, error, fetchCart, updateQuantity, removeItem, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const [voucherCode, setVoucherCode] = useState(() => readCartVoucher()?.code || '');
  const [voucherMessage, setVoucherMessage] = useState(null);
  const [voucherApplying, setVoucherApplying] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(() => readCartVoucher());
  const cartItems = cart?.items || [];
  const itemCount = cart?.itemCount || cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const subtotal = cart?.total || 0;
  const appliedSubtotal = Number(appliedVoucher?.subtotal || 0);
  const currentSubtotal = Math.round(Number(subtotal || 0));
  const voucherMatchesSubtotal = Boolean(appliedVoucher && appliedSubtotal === currentSubtotal);
  const voucherDiscount = voucherMatchesSubtotal ? Number(appliedVoucher.discountAmount || 0) : 0;
  const totalAfterDiscount = Math.max(0, currentSubtotal - voucherDiscount);

  const handleVoucherApply = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setAppliedVoucher(null);
      clearCartVoucher();
      setVoucherMessage({ tone: 'error', text: 'Vui lòng nhập mã voucher.' });
      return;
    }

    try {
      setVoucherApplying(true);
      const voucher = await voucherService.validateVoucher({ code, subtotal: currentSubtotal });
      setAppliedVoucher(voucher);
      saveCartVoucher(voucher);
      setVoucherCode(voucher.code || code);
      setVoucherMessage({
        tone: 'success',
        text: `Áp dụng ${voucher.code}: giảm ${formatVoucherDiscount(voucher)}, tương ứng ${formatVnCurrency(voucher.discountAmount)}.`,
      });
    } catch (err) {
      setAppliedVoucher(null);
      clearCartVoucher();
      setVoucherMessage({ tone: 'error', text: getVoucherErrorMessage(err) });
    } finally {
      setVoucherApplying(false);
    }
  };

  const handleClearCart = async () => {
    clearCartVoucher();
    setAppliedVoucher(null);
    setVoucherMessage(null);
    await clearCart();
  };

  useEffect(() => {
    if (appliedVoucher && !voucherMatchesSubtotal) {
      clearCartVoucher();
    }
  }, [appliedVoucher, voucherMatchesSubtotal]);

  useEffect(() => {
    const code = String(appliedVoucher?.code || '').trim().toUpperCase();
    if (!code || currentSubtotal <= 0 || !voucherMatchesSubtotal) return undefined;

    let active = true;
    voucherService.validateVoucher({ code, subtotal: currentSubtotal })
      .then((voucher) => {
        if (!active) return;
        setAppliedVoucher(voucher);
        saveCartVoucher(voucher);
        setVoucherCode(voucher.code || code);
        setVoucherMessage((current) => {
          if (current?.tone !== 'success') return current;
          return {
            tone: 'success',
            text: `Áp dụng ${voucher.code}: giảm ${formatVoucherDiscount(voucher)}, tương ứng ${formatVnCurrency(voucher.discountAmount)}.`,
          };
        });
      })
      .catch(() => {
        if (!active) return;
        setAppliedVoucher(null);
        clearCartVoucher();
      });

    return () => {
      active = false;
    };
  }, [appliedVoucher?.code, currentSubtotal, voucherMatchesSubtotal]);

  if (loading) {
    return (
      <main className="luxury-page cart-page">
        <div className="container">
          <div className="cart-state-card luxury-surface">
            <div className="spinner-border cart-state-spinner" role="status" aria-label="Đang tải giỏ hàng" />
            <h1>Đang chuẩn bị giỏ hàng</h1>
            <p>HuyPerfume đang đồng bộ các sản phẩm bạn đã chọn.</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <main className="luxury-page cart-page">
        <div className="container">
          <div className="cart-state-card luxury-surface">
            <p className="section-eyebrow justify-content-center">Lỗi giỏ hàng</p>
            <h1>Chưa tải được giỏ hàng</h1>
            <p>{error}</p>
            <button type="button" className="btn luxury-primary-btn" onClick={fetchCart}>Thử lại</button>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <main className="luxury-page cart-page">
        <div className="container">
          <div className="cart-state-card luxury-surface">
            <p className="section-eyebrow justify-content-center">Sản phẩm đã chọn</p>
            <h1>Giỏ hàng đang trống</h1>
            <p>Lưu lại vài mùi hương bạn thích trước, rồi quay lại đây để kiểm tra đơn hàng.</p>
            <div className="cart-state-actions">
              <Link to="/products" className="btn luxury-primary-btn">Khám phá sản phẩm</Link>
              <Link to="/" className="btn luxury-secondary-btn">Về trang chủ</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="luxury-page cart-page">
      <div className="container">
        <section className="cart-hero-panel">
          <div>
            <p className="section-eyebrow">Sản phẩm đã chọn</p>
            <h1>Giỏ hàng của bạn</h1>
            <p>{itemCount} sản phẩm đã sẵn sàng. Kiểm tra lại số lượng và phiên bản trước khi thanh toán.</p>
          </div>
          <div className="cart-hero-actions">
            <Link to="/products" className="btn luxury-secondary-btn">Tiếp tục mua sắm</Link>
            <button type="button" className="cart-clear-btn" onClick={handleClearCart}>Làm trống giỏ</button>
          </div>
        </section>

        <div className="cart-layout">
          <section className="cart-items-panel" aria-label="Sản phẩm trong giỏ">
            <div className="cart-panel-head">
              <div>
                <span>Danh sách sản phẩm</span>
                <h2>Chi tiết giỏ hàng</h2>
              </div>
              <strong>{cartItems.length} dòng sản phẩm</strong>
            </div>

            {error && (
              <div className="cart-inline-error">
                <span>{error}</span>
                <button type="button" onClick={fetchCart}>Thử lại</button>
              </div>
            )}

            <div className="cart-item-list">
              {cartItems.map((item) => {
                const product = item.product;
                const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
                const stock = Number(product.stockQuantity || product.stock || 0);
                const selection = getCartItemSelection(product);
                const key = `${product.id}-${product.variantId || 'default'}-${selection.options.itemType}-${selection.options.volumeMl || 'full'}`;

                return (
                  <article key={key} className="cart-item-card">
                    <Link to={`/products/${product.id}`} className="cart-item-media" aria-label={`Xem ${product.name}`}>
                      <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" decoding="async" />
                    </Link>

                    <div className="cart-item-info">
                      <div>
                        <span className="cart-item-brand">{product.brand?.name || 'HuyPerfume'}</span>
                        <h2><Link to={`/products/${product.id}`}>{product.name}</Link></h2>
                      </div>
                      <div className="cart-item-tags">
                        {selection.label && <span>{selection.label}</span>}
                        <span>
                          {selection.isDecant
                            ? `Còn ${stock} phần chiết${product.availableVolumeMl ? ` · ${product.availableVolumeMl}ml có thể chiết` : ''}`
                            : `Còn ${stock} chai`}
                        </span>
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <div className="cart-quantity-stepper" aria-label={`Số lượng ${product.name}`}>
                        <button type="button" onClick={() => updateQuantity(product.id, item.quantity - 1, product.variantId, selection.options)} aria-label="Giảm số lượng">-</button>
                        <strong>{item.quantity}</strong>
                        <button type="button" onClick={() => updateQuantity(product.id, item.quantity + 1, product.variantId, selection.options)} disabled={stock <= 0 || item.quantity >= stock} aria-label="Tăng số lượng">+</button>
                      </div>
                      <button type="button" className="cart-remove-btn" onClick={() => removeItem(product.id, product.variantId, selection.options)}>Xóa</button>
                    </div>

                    <div className="cart-item-price">
                      <strong>{formatVnCurrency(unitPrice * item.quantity)}</strong>
                      <span>{formatVnCurrency(unitPrice)} / {selection.isDecant ? 'phần chiết' : 'sản phẩm'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="cart-summary-card">
            <p className="section-eyebrow">Tổng đơn hàng</p>
            <h2>Tổng đơn hàng</h2>

            <div className="cart-summary-lines">
              <div className="cart-summary-line"><span>Tạm tính</span><strong>{formatVnCurrency(subtotal)}</strong></div>
              <div className="cart-summary-line"><span>Phí vận chuyển</span><strong>Miễn phí</strong></div>
              {voucherMatchesSubtotal && (
                <div className="cart-summary-line cart-summary-discount">
                  <span>Voucher {appliedVoucher.code} ({formatVoucherDiscount(appliedVoucher)})</span>
                  <strong>-{formatVnCurrency(voucherDiscount)}</strong>
                </div>
              )}
            </div>

            <div className="cart-voucher-box">
              <label htmlFor="cart-voucher-code">Nhập mã voucher mà bạn có</label>
              <div className="cart-voucher-control">
                <input
                  id="cart-voucher-code"
                  type="text"
                  placeholder="Ví dụ: HUY10"
                  value={voucherCode}
                  onChange={(event) => {
                    setVoucherCode(event.target.value.toUpperCase());
                    setVoucherMessage(null);
                    setAppliedVoucher(null);
                    clearCartVoucher();
                  }}
                />
                <button type="button" onClick={handleVoucherApply} disabled={voucherApplying}>
                  {voucherApplying ? 'Đang áp dụng' : 'Áp dụng'}
                </button>
              </div>
              {voucherMessage && (
                <p className={`cart-voucher-message is-${voucherMessage.tone}`}>{voucherMessage.text}</p>
              )}
              {voucherMatchesSubtotal && (
                <div className="cart-voucher-result">
                  <span>{appliedVoucher.name || appliedVoucher.code}</span>
                  <strong>Giảm {formatVoucherDiscount(appliedVoucher)}</strong>
                  <small>Tương ứng {formatVnCurrency(voucherDiscount)}</small>
                </div>
              )}
              {appliedVoucher && !voucherMatchesSubtotal && (
                <p className="cart-voucher-message is-error">Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã voucher.</p>
              )}
            </div>

            <div className="cart-summary-lines">
              <div className="cart-summary-line"><span>Gói hàng cao cấp</span><strong>Free</strong></div>
              <div className="cart-summary-line"><span>Đóng gói làm quà</span><strong>Free</strong></div>
            </div>

            <div className="cart-summary-total"><span>Tổng cộng</span><strong>{formatVnCurrency(totalAfterDiscount)}</strong></div>

            <Link to="/checkout" className="btn luxury-primary-btn cart-checkout-btn">
              {isLoggedIn ? 'Thanh toán' : 'Đăng nhập để thanh toán'}
            </Link>
            {!isLoggedIn && <p className="luxury-summary-note">Giỏ hàng của bạn đã được lưu tạm trên trình duyệt và sẽ được đồng bộ sau khi đăng nhập.</p>}
            <ul className="cart-summary-promises">
              <li>Chính hãng 100%</li>
              <li>Đóng gói quà tặng tinh tế</li>
              <li>Hỗ trợ đổi trả rõ ràng</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
