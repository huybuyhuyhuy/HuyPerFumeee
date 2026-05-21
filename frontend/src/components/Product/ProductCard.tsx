import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useToast } from '../../store/ToastContext';
import { useWishlist } from '../../store/WishlistContext';
import { resolveProductImage } from '../../utils/image';

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart?: (productId: number) => void | Promise<void>;
}) {
  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const { pushToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const saved = isWishlisted(product.id);

  const handleWishlistToggle = () => {
    const nextSaved = toggleWishlist(product);
    pushToast(nextSaved ? 'Đã thêm vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.', nextSaved ? 'success' : 'info');
  };

  return (
    <div className="col">
      <div className="luxury-featured-card h-100">
        <span className="luxury-product-badge">{product.isDecant ? 'Mini size' : product.stock > 10 ? 'Best Seller' : 'Luxury'}</span>
        <button
          type="button"
          className={`wishlist-toggle ${saved ? 'active' : ''}`}
          aria-label={saved ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
          onClick={handleWishlistToggle}
        >
          {saved ? '♥' : '♡'}
        </button>
        <Link to={`/products/${product.id}`} className="luxury-featured-media text-decoration-none">
          <img
            src={resolveProductImage(product.image)}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div className="luxury-featured-body d-flex flex-column">
          <h6 className="luxury-product-name mb-1">{product.name}</h6>
          <p className="luxury-product-brand mb-2">{product.brand?.name || 'HuyPerfume Select'}</p>
          <p className="luxury-product-desc mb-3">{product.description}</p>
          <div className="luxury-price-row mb-3">
            <span className="luxury-price">{price.toLocaleString('vi-VN')}₫</span>
            {product.discountPrice > 0 && <del>{product.price.toLocaleString('vi-VN')}₫</del>}
          </div>
          <div className="mt-auto d-flex gap-2">
            <Link to={`/products/${product.id}`} className="btn luxury-secondary-btn btn-sm flex-fill">
              Chi tiết
            </Link>
            <button
              type="button"
              className="btn luxury-primary-btn btn-sm flex-fill"
              onClick={() => onAddToCart?.(product.id)}
              disabled={product.stock <= 0}
            >
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
