import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { clearCartVoucher } from '../utils/cartVoucherStorage';

function getStatusTone(status: string) {
  if (status === 'success') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'cancel') return 'warning';
  if (status === 'failed') return 'danger';
  return 'neutral';
}

function getStatusTitle(status: string) {
  if (status === 'success') return 'Thanh toán thành công';
  if (status === 'pending') return 'Đơn hàng đang chờ xác nhận';
  if (status === 'cancel') return 'Thanh toán đã bị hủy';
  if (status === 'failed') return 'Thanh toán thất bại';
  return 'Không thể xác nhận thanh toán';
}

function getStatusMessage(status: string, payment: string, resultCode?: string | null) {
  const methodLabel = payment === 'zalopay' ? 'ZaloPay' : 'MoMo';
  if (status === 'success') return `Giao dịch qua ${methodLabel} đã hoàn tất. Đơn hàng của bạn đang được xử lý.`;
  if (status === 'pending') return `${methodLabel} đã chuyển bạn về website, nhưng hệ thống vẫn đang chờ xác nhận thanh toán chính thức. Đơn hàng chưa được đánh dấu đã thanh toán.`;
  if (status === 'cancel') return `Bạn đã hủy giao dịch ${methodLabel}. Đơn hàng chưa được đánh dấu đã thanh toán.`;
  if (status === 'failed') return `Giao dịch ${methodLabel} không thành công${resultCode ? ` (mã ${resultCode})` : ''}. Bạn có thể thử lại hoặc chọn COD.`;
  return 'Không nhận được trạng thái thanh toán hợp lệ từ cổng thanh toán.';
}

export function PaymentReturnPage() {
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const payment = String(searchParams.get('payment') || '').toLowerCase();
  const status = String(searchParams.get('status') || 'failed').toLowerCase();
  const rawOrderId = searchParams.get('orderId');
  const resultCode = searchParams.get('resultCode');
  const orderId = status === 'success' ? rawOrderId : null;
  const hasPlacedOrder = Boolean(orderId);
  const tone = useMemo(() => getStatusTone(status), [status]);
  const title = useMemo(() => getStatusTitle(status), [status]);
  const message = useMemo(() => getStatusMessage(status, payment, resultCode), [status, payment, resultCode]);

  useEffect(() => {
    document.title = `${title} | HuyPerfume`;
  }, [title]);

  useEffect(() => {
    if (status !== 'success') return;
    clearCart().catch(() => undefined);
    clearCartVoucher();
  }, [clearCart, status]);

  return (
    <main className="luxury-page payment-return-page">
      <div className="container">
        <section className={`luxury-surface payment-return-card tone-${tone}`}>
          <p className="section-eyebrow">Kết quả thanh toán</p>
          <h1>{title}</h1>
          <p>{message}</p>
          {orderId && <p className="payment-return-order">Mã đơn hàng: <strong>#{orderId}</strong></p>}
          <div className="payment-return-actions">
            {orderId && <Link to={`/orders/${orderId}`} className="btn luxury-primary-btn">Xem đơn hàng</Link>}
            <Link to="/orders" className="btn luxury-secondary-btn">Về lịch sử đơn hàng</Link>
            {status !== 'success' && <Link to="/checkout" className="btn luxury-link-btn">Thử thanh toán lại</Link>}
            {status !== 'success' && <Link to="/cart" className="btn luxury-link-btn">Quay về giỏ hàng</Link>}
          </div>
        </section>
      </div>
    </main>
  );
}
