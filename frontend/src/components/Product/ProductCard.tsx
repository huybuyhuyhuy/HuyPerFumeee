import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useToast } from '../../store/ToastContext';
import { useWishlist } from '../../store/WishlistContext';
import { resolveProductImage } from '../../utils/image';
import { formatVnCurrency } from '../../utils/formatters';

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart?: (productId: number) => void | Promise<void>;
}) {
  const safeProduct = product || ({} as Product);
  const salePrice = safeProduct.discountPrice > 0 ? safeProduct.discountPrice : safeProduct.price;
  const originalPrice = safeProduct.discountPrice > 0 && safeProduct.price > safeProduct.discountPrice ? safeProduct.price : 0;
  const brandName = safeProduct.brand?.name || 'HuyPerfume tuyển chọn';
  const description = safeProduct.description || safeProduct.scentNotes || 'Mùi hương được tuyển chọn cho phong cách riêng.';
  const badgeLabel = safeProduct.isDecant ? 'Mini size' : safeProduct.discountPrice > 0 ? 'Ưu đãi' : safeProduct.stock > 10 ? 'Bán chạy' : 'Cao cấp';
  const { pushToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const productId = Number(safeProduct.id);
  const hasValidId = Number.isInteger(productId) && productId > 0;
  const saved = isWishlisted(safeProduct.id);
  const quickViewLabel = safeProduct.stock > 0 ? 'Quick view' : 'Hết hàng';
  const detailPath = hasValidId ? `/products/${productId}` : '/products';

  const handleWishlistToggle = () => {
    const nextSaved = toggleWishlist(safeProduct);
    pushToast(nextSaved ? 'Đã thêm vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.', nextSaved ? 'success' : 'info');
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
            <span>{product.soldCount || 0} sold</span>
          </div>
          <div className="luxury-card-actions mt-auto d-flex gap-2">
            <Link to={detailPath} className="btn luxury-secondary-btn btn-sm flex-fill">
              {quickViewLabel}
            </Link>
            <button
              type="button"
              className="btn luxury-primary-btn btn-sm flex-fill"
              onClick={() => onAddToCart?.(productId)}
              disabled={safeProduct.stock <= 0}
            >
              {safeProduct.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
