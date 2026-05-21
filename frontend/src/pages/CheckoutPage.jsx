import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';

export function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart, navigate]);

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const handleCheckout = async () => {
    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại');
      return;
    }
    setLoading(true);
    try {
      const order = await orderService.checkout({ shippingAddress: address, phone, paymentMethod });
      await clearCart();

      if (paymentMethod === 'MOMO') {
        const paymentResponse = await orderService.createMomoPayment(order.id);
        const paymentUrl = paymentResponse?.paymentUrl || paymentResponse?.payUrl;
        if (!paymentUrl) throw new Error('Khong tao duoc link thanh toan MoMo');
        window.location.href = paymentUrl;
        return;
      }

      if (paymentMethod === 'ZALOPAY') {
        const paymentResponse = await orderService.createZaloPayPayment(order.id);
        const paymentUrl = paymentResponse?.paymentUrl || paymentResponse?.orderUrl;
        if (!paymentUrl) throw new Error('Khong tao duoc link thanh toan ZaloPay');
        window.location.href = paymentUrl;
        return;
      }

      navigate('/orders');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container luxury-page">
      <div className="luxury-surface p-4 p-lg-5 mb-4">
        <p className="text-uppercase luxury-muted small mb-1">Secure checkout</p>
        <h3 className="mb-0">Thanh toán</h3>
      </div>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="luxury-surface p-4 mb-4">
            <h5 className="mb-4">Thông tin giao hàng</h5>
            <div className="mb-3">
              <label className="form-label">Họ tên</label>
              <input className="form-control" value={user?.name || ''} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label">Số điện thoại *</label>
              <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
            </div>
            <div className="mb-0">
              <label className="form-label">Địa chỉ giao hàng</label>
              <textarea className="form-control" rows={4} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nhập địa chỉ" />
            </div>
          </div>
          <div className="luxury-surface p-4">
            <h5 className="mb-4">Phương thức thanh toán</h5>
            {[
              { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
              { value: 'MOMO', label: 'Thanh toán qua MoMo' },
              { value: 'ZALOPAY', label: 'Thanh toán qua ZaloPay' },
            ].map((method) => (
              <div className="form-check mb-3" key={method.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  id={method.value}
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <label className="form-check-label" htmlFor={method.value}>
                  {method.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="luxury-surface p-4 sticky-lg-top" style={{ top: '1rem' }}>
            <h5>Đơn hàng</h5>
            <hr />
            {cart.items.map((item) => (
              <div key={item.product.id} className="d-flex justify-content-between mb-3">
                <span className="small pe-2">
                  {item.product.name} x{item.quantity}
                </span>
                <span className="small text-end">
                  {((item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity).toLocaleString('vi-VN')}₫
                </span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>Tổng:</span>
              <span>{cart.total.toLocaleString('vi-VN')}₫</span>
            </div>
            <button className="btn btn-dark w-100 mt-3" disabled={loading} onClick={handleCheckout}>
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

