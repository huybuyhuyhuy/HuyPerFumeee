import { Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/Product/ProductCard';
import { cartService } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../store/ToastContext';
import { useWishlist } from '../store/WishlistContext';

export function WishlistPage() {
  const { items } = useWishlist();
  const { isLoggedIn } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn) {
      pushToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'info');
      navigate('/login');
      return;
    }

    try {
      await cartService.addItem(productId, 1);
      pushToast('Đã thêm vào giỏ hàng.', 'success');
    } catch (err: any) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
    }
  };

  return (
    <div className="container luxury-page">
      <div className="d-flex justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="text-uppercase luxury-muted small mb-1">Saved for later</p>
          <h3 className="mb-0">Danh sách yêu thích</h3>
        </div>
        <Link to="/products" className="btn btn-outline-dark">
          Tiếp tục khám phá
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="luxury-surface p-5 text-center">
          <h5 className="mb-2">Chưa có sản phẩm yêu thích</h5>
          <p className="luxury-muted mb-4">Nhấn biểu tượng trái tim trên sản phẩm để lưu lại những mùi hương đáng nhớ.</p>
          <Link to="/products" className="btn btn-dark">
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
