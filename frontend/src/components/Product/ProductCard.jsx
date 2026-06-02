import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../store/ToastContext';
import { resolveProductImage } from '../../utils/image';
import { getCurrentPath, savePendingCustomerAction } from '../../utils/pendingCustomerAction';

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getProductName(product) {
  return product?.name || product?.productName || 'Nước hoa HuyPerfume';
}

function getProductBrand(product) {
  if (typeof product?.brand === 'string') return product.brand;
  return product?.brand?.name || product?.brandName || 'HuyPerfume';
}

function getEffectivePrice(product) {
  const salePrice = asNumber(product?.salePrice);
  const discountPrice = asNumber(product?.discountPrice ?? product?.discount_price);
  if (discountPrice > 0) return discountPrice;
  if (salePrice > 0) return salePrice;
  return asNumber(product?.price);
}

function getOriginalPrice(product) {
  return asNumber(product?.originalPrice || product?.price);
}

function getDiscountPercent(product, effectivePrice, originalPrice) {
  const explicit = asNumber(product?.discountPercent);
  if (explicit > 0) return explicit;
  if (originalPrice > effectivePrice && originalPrice > 0) {
    return Math.round(((originalPrice - effectivePrice) / originalPrice) * 100);
  }
  return 0;
}

function getProductImage(product) {
  const rawImage = product?.image || product?.imageUrl || product?.thumbnail || product?.images?.[0];
  return resolveProductImage(rawImage);
}

function getVolumeLabel(product) {
  if (product?.volume) return product.volume;
  const volumeMl = asNumber(product?.volumeMl ?? product?.volume_ml);
  return volumeMl > 0 ? `${volumeMl}ml` : '';
}

function getRating(product) {
  const rating = asNumber(product?.rating, 0);
  return rating > 0 ? Math.min(rating, 5).toFixed(1) : '4.8';
}

function getReviewCount(product) {
  return asNumber(product?.reviewCount ?? product?.reviewsCount ?? product?.totalReviews);
}

function getSoldCount(product) {
  return asNumber(product?.soldCount ?? product?.sold ?? product?.totalSold);
}

function getBadgeLabel(product, discountPercent, soldCount) {
  const rawBadge = String(product?.badgeLabel || product?.badge || '').toLowerCase();
  if (rawBadge.includes('best')) return 'Bán chạy';
  if (rawBadge.includes('new')) return 'Mới';
  if (rawBadge.includes('sale') || rawBadge.includes('ưu')) return 'Giảm giá';
  if (discountPercent > 0) return 'Giảm giá';
  if (product?.isNew) return 'Mới';
  if (soldCount > 0 || asNumber(product?.stock) > 10) return 'Bán chạy';
  if (product?.isDecant) return 'Size nhỏ';
  return '';
}

function hasVariantChoice(product) {
  return Boolean(
    product?.hasVariants ||
    Number(product?.variantCount ?? product?.variant_count ?? 0) > 1 ||
    (Array.isArray(product?.variants) && product.variants.length > 1) ||
    (Array.isArray(product?.decantOptions) && product.decantOptions.length > 0)
  );
}

export function ProductCard({ product, onAddToCart, onToggleWishlist, onAddWishlistToCart, wishlisted = false }) {
  const [cartState, setCartState] = useState('idle');
  const { isLoggedIn } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (cartState !== 'added') return undefined;
    const timer = window.setTimeout(() => setCartState('idle'), 1250);
    return () => window.clearTimeout(timer);
  }, [cartState]);

  if (!product) return null;
  const effectivePrice = getEffectivePrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product, effectivePrice, originalPrice);
  const image = getProductImage(product);
  const name = getProductName(product);
  const brand = getProductBrand(product);
  const volume = getVolumeLabel(product);
  const rating = getRating(product);
  const reviewCount = getReviewCount(product);
  const soldCount = getSoldCount(product);
  const badgeLabel = getBadgeLabel(product, discountPercent, soldCount);
  const isHidden = product.status === false;
  const needsSelection = hasVariantChoice(product);
  const isOutOfStock = isHidden || asNumber(product.stock ?? product.stockQuantity, 0) <= 0;

  const handleCartClick = async () => {
    if (isOutOfStock || cartState === 'adding') return;
    if (!isLoggedIn) {
      const returnTo = getCurrentPath(location);
      if (!needsSelection) {
        savePendingCustomerAction({
          type: 'cart',
          productId: Number(product.id),
          quantity: 1,
          variantId: product.variantId ?? null,
          itemType: 'FULL_BOTTLE',
          returnTo,
        });
      }
      pushToast(
        needsSelection
          ? 'Vui lòng đăng nhập để chọn phiên bản và thêm vào giỏ hàng.'
          : 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
        'info'
      );
      navigate('/login', { state: { from: returnTo } });
      return;
    }

    setCartState('adding');
    try {
      const result = await onAddToCart?.(product);
      if (result?.pendingSelection) {
        setCartState('idle');
        return;
      }
      setCartState('added');
    } catch {
      setCartState('idle');
    }
  };

  return (
    <div className="col luxury-listing-card-col scroll-reveal-item">
      <article className="luxury-listing-card">
        <Link to={`/products/${product.id}`} className="luxury-listing-card-media" aria-label={`Xem chi tiết ${name}`}>
          <img src={image} alt={name} loading="lazy" decoding="async" />
          <div className="luxury-listing-card-badges">
            {badgeLabel && <span className="luxury-card-badge">{badgeLabel}</span>}
            {isHidden && <span className="luxury-card-badge muted">Ẩn</span>}
          </div>
          {discountPercent > 0 && <span className="luxury-discount-badge">-{discountPercent}%</span>}
        </Link>

        <div className="luxury-listing-card-body">
          <div>
            <p className="luxury-card-brand">{brand}</p>
            <h3 className="luxury-card-title">
              <Link to={`/products/${product.id}`} className="text-decoration-none text-reset">
                {name}
              </Link>
            </h3>
            <div className="luxury-card-meta">
              {volume && <span>{volume}</span>}
              <span className="luxury-card-rating" aria-label={`Đánh giá ${rating} trên 5`}>
                ★ {rating}
              </span>
              {reviewCount > 0 && <span>{reviewCount} đánh giá</span>}
              {soldCount > 0 && <span>Đã bán {soldCount}</span>}
            </div>
          </div>

          <div className="luxury-card-price-row">
            <span className="luxury-card-price">{formatPrice(effectivePrice)}</span>
            {discountPercent > 0 && <del>{formatPrice(originalPrice)}</del>}
          </div>

          <div className="luxury-card-actions">
            <Link to={`/products/${product.id}`} className="luxury-card-detail-btn">
              Xem chi tiết
            </Link>
            <button
              type="button"
              className={`luxury-card-cart-btn add-cart-feedback-btn ${cartState === 'added' ? 'is-added' : ''}`}
              onClick={handleCartClick}
              disabled={isOutOfStock || cartState === 'adding'}
            >
              {isOutOfStock ? 'Tạm hết hàng' : cartState === 'adding' ? 'Đang thêm...' : cartState === 'added' ? 'Đã thêm' : needsSelection ? 'Chọn phiên bản' : 'Thêm vào giỏ'}
            </button>
          </div>

          {(onToggleWishlist || onAddWishlistToCart) && (
            <div className="luxury-card-extra-actions">
              {onToggleWishlist && (
                <button type="button" className="luxury-card-soft-btn" onClick={() => onToggleWishlist(product)}>
                  {wishlisted ? 'Đã lưu' : 'Yêu thích'}
                </button>
              )}
              {onAddWishlistToCart && (
                <button type="button" className="luxury-card-soft-btn" onClick={() => onAddWishlistToCart(product.id)}>
                  Thêm vào giỏ
                </button>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
