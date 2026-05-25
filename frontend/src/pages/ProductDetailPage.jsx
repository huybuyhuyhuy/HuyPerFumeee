import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';
import { ProductGallery } from '../components/Product/ProductGallery';
import { ProductVariants } from '../components/Product/ProductVariants';
import { ProductDetailSkeleton } from '../components/Feedback/ProductSkeletons';
import { EmptyState } from '../components/Feedback/EmptyState';
import { useToast } from '../store/ToastContext';
import { useWishlist } from '../store/WishlistContext';
import { formatVnCurrency, clampPrice } from '../utils/formatters';
import { buildProductVariants } from '../utils/productVariants';

const ProductDiscoveryTabs = lazy(() => import('../components/Product/ProductDiscoveryTabs').then((module) => ({ default: module.ProductDiscoveryTabs })));
const RelatedProductRail = lazy(() => import('../components/Product/RelatedProductRail').then((module) => ({ default: module.RelatedProductRail })));

function getProductPrice(product, variant) {
  const salePrice = clampPrice(variant?.price ?? product?.discountPrice);
  const originalPrice = clampPrice(variant?.originalPrice ?? product?.originalPrice) || clampPrice(product?.price);
  const fallbackOriginal = originalPrice > 0 ? originalPrice : salePrice;
  const finalPrice = salePrice > 0 ? salePrice : fallbackOriginal;
  const safeOriginal = fallbackOriginal >= finalPrice ? fallbackOriginal : finalPrice;
  const discountPercent = finalPrice > 0 && safeOriginal > finalPrice ? Math.round(((safeOriginal - finalPrice) / safeOriginal) * 100) : clampPrice(product?.discountPercent);
  return { salePrice: finalPrice, originalPrice: safeOriginal, discountPercent };
}

function pickRelated(products, current, count = 4) {
  return (products || []).filter((item) => item.id !== current?.id).slice(0, count);
}

function SectionFallback() {
  return (
    <div className="luxury-surface p-4 mt-4">
      <div className="luxury-skeleton luxury-skeleton-detail-copy w-50 mb-3" />
      <div className="luxury-skeleton luxury-skeleton-detail-copy w-75 mb-2" />
      <div className="luxury-skeleton luxury-skeleton-detail-copy w-100" />
    </div>
  );
}

function ProductErrorState({ message, onRetry }) {
  return (
    <div className="container luxury-page">
      <EmptyState
        eyebrow="Product unavailable"
        title="Sản phẩm không tồn tại hoặc đã bị xóa"
        description={message || 'Vui lòng thử lại sau hoặc quay về trang danh mục để tiếp tục khám phá.'}
        action={
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button type="button" className="btn btn-dark luxury-primary-btn" onClick={onRetry}>Thử lại</button>
            <a href="/products" className="btn btn-outline-dark">Khám phá sản phẩm</a>
          </div>
        }
      />
    </div>
  );
}

function ProductStorytelling({ product }) {
  const notes = [product?.brand?.name || 'Luxury house', product?.gender || 'Signature wear', product?.scentNotes || 'Refined scent profile'];
  return (
    <section className="luxury-surface product-storytelling-section product-fade-in is-visible">
      <div className="storytelling-grid">
        <div className="storytelling-panel storytelling-panel-large">
          <p className="story-eyebrow">The scent story</p>
          <h2 className="story-title">Một mùi hương có chiều sâu, dễ nhớ và đủ đắt giá để muốn sở hữu.</h2>
          <p className="story-copy">Thiết kế cho trải nghiệm trang trọng, bền mùi và tự tin trong nhiều khoảnh khắc sử dụng.</p>
          <div className="story-atmosphere">
            {notes.map((note) => (
              <div key={note}><strong>Signal</strong><span>{note}</span></div>
            ))}
          </div>
        </div>
        <div className="storytelling-panel">
          <p className="story-eyebrow">Why it converts</p>
          <h3 className="story-subtitle">Đủ sang để gây chú ý, đủ dễ dùng để trở thành lựa chọn hằng ngày.</h3>
          <div className="scent-pyramid">
            <div><strong>Top note</strong><span>Ấn tượng mở đầu sáng, sạch và tinh tế.</span></div>
            <div><strong>Heart note</strong><span>Trung tâm mềm mại, cân bằng và cuốn hút.</span></div>
            <div><strong>Dry down</strong><span>Hậu hương ấm, mượt và sang trọng.</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeVariant, setActiveVariant] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
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
    Promise.all([
      productService.getProduct(numericId),
      productService.getRelatedProducts(numericId, { limit: 8 }).catch(() => []),
      productService.getProductReviews(numericId, { page: 1, size: 5 }).catch(() => ({ content: [] })),
      productService.getProducts({ page: 1, size: 12 }).catch(() => ({ content: [] })),
    ])
      .then(([detail, related, reviewPage, fallbackList]) => {
        setProduct(detail || null);
        setRelatedProducts(related?.length ? related : pickRelated(fallbackList?.content || [], detail, 8));
        setReviews(reviewPage?.content || []);
      })
      .catch((err) => { const msg = err?.response?.data?.message || err?.message || 'Không tải được sản phẩm.'; setError(msg); setProduct(null); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id]);

  const variants = useMemo(() => buildProductVariants(product), [product]);
  useEffect(() => { if (!product) return; setActiveVariant((current) => (current && variants.some((variant) => variant.id === current.id) ? current : variants[0] || null)); }, [product, variants]);

  const price = useMemo(() => getProductPrice(product, activeVariant), [product, activeVariant]);
  const stock = useMemo(() => activeVariant?.stock ?? product?.stock ?? 0, [activeVariant, product]);
  const saved = product ? isWishlisted(product.id) : false;
  const invalidPrice = price.salePrice <= 0;
  const invalidVariant = !activeVariant;
  const invalidStock = !Number.isFinite(stock) || stock < 0;
  const canBuy = !invalidPrice && !invalidStock && stock > 0 && (activeVariant?.isAvailable ?? true);

  useEffect(() => { if (!product) return; setQuantity((current) => Math.min(Math.max(1, current), Math.max(stock, 1))); }, [product, stock]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) { pushToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'info'); window.setTimeout(() => navigate('/login'), 250); return; }
    setActionLoading('cart');
    try { await cartService.addItem(Number(id), quantity, product?.hasVariants ? activeVariant?.id : null); pushToast('Đã thêm vào giỏ hàng.', 'success'); } catch (err) { pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error'); } finally { setActionLoading(null); }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) { pushToast('Vui lòng đăng nhập để mua ngay.', 'info'); window.setTimeout(() => navigate('/login'), 250); return; }
    setActionLoading('buy');
    try { await cartService.addItem(Number(id), quantity, product?.hasVariants ? activeVariant?.id : null); navigate('/checkout'); } catch (err) { pushToast(err?.message || 'Không thể mua ngay lúc này.', 'error'); } finally { setActionLoading(null); }
  };

  const handleToggleWishlist = () => { const nextSaved = toggleWishlist(product); pushToast(nextSaved ? 'Đã thêm vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.', nextSaved ? 'success' : 'info'); };

  if (loading) return <ProductDetailSkeleton />;
  if (error) return <ProductErrorState message={error} onRetry={load} />;
  if (!product) return <ProductErrorState onRetry={load} />;

  const stockState = invalidStock ? 'Dữ liệu tồn kho không hợp lệ' : canBuy ? `${stock} sản phẩm có sẵn` : stock === 0 ? 'Tạm hết hàng' : 'Sắp về hàng';
  const displayImage = activeVariant?.image || product.image;
  const sameBrand = relatedProducts.filter((item) => item.brand?.id && product.brand?.id && item.brand.id === product.brand.id).slice(0, 4);
  const sameScent = relatedProducts.filter((item) => item.scentNotes && product.scentNotes && item.scentNotes === product.scentNotes).slice(0, 4);

  return (
    <div className="luxury-page product-detail-page">
      <div className="container-xl product-detail-shell">
        <div className="row g-4 g-xl-5 align-items-start">
          <div className="col-lg-6 product-detail-media-col"><ProductGallery product={{ ...product, image: displayImage }} /></div>
          <div className="col-lg-6 product-detail-info-col">
            <div className="luxury-surface product-detail-panel product-sticky-surface">
              <nav aria-label="breadcrumb" className="mb-4"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">Trang chủ</a></li>{product.category && <li className="breadcrumb-item">{product.category.name}</li>}<li className="breadcrumb-item active">{product.name}</li></ol></nav>
              <div className="product-detail-meta"><span className="luxury-badge">{product.badgeLabel || 'Luxury fragrance'}</span>{product.brand && <span className="product-detail-brand">{product.brand.name}</span>}{product.gender && <span className="product-detail-brand">{product.gender}</span>}</div>
              <h1 className="product-detail-title mt-3 mb-3">{product.name}</h1>
              <p className="product-detail-luxury-copy mb-4">{product.description || 'Hương thơm được tuyển chọn để tạo nên dấu ấn sang trọng, tinh tế và cuốn hút.'}</p>
              <div className="product-detail-score mb-4"><div className="product-rating-stars" aria-label={`Đánh giá ${product.rating || 0} trên 5`}>{'★'.repeat(Math.max(0, Math.round(product.rating || 0)))}{'☆'.repeat(Math.max(0, 5 - Math.round(product.rating || 0)))}</div><span>{product.reviewCount || 0} đánh giá</span><span>•</span><span>{product.soldCount || 0} đã bán</span></div>
              <div className="product-detail-price-block mb-4"><span className="product-detail-price">{formatVnCurrency(price.salePrice)}</span>{price.originalPrice > price.salePrice && <><span className="product-detail-compare">{formatVnCurrency(price.originalPrice)}</span><span className="product-detail-discount-badge">-{price.discountPercent}%</span></>}</div>
              <ProductVariants variants={variants} activeVariantId={activeVariant?.id} onChange={(variant) => { setActiveVariant(variant); setQuantity(1); }} />
              <div className="product-conversion-badges mt-4"><div className="conversion-badge"><strong>Authentic</strong><span>Cam kết chính hãng 100%</span></div><div className="conversion-badge"><strong>Packaging</strong><span>Đóng gói premium, an toàn</span></div><div className="conversion-badge"><strong>Shipping</strong><span>Giao nhanh toàn quốc</span></div><div className="conversion-badge"><strong>Secure payment</strong><span>Thanh toán an toàn & linh hoạt</span></div></div>
              <div className="product-detail-facts mt-4">{product.brand ? <div><strong>Thương hiệu</strong><span>{product.brand.name}</span></div> : null}{activeVariant?.size || product.volumeMl ? <div><strong>Dung tích</strong><span>{activeVariant?.size || `${product.volumeMl}ml`}</span></div> : null}{product.gender ? <div><strong>Giới tính</strong><span>{product.gender}</span></div> : null}{product.concentration ? <div><strong>Nồng độ</strong><span>{product.concentration}</span></div> : null}{product.scentNotes ? <div><strong>Nhóm hương</strong><span>{product.scentNotes}</span></div> : null}{product.category ? <div><strong>Danh mục</strong><span>{product.category.name}</span></div> : null}<div><strong>Tồn kho</strong><span className={canBuy ? 'text-success' : 'text-danger'}>{stockState}</span></div><div><strong>Tình trạng</strong><span>{activeVariant?.isAvailable ? 'Có sẵn' : invalidVariant ? 'Thiếu biến thể' : 'Không khả dụng'}</span></div></div>
              {invalidPrice && <div className="luxury-surface mt-4 p-3"><strong className="d-block mb-1">Giá đang được cập nhật</strong><span className="luxury-muted">Hiện chưa có mức giá hợp lệ cho sản phẩm này.</span></div>}
              {!product.image && <div className="luxury-surface mt-4 p-3"><strong className="d-block mb-1">Chưa có ảnh sản phẩm</strong><span className="luxury-muted">Gallery sẽ hiển thị ngay khi ảnh được bổ sung.</span></div>}
              <div className="product-detail-actions mt-4"><div className="input-group quantity-group"><button className="btn btn-outline-secondary" onClick={() => quantity > 1 && setQuantity(quantity - 1)} disabled={!canBuy}>-</button><input type="text" className="form-control text-center" value={quantity} readOnly disabled={!canBuy} /><button className="btn btn-outline-secondary" onClick={() => quantity < stock && setQuantity(quantity + 1)} disabled={!canBuy}>+</button></div><button className="btn btn-dark btn-lg luxury-primary-btn action-btn" disabled={!canBuy || actionLoading !== null} onClick={handleAddToCart}>{actionLoading === 'cart' ? 'Đang thêm…' : stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</button><button className="btn btn-outline-dark btn-lg action-btn action-btn-secondary" disabled={!canBuy || actionLoading !== null} onClick={handleBuyNow}>{actionLoading === 'buy' ? 'Đang xử lý…' : 'Mua ngay'}</button><button type="button" className={`btn btn-outline-dark btn-lg action-btn action-btn-wishlist ${saved ? 'active' : ''}`} onClick={handleToggleWishlist}>{saved ? '♥ Đã lưu' : '♡ Yêu thích'}</button></div>
              <div className="product-trust-strip mt-4"><div><strong>Free shipping</strong><span>Đơn đủ điều kiện</span></div><div><strong>Secure checkout</strong><span>Bảo mật thanh toán</span></div><div><strong>Luxury gift wrap</strong><span>Tặng hộp quà premium</span></div><div><strong>Best seller</strong><span>Top lựa chọn khách hàng</span></div></div>
            </div>
            <ProductStorytelling product={product} />
            <Suspense fallback={<SectionFallback />}>
              <ProductDiscoveryTabs product={product} reviews={reviews} />
            </Suspense>
            <Suspense fallback={<SectionFallback />}>
              <RelatedProductRail title="Related products" products={relatedProducts} />
            </Suspense>
            {sameBrand.length > 0 && (
              <Suspense fallback={<SectionFallback />}>
                <RelatedProductRail title="Same brand" products={sameBrand} />
              </Suspense>
            )}
            {sameScent.length > 0 && (
              <Suspense fallback={<SectionFallback />}>
                <RelatedProductRail title="Similar scent" products={sameScent} />
              </Suspense>
            )}
            <div className="product-mobile-sticky-cta" role="complementary" aria-label="Thanh hành động mua hàng cố định"><div className="product-mobile-price"><span>{formatVnCurrency(price.salePrice)}</span><small>{stockState}</small></div><div className="product-mobile-actions"><button className="btn btn-outline-dark" disabled={!canBuy || actionLoading !== null} onClick={handleToggleWishlist} aria-label={saved ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}>{saved ? '♥' : '♡'}</button><button className="btn btn-dark luxury-primary-btn" disabled={!canBuy || actionLoading !== null} onClick={handleBuyNow}>Mua ngay</button><button className="btn btn-dark luxury-primary-btn" disabled={!canBuy || actionLoading !== null} onClick={handleAddToCart}>{actionLoading === 'cart' ? '…' : 'Giỏ hàng'}</button></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
