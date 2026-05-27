import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { resolveProductImage } from '../utils/image';
import { formatVnCurrency } from '../utils/formatters';

export function CartPage() {
  const { cart, loading, error, fetchCart, updateQuantity, removeItem, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const itemCount = cart?.itemCount || 0;
  const subtotal = cart?.total || 0;

  if (loading) {
    return (
      <main className="luxury-page cart-page">
        <div className="container">
          <div className="luxury-cart-loading luxury-surface">Đang chuẩn bị giỏ hàng...</div>
        </div>
      </main>
    );
  }

  if (error && !cart.items.length) {
    return (
      <main className="luxury-page cart-page">
        <div className="container">
          <div className="luxury-cart-empty luxury-surface text-center">
            <p className="section-eyebrow justify-content-center">Lỗi giỏ hàng</p>
            <h1>Chưa tải được giỏ hàng</h1>
            <p>{error}</p>
            <button className="btn luxury-primary-btn" onClick={fetchCart}>Thử lại</button>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="luxury-page cart-page">
        <div className="container">
          <div className="luxury-cart-empty luxury-surface text-center">
            <p className="section-eyebrow justify-content-center">Sản phẩm đã chọn</p>
            <h1>Giỏ hàng đang trống</h1>
            <p>Lưu lại vài mùi hương bạn thích trước, rồi quay lại đây để kiểm tra đơn hàng thật gọn.</p>
            <Link to="/products" className="btn luxury-primary-btn">Khám phá sản phẩm</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="luxury-page cart-page">
      <div className="container">
        <section className="luxury-cart-hero">
          <div>
            <p className="section-eyebrow">Sản phẩm đã chọn</p>
            <h1>Giỏ hàng của bạn</h1>
            <p>{itemCount} sản phẩm đã sẵn sàng. Kiểm tra lại số lượng và biến thể trước khi thanh toán.</p>
          </div>
          <div className="luxury-cart-hero-actions">
            <Link to="/products" className="btn luxury-secondary-btn">Tiếp tục mua sắm</Link>
            <button type="button" className="btn luxury-link-btn" onClick={clearCart}>Làm trống giỏ</button>
          </div>
        </section>

        <div className="luxury-cart-layout">
          <section className="luxury-cart-items" aria-label="Sản phẩm trong giỏ">
            {cart.items.map((item) => {
              const product = item.product;
              const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
              const stock = Number(product.stockQuantity || product.stock || 0);
              const selectedVariant = product.selectedVariant;
              const variantType = String(selectedVariant?.type || '').toUpperCase();
              const isDecant = variantType === 'DECANT';
              const variantLabel = selectedVariant?.volume
                ? `${selectedVariant.volume}${isDecant ? ' (Chiết)' : ''}`
                : selectedVariant?.label || selectedVariant?.sku;

              return (
                <article key={`${product.id}-${product.variantId || 'default'}`} className="luxury-cart-item luxury-surface">
                  <Link to={`/products/${product.id}`} className="luxury-cart-item-media">
                    <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" decoding="async" />
                  </Link>
                  <div className="luxury-cart-item-copy">
                    <span>{product.brand?.name || 'HuyPerfume'}</span>
                    <h2><Link to={`/products/${product.id}`}>{product.name}</Link></h2>
                    {variantLabel && <p>{variantLabel}</p>}
                    <small>{isDecant && product.decantInventory ? `${product.decantInventory.sealedBottles} chai seal · ${product.decantInventory.openedMl}ml đã mở` : `Còn ${stock} sản phẩm`}</small>
                  </div>
                  <div className="luxury-cart-item-controls">
                    <div className="luxury-quantity-stepper" aria-label={`Số lượng ${product.name}`}>
                      <button type="button" onClick={() => updateQuantity(product.id, item.quantity - 1, product.variantId)} aria-label="Giảm số lượng">-</button>
                      <strong>{item.quantity}</strong>
                      <button type="button" onClick={() => updateQuantity(product.id, item.quantity + 1, product.variantId)} disabled={stock <= 0 || item.quantity >= stock} aria-label="Tăng số lượng">+</button>
                    </div>
                    <button type="button" className="luxury-remove-btn" onClick={() => removeItem(product.id, product.variantId)}>Xóa</button>
                  </div>
                  <div className="luxury-cart-item-price">
                    <strong>{formatVnCurrency(unitPrice * item.quantity)}</strong>
                    <span>{formatVnCurrency(unitPrice)} / sản phẩm</span>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="luxury-cart-summary luxury-surface">
            <p className="section-eyebrow">Tóm tắt đơn hàng</p>
            <h2>Tóm tắt đơn hàng</h2>
            <div className="luxury-summary-line"><span>Tạm tính</span><strong>{formatVnCurrency(subtotal)}</strong></div>
            <div className="luxury-summary-line"><span>Vận chuyển</span><strong>Miễn phí</strong></div>
            <div className="luxury-summary-total"><span>Tổng cộng</span><strong>{formatVnCurrency(subtotal)}</strong></div>
            <Link to="/checkout" className="btn luxury-primary-btn w-100">
              {isLoggedIn ? 'Thanh toán an toàn' : 'Đăng nhập để thanh toán'}
            </Link>
            {!isLoggedIn && <p className="luxury-summary-note">Giỏ hàng của bạn đã được lưu tạm trên trình duyệt và sẽ được đồng bộ sau khi đăng nhập.</p>}
            <ul className="luxury-cart-promises">
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
