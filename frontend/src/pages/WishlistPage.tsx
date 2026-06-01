import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../store/ToastContext';
import { useWishlist } from '../store/WishlistContext';
import { resolveProductImage } from '../utils/image';
import { formatVnCurrency } from '../utils/formatters';

export function WishlistPage() {
  const { items, loading, error, refreshWishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { isLoggedIn } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const totalValue = items.reduce((sum, product) => {
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    return sum + Number(price || 0);
  }, 0);

  const handleAddToCart = async (productId: number) => {
    try {
      await cartService.addItem(productId, 1);
      pushToast('Đã thêm vào giỏ hàng.', 'success');
      if (!isLoggedIn) {
        pushToast('Bạn có thể đăng nhập khi thanh toán, giỏ hàng sẽ được đồng bộ tự động.', 'info');
      }
    } catch (err: any) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
    }
  };

  const handleToggleWishlist = async (productId: number) => {
    const ok = await removeFromWishlist(productId);
    if (ok) pushToast('Đã xóa khỏi wishlist.', 'success');
  };

  return (
    <main className="luxury-page wishlist-page">
      <div className="container">
        <section className="luxury-wishlist-hero">
          <div>
            <p className="section-eyebrow">Đã lưu</p>
            <h1>Wishlist của bạn</h1>
            <p>Lưu những mùi hương đáng cân nhắc, so sánh nhanh và chuyển sang giỏ hàng khi đã chốt gu.</p>
          </div>
          <div className="luxury-wishlist-stats">
            <span><strong>{items.length}</strong> sản phẩm</span>
            <span><strong>{formatVnCurrency(totalValue)}</strong> giá trị dự kiến</span>
          </div>
        </section>

        {loading ? (
          <div className="luxury-cart-empty luxury-surface text-center">
            <p className="section-eyebrow justify-content-center">Đang tải</p>
            <h2>Đang đồng bộ wishlist</h2>
            <p>Vui lòng chờ một lát, chúng tôi đang tải danh sách yêu thích của bạn.</p>
          </div>
        ) : error && items.length === 0 ? (
          <div className="luxury-cart-empty luxury-surface text-center">
            <p className="section-eyebrow justify-content-center">Lỗi đồng bộ</p>
            <h2>Không tải được wishlist</h2>
            <p>{error}</p>
            <button type="button" className="btn luxury-primary-btn" onClick={refreshWishlist}>Thử lại</button>
          </div>
        ) : items.length === 0 ? (
          <div className="luxury-cart-empty luxury-surface text-center">
            <p className="section-eyebrow justify-content-center">Chưa có hương thơm nào</p>
            <h2>Chưa có sản phẩm yêu thích</h2>
            <p>Nhấn biểu tượng trái tim trên sản phẩm để lưu lại shortlist riêng của bạn.</p>
            <Link to="/products" className="btn luxury-primary-btn">Xem sản phẩm</Link>
          </div>
        ) : (
          <>
            <div className="luxury-wishlist-toolbar">
              <span>{isLoggedIn ? 'Danh sách yêu thích đang đồng bộ với tài khoản của bạn.' : 'Shortlist đã được lưu trên trình duyệt này.'}</span>
              <button type="button" className="btn luxury-link-btn" onClick={clearWishlist}>Xóa tất cả</button>
            </div>

            <div className="luxury-wishlist-grid">
              {items.map((product) => {
                const price = product.discountPrice > 0 ? product.discountPrice : product.price;
                const originalPrice = product.discountPrice > 0 && product.price > product.discountPrice ? product.price : 0;

                return (
                  <article key={product.id} className="luxury-wishlist-card luxury-surface">
                    <Link to={`/products/${product.id}`} className="luxury-wishlist-media">
                      <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" decoding="async" />
                    </Link>
                    <div className="luxury-wishlist-copy">
                      <span>{product.brand?.name || 'HuyPerfume'}</span>
                      <h2><Link to={`/products/${product.id}`}>{product.name}</Link></h2>
                      <p>{product.description || product.scentNotes || 'Mùi hương được tuyển chọn cho phong cách riêng.'}</p>
                      <div className="luxury-price-row">
                        <strong className="luxury-price">{formatVnCurrency(price)}</strong>
                        {originalPrice > 0 && <del>{formatVnCurrency(originalPrice)}</del>}
                      </div>
                    </div>
                    <div className="luxury-wishlist-actions">
                      <button type="button" className="btn luxury-primary-btn" disabled={product.stock <= 0} onClick={() => handleAddToCart(Number(product.id))}>
                        {product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                      <button type="button" className="btn luxury-secondary-btn" onClick={() => handleToggleWishlist(Number(product.id))}>Bỏ lưu</button>
                      <button type="button" className="btn luxury-link-btn" onClick={() => navigate(`/products/${product.id}`)}>Xem chi tiết</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
