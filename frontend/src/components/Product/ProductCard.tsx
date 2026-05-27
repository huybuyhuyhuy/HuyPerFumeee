import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../store/ToastContext';
import { useWishlist } from '../../store/WishlistContext';
import { resolveProductImage } from '../../utils/image';
import { formatVnCurrency } from '../../utils/formatters';
import { getCurrentPath, savePendingCustomerAction } from '../../utils/pendingCustomerAction';

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart?: (productId: number) => void | Promise<void>;
}) {
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle');
  const safeProduct = product || ({} as Product);
  const salePrice = safeProduct.discountPrice > 0 ? safeProduct.discountPrice : safeProduct.price;
  const originalPrice = safeProduct.discountPrice > 0 && safeProduct.price > safeProduct.discountPrice ? safeProduct.price : 0;
  const brandName = safeProduct.brand?.name || 'HuyPerfume tuyển chọn';
  const description = String(safeProduct.description || safeProduct.scentNotes || 'Mùi hương được tuyển chọn cho phong cách riêng.').replace(/\|/g, ' · ');
  const badgeLabel = safeProduct.isDecant ? 'Size nhỏ' : safeProduct.discountPrice > 0 ? 'Ưu đãi' : safeProduct.stock > 10 ? 'Bán chạy' : 'Cao cấp';
  const { pushToast } = useToast();
  const { isLoggedIn } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const productId = Number(safeProduct.id);
  const hasValidId = Number.isInteger(productId) && productId > 0;
  const saved = isWishlisted(safeProduct.id);
  const quickViewLabel = safeProduct.stock > 0 ? 'Xem nhanh' : 'Hết hàng';
  const detailPath = hasValidId ? `/products/${productId}` : '/products';
  const canAddToCart = hasValidId && safeProduct.stock > 0;

  useEffect(() => {
    if (cartState !== 'added') return undefined;
    const timer = window.setTimeout(() => setCartState('idle'), 1250);
    return () => window.clearTimeout(timer);
  }, [cartState]);

  const handleWishlistToggle = () => {
    if (!isLoggedIn) {
      const returnTo = getCurrentPath(location);
      savePendingCustomerAction({ type: 'wishlist', product: safeProduct, returnTo });
      pushToast('Vui lòng đăng nhập để thêm sản phẩm vào yêu thích.', 'info');
      navigate('/login', { state: { from: returnTo } });
      return;
    }

    const nextSaved = toggleWishlist(safeProduct);
    pushToast(nextSaved ? 'Đã thêm vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.', nextSaved ? 'success' : 'info');
  };

  const handleCartClick = async () => {
    if (!canAddToCart || cartState === 'adding') return;
    if (!isLoggedIn) {
      const returnTo = getCurrentPath(location);
      savePendingCustomerAction({ type: 'cart', productId, quantity: 1, returnTo });
      pushToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'info');
      navigate('/login', { state: { from: returnTo } });
      return;
    }

    setCartState('adding');
    try {
      await onAddToCart?.(productId);
      setCartState('added');
    } catch {
      setCartState('idle');
    }
  };

  return (
    <div className="col scroll-reveal-item">
      <article className="luxury-featured-card h-100 luxury-product-card">
        <span className="luxury-product-badge">{badgeLabel}</span>
        <button
          type="button"
          className={`wishlist-toggle ${saved ? 'active' : ''}`}
          aria-label={saved ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
          onClick={handleWishlistToggle}
        >
          {saved ? '♥' : '♡'}
        </button>
        <Link to={detailPath} className="luxury-featured-media text-decoration-none">
          <img
            src={resolveProductImage(safeProduct.image)}
            alt={safeProduct.name}
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div className="luxury-featured-body d-flex flex-column">
          <p className="luxury-product-brand mb-2">{brandName}</p>
          <h3 className="luxury-product-name mb-2">
            <Link to={detailPath} className="text-decoration-none text-reset">
              {safeProduct.name}
            </Link>
          </h3>
          <p className="luxury-product-desc mb-3">{description}</p>
          <div className="luxury-price-row mb-3">
            <span className="luxury-price">{formatVnCurrency(salePrice)}</span>
            {originalPrice > salePrice && <del>{formatVnCurrency(originalPrice)}</del>}
          </div>
          <div className="luxury-card-meta mb-3">
            <span>{product.rating ? `${product.rating.toFixed(1)}★` : '4.9★'}</span>
            <span>•</span>
            <span>{product.soldCount || 0} đã bán</span>
          </div>
          <div className="luxury-card-actions mt-auto d-flex gap-2">
            <Link to={detailPath} className="btn luxury-secondary-btn btn-sm flex-fill">
              {quickViewLabel}
            </Link>
            <button
              type="button"
              className={`btn luxury-primary-btn btn-sm flex-fill add-cart-feedback-btn ${cartState === 'added' ? 'is-added' : ''}`}
              onClick={handleCartClick}
              disabled={!canAddToCart || cartState === 'adding'}
            >
              {safeProduct.stock <= 0 ? 'Hết hàng' : cartState === 'adding' ? 'Đang thêm...' : cartState === 'added' ? 'Đã thêm' : 'Thêm vào giỏ'}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
