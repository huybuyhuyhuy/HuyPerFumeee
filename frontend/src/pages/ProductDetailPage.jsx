import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';
import { ProductGallery } from '../components/Product/ProductGallery';
import { ProductDetailSkeleton } from '../components/Feedback/ProductSkeletons';
import { useToast } from '../store/ToastContext';
import { useWishlist } from '../store/WishlistContext';

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { isLoggedIn } = useAuth();
  const { pushToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const load = () => {
    const numericId = Number(id);
    if (!id || Number.isNaN(numericId)) {
      setProduct(null);
      setError('ID sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    productService
      .getProduct(numericId)
      .then((p) => setProduct(p || null))
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Không tải được sản phẩm.';
        setError(msg);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      pushToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'info');
      window.setTimeout(() => navigate('/login'), 250);
      return;
    }

    try {
      await cartService.addItem(Number(id), quantity);
      pushToast('Đã thêm vào giỏ hàng.', 'success');
    } catch (err) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <p className="text-danger mb-3">{error}</p>
        <button className="btn btn-outline-dark" onClick={load}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!product) return <div className="text-center py-5">Không tìm thấy sản phẩm</div>;

  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const saved = isWishlisted(product.id);

  return (
    <div className="container luxury-page">
      <div className="row g-4 align-items-start">
        <div className="col-lg-6">
          <ProductGallery product={product} />
        </div>
        <div className="col-lg-6">
          <div className="luxury-surface p-4 p-lg-5">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item">
                  <a href="/">Trang chủ</a>
                </li>
                {product.category && <li className="breadcrumb-item">{product.category.name}</li>}
                <li className="breadcrumb-item active">{product.name}</li>
              </ol>
            </nav>
            <p className="text-uppercase luxury-muted small mb-2">Fragrance detail</p>
            <h2 className="mb-2">{product.name}</h2>
            {product.brand && <p className="luxury-muted mb-3">Thương hiệu: {product.brand.name}</p>}
            <div className="my-3">
              {product.discountPrice > 0 ? (
                <>
                  <span className="fs-2 fw-bold" style={{ color: 'var(--luxury-gold-dark)' }}>
                    {effectivePrice.toLocaleString('vi-VN')}₫
                  </span>
                  <span className="luxury-muted text-decoration-line-through ms-2 fs-5">
                    {product.price.toLocaleString('vi-VN')}₫
                  </span>
                </>
              ) : (
                <span className="fs-2 fw-bold">{effectivePrice.toLocaleString('vi-VN')}₫</span>
              )}
            </div>
            {product.scentNotes && (
              <div className="mb-3">
                <strong>Nhóm hương:</strong>
                <p className="luxury-muted mb-0">{product.scentNotes}</p>
              </div>
            )}
            {product.description && (
              <div className="mb-3">
                <strong>Mô tả:</strong>
                <p className="luxury-muted mb-0">{product.description}</p>
              </div>
            )}
            <div className="mb-4">
              <strong>Tồn kho:</strong>{' '}
              {product.stock > 0 ? (
                <span className="text-success">{product.stock} sản phẩm</span>
              ) : (
                <span className="text-danger">Hết hàng</span>
              )}
            </div>
            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3 flex-wrap">
              <div className="input-group" style={{ width: '140px' }}>
                <button className="btn btn-outline-secondary" onClick={() => quantity > 1 && setQuantity(quantity - 1)}>-</button>
                <input type="text" className="form-control text-center" value={quantity} readOnly />
                <button className="btn btn-outline-secondary" onClick={() => quantity < product.stock && setQuantity(quantity + 1)}>+</button>
              </div>
              <button className="btn btn-dark btn-lg" disabled={product.stock === 0} onClick={handleAddToCart}>
                Thêm vào giỏ hàng
              </button>
              <button
                type="button"
                className={`btn btn-outline-dark btn-lg wishlist-detail-toggle ${saved ? 'active' : ''}`}
                onClick={() => {
                  const nextSaved = toggleWishlist(product);
                  pushToast(nextSaved ? 'Đã thêm vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.', nextSaved ? 'success' : 'info');
                }}
              >
                {saved ? '♥ Đã lưu' : '♡ Yêu thích'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
