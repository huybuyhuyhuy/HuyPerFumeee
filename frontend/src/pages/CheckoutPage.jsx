import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import { voucherService } from '../services/voucherService';
import { clearCartVoucher, readCartVoucher, saveCartVoucher } from '../utils/cartVoucherStorage';
import { resolveProductImage } from '../utils/image';
import { formatVnCurrency } from '../utils/formatters';
import { siteContact } from '../config/siteConfig';

const paymentMethods = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng', note: 'Phù hợp khi bạn muốn kiểm tra kiện hàng trước.' },
  { value: 'MOMO', label: 'Ví MoMo', note: 'Chuyển sang cổng MoMo sau khi tạo đơn.' },
  { value: 'ZALOPAY', label: 'ZaloPay', note: 'Chuyển sang cổng ZaloPay sau khi tạo đơn.' },
];

function getCartItemLabel(product) {
  const itemType = String(product?.itemType || '').toUpperCase();
  const variantType = String(product?.selectedVariant?.type || '').toUpperCase();
  const isDecant = itemType === 'DECANT' || variantType === 'DECANT';
  const volumeMl = product?.selectedVolumeMl || product?.selectedVariant?.volumeMl || null;
  return isDecant ? `Chiết ${volumeMl || ''}ml`.trim() : (product?.selectedVariant?.volume || product?.selectedVariant?.label || 'Full chai');
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

export function CheckoutPage() {
  const { cart, loading: cartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(() => readCartVoucher());
  const [voucherMessage, setVoucherMessage] = useState('');

  const normalizedPhone = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const cartTotal = Math.round(Number(cart?.total || 0));
  const voucherMatchesSubtotal = Boolean(appliedVoucher && Number(appliedVoucher.subtotal || 0) === cartTotal);
  const voucherDiscount = voucherMatchesSubtotal ? Number(appliedVoucher.discountAmount || 0) : 0;
  const checkoutTotal = Math.max(0, cartTotal - voucherDiscount);

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [cart, cartLoading, navigate]);

  useEffect(() => {
    setPhone((current) => current || user?.phone || '');
    setAddress((current) => current || user?.address || '');
  }, [user?.phone, user?.address]);

  useEffect(() => {
    if (!cartTotal) return;

    const storedVoucher = readCartVoucher();
    if (!storedVoucher?.code) {
      setAppliedVoucher(null);
      setVoucherMessage('');
      return;
    }

    let ignore = false;
    voucherService.validateVoucher({ code: storedVoucher.code, subtotal: cartTotal })
      .then((voucher) => {
        if (ignore) return;
        setAppliedVoucher(voucher);
        saveCartVoucher(voucher);
        setVoucherMessage('');
      })
      .catch((err) => {
        if (ignore) return;
        setAppliedVoucher(null);
        clearCartVoucher();
        setVoucherMessage(getVoucherErrorMessage(err));
      });

    return () => {
      ignore = true;
    };
  }, [cartTotal]);

  if (cartLoading) {
    return (
      <main className="luxury-page checkout-page">
        <div className="container">
          <div className="luxury-cart-loading luxury-surface">Đang chuẩn bị thanh toán...</div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const handleCheckout = async () => {
    setFormError('');

    if (!/^\d{10}$/.test(normalizedPhone)) {
      setFormError('Số điện thoại cần đúng 10 chữ số.');
      return;
    }
    if (!address.trim()) {
      setFormError('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    try {
      const order = await orderService.checkout({
        shippingAddress: address.trim(),
        phone: normalizedPhone,
        paymentMethod,
        voucherCode: voucherMatchesSubtotal ? appliedVoucher.code : '',
      });

      await clearCart();
      clearCartVoucher();

      if (paymentMethod === 'MOMO') {
        const paymentResponse = await orderService.createMomoPayment(order.id);
        const paymentUrl = paymentResponse?.paymentUrl || paymentResponse?.payUrl;
        if (!paymentUrl) throw new Error('Không tạo được link thanh toán MoMo');
        window.location.href = paymentUrl;
        return;
      }

      if (paymentMethod === 'ZALOPAY') {
        const paymentResponse = await orderService.createZaloPayPayment(order.id);
        const paymentUrl = paymentResponse?.paymentUrl || paymentResponse?.orderUrl;
        if (!paymentUrl) throw new Error('Không tạo được link thanh toán ZaloPay');
        window.location.href = paymentUrl;
        return;
      }

      navigate(`/orders/${order.id}/success`, { replace: true });
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Lỗi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="luxury-page checkout-page">
      <div className="container">
        <section className="luxury-checkout-hero">
          <div>
            <p className="section-eyebrow">Thanh toán an toàn</p>
            <h1>Thanh toán</h1>
            <p>Hoàn tất thông tin giao hàng, chọn phương thức thanh toán và xác nhận đơn.</p>
          </div>
          <Link to="/cart" className="btn luxury-secondary-btn">Quay lại giỏ hàng</Link>
        </section>

        <div className="luxury-checkout-layout">
          <section className="luxury-checkout-main">
            <div className="luxury-checkout-panel luxury-surface">
              <p className="section-eyebrow">Giao hàng</p>
              <h2>Thông tin giao hàng</h2>
              <div className="luxury-form-grid">
                <label>
                  <span>Họ tên</span>
                  <input value={user?.name || ''} disabled />
                </label>
                <label>
                  <span>Số điện thoại *</span>
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={siteContact.phone} inputMode="tel" autoComplete="tel" />
                </label>
              </div>
              <label className="luxury-form-field">
                <span>Địa chỉ giao hàng *</span>
                <textarea rows={4} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" autoComplete="shipping street-address" />
              </label>
            </div>

            <div className="luxury-checkout-panel luxury-surface">
              <p className="section-eyebrow">Thanh toán</p>
              <h2>Phương thức thanh toán</h2>
              <div className="luxury-payment-list">
                {paymentMethods.map((method) => (
                  <label key={method.value} className={`luxury-payment-option ${paymentMethod === method.value ? 'active' : ''}`}>
                    <input type="radio" value={method.value} checked={paymentMethod === method.value} onChange={(event) => setPaymentMethod(event.target.value)} />
                    <span>
                      <strong>{method.label}</strong>
                      <small>{method.note}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <aside className="luxury-checkout-summary luxury-surface">
            <p className="section-eyebrow">Đơn hàng</p>
            <h2>Đơn hàng</h2>
            <div className="luxury-checkout-items">
              {cart.items.map((item) => {
                const product = item.product;
                const price = product.discountPrice > 0 ? product.discountPrice : product.price;
                const itemLabel = getCartItemLabel(product);
                const key = `${product.id}-${product.variantId || 'default'}-${product.itemType || 'FULL_BOTTLE'}-${product.selectedVolumeMl || 'full'}`;
                return (
                  <div key={key} className="luxury-checkout-item">
                    <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" decoding="async" />
                    <div>
                      <strong>{product.name}</strong>
                      {itemLabel && <small>{itemLabel}</small>}
                      <span>x{item.quantity}</span>
                    </div>
                    <b>{formatVnCurrency(price * item.quantity)}</b>
                  </div>
                );
              })}
            </div>
            <div className="luxury-summary-line">
              <span>Tạm tính</span>
              <strong>{formatVnCurrency(cart.total)}</strong>
            </div>
            {voucherMatchesSubtotal && (
              <div className="luxury-summary-line luxury-summary-discount">
                <span>Voucher {appliedVoucher.code} ({formatVoucherDiscount(appliedVoucher)})</span>
                <strong>-{formatVnCurrency(voucherDiscount)}</strong>
              </div>
            )}
            {voucherMessage && <div className="luxury-checkout-voucher-note">{voucherMessage}</div>}
            <div className="luxury-summary-total">
              <span>Tổng cộng</span>
              <strong>{formatVnCurrency(checkoutTotal)}</strong>
            </div>
            {formError && <div className="luxury-checkout-error" role="alert">{formError}</div>}
            <button className="btn luxury-primary-btn w-100" disabled={loading} onClick={handleCheckout}>
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
            <p className="luxury-summary-note">Đơn COD sẽ được tạo ngay. Với MoMo/ZaloPay, hệ thống sẽ chuyển sang cổng thanh toán sau bước này.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
