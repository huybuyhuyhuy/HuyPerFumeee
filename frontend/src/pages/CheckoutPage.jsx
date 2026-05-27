import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import { resolveProductImage } from '../utils/image';
import { formatVnCurrency } from '../utils/formatters';
import { siteContact } from '../config/siteConfig';

const paymentMethods = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng', note: 'Phù hợp khi bạn muốn kiểm tra kiện hàng trước.' },
  { value: 'MOMO', label: 'Ví MoMo', note: 'Chuyển sang cổng MoMo sau khi tạo đơn.' },
  { value: 'ZALOPAY', label: 'ZaloPay', note: 'Chuyển sang cổng ZaloPay sau khi tạo đơn.' },
];

export function CheckoutPage() {
  const { cart, loading: cartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const normalizedPhone = useMemo(() => phone.replace(/\D/g, ''), [phone]);

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [cart, cartLoading, navigate]);

  useEffect(() => {
    setPhone((current) => current || user?.phone || '');
    setAddress((current) => current || user?.address || '');
  }, [user?.phone, user?.address]);

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
      });

      await clearCart();

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
                return (
                  <div key={`${product.id}-${product.variantId || 'default'}`} className="luxury-checkout-item">
                    <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" decoding="async" />
                    <div>
                      <strong>{product.name}</strong>
                      <span>x{item.quantity}</span>
                    </div>
                    <b>{formatVnCurrency(price * item.quantity)}</b>
                  </div>
                );
              })}
            </div>
            <div className="luxury-summary-total">
              <span>Tổng cộng</span>
              <strong>{formatVnCurrency(cart.total)}</strong>
            </div>
            {formError && <p className="luxury-checkout-error" role="alert">{formError}</p>}
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
