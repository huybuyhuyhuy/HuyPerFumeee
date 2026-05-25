import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { resolveProductImage } from '../utils/image';

export function CartPage() {
  const { cart, loading, error, fetchCart, updateQuantity, removeItem } = useCart();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="container py-5 text-center">
        <h4>Vui lòng đăng nhập để xem giỏ hàng</h4>
        <Link to="/login" className="btn btn-dark mt-3">
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  if (error) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-danger mb-3">{error}</h4>
        <button className="btn btn-outline-dark" onClick={fetchCart}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h4>Giỏ hàng trống</h4>
        <Link to="/products" className="btn btn-dark mt-3">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container luxury-page">
      <div className="d-flex justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="text-uppercase luxury-muted small mb-1">Your selection</p>
          <h3 className="mb-0">Giỏ hàng ({cart.itemCount} sản phẩm)</h3>
        </div>
        <Link to="/products" className="btn btn-outline-dark">Tiếp tục mua sắm</Link>
      </div>
      <div className="row g-4">
        <div className="col-lg-8">
          {cart.items.map((item) => (
            <div key={`${item.product.id}-${item.product.variantId || 'default'}`} className="card luxury-card mb-3">
              <div className="row g-0 align-items-center p-3">
                <div className="col-4 col-md-2">
                  <img
                    src={resolveProductImage(item.product.image)}
                    className="img-fluid rounded-4"
                    alt={item.product.name}
                    loading="lazy"
                    decoding="async"
                    style={{ height: '110px', objectFit: 'cover', width: '100%' }}
                  />
                </div>
                <div className="col-8 col-md-6 px-3">
                  <h6 className="mb-1">
                    <Link to={`/products/${item.product.id}`} className="text-decoration-none text-dark">{item.product.name}</Link>
                  </h6>
                  {item.product.selectedVariant && (
                    <p className="luxury-muted small mb-1">
                      {item.product.selectedVariant.volume || item.product.selectedVariant.label || item.product.selectedVariant.sku}
                    </p>
                  )}
                  <p className="luxury-price mb-0">
                    {(item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price).toLocaleString('vi-VN')}₫
                  </p>
                </div>
                <div className="col-6 col-md-2 mt-3 mt-md-0">
                  <div className="input-group input-group-sm">
                    <button className="btn btn-outline-secondary" onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.variantId)}>-</button>
                    <span className="input-group-text bg-white">{item.quantity}</span>
                    <button className="btn btn-outline-secondary" onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.variantId)}>+</button>
                  </div>
                </div>
                <div className="col-6 col-md-2 text-end mt-3 mt-md-0">
                  <button className="btn btn-outline-danger btn-sm" onClick={() => removeItem(item.product.id, item.product.variantId)}>
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="col-lg-4">
          <div className="luxury-surface p-4 sticky-lg-top" style={{ top: '1rem' }}>
            <h5>Tổng đơn hàng</h5>
            <hr />
            <div className="d-flex justify-content-between">
              <span>Tạm tính:</span>
              <span>{cart.total.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span>Phí vận chuyển:</span>
              <span>Miễn phí</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Tổng cộng:</span>
              <span>{cart.total.toLocaleString('vi-VN')}₫</span>
            </div>
            <Link to="/checkout" className="btn btn-dark w-100 mt-3">
              Thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

