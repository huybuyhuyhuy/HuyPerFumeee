import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { cartService } from '../services/cartService.js';
import { useAuth } from '../hooks/useAuth.js';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductGridSkeleton } from '../components/Feedback/ProductSkeletons';
import type { Product } from '../types';
import { useToast } from '../store/ToastContext';
import { resolveProductImage } from '../utils/image';

const collectionCards = [
  { title: 'Hương gỗ trầm ấm', desc: 'Ấm áp, bản lĩnh và sang trọng cho những khoảnh khắc cần chiều sâu.', image: '/assets/images/4.png' },
  { title: 'Hương hoa thanh lịch', desc: 'Mềm mại, tinh tế và nữ tính theo cách hiện đại, nhẹ nhàng.', image: '/assets/images/5.png' },
  { title: 'Hương tươi mát mỗi ngày', desc: 'Sạch, sáng và dễ dùng - hoàn hảo cho nhịp sống năng động.', image: '/assets/images/6.png' },
];

const categoryCards = [
  { name: 'Nước hoa nam', cat: 1, img: '/assets/images/men-perfume-banner.png' },
  { name: 'Nước hoa nữ', cat: 2, img: '/assets/images/women-perfume-banner.png' },
  { name: 'Unisex', cat: 3, img: '/assets/images/unisex-perfume-banner.png' },
  { name: 'Luxury', cat: 0, img: '/assets/images/7.png' },
  { name: 'Mini size', cat: 0, img: '/assets/images/3.png' },
];

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  const { pushToast } = useToast();

  useEffect(() => {
    productService.getProducts({ page: 1, size: 8 })
      .then(data => setProducts(Array.isArray(data?.content) ? data.content : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn) {
      pushToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'info');
      return;
    }

    try {
      await cartService.addItem(productId, 1);
      pushToast('Đã thêm vào giỏ hàng.', 'success');
    } catch (err: any) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
    }
  };

  const featuredProducts = products;

  return (
    <>
      <section className="luxury-hero-section">
        <div className="container">
          <div className="luxury-hero-shell">
            <div className="row align-items-center g-4 g-lg-5">
              <div className="col-lg-6 order-2 order-lg-1">
                <span className="luxury-badge mb-3">Luxury fragrance experience</span>
                <h1 className="luxury-hero-title mb-3">Hương thơm tạo nên phong cách</h1>
                <p className="luxury-hero-desc mb-4">
                  Khám phá những mùi hương tinh tế, cuốn hút và phù hợp với cá tính riêng của bạn.
                </p>
                <div className="d-flex flex-wrap gap-3 mb-4">
                  <Link to="/products" className="btn luxury-primary-btn btn-lg">Khám phá ngay</Link>
                  <Link to="/products" className="btn luxury-secondary-btn btn-lg">Xem bộ sưu tập</Link>
                </div>
                <div className="luxury-hero-stats">
                  <div><strong>100%</strong><span>Chính hãng</span></div>
                  <div><strong>24h</strong><span>Đóng gói sang trọng</span></div>
                  <div><strong>Tận tâm</strong><span>Tư vấn chọn mùi</span></div>
                </div>
              </div>
              <div className="col-lg-6 order-1 order-lg-2">
                <div className="luxury-hero-visual">
                  <img
                    src="/assets/images/men-perfume-banner.png"
                    alt="Bộ sưu tập nước hoa HuyPerfume"
                    className="luxury-hero-image"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                  <div className="luxury-hero-card">
                    <span>Bộ sưu tập được tuyển chọn</span>
                    <strong>Phong cách sang trọng, hiện đại, đáng tin cậy</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="luxury-section">
        <div className="container">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-5">
              <p className="section-eyebrow mb-2">Về HuyPerfume</p>
              <h2 className="section-title mb-3">Trải nghiệm mua nước hoa theo tiêu chuẩn boutique</h2>
              <p className="luxury-muted mb-4">
                HuyPerfume mang đến nước hoa chính hãng với cách chọn mùi dễ hiểu, đóng gói tinh tế và tư vấn tận tâm để bạn tìm được dấu ấn riêng.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="row g-3">
                {[
                  'Nước hoa chính hãng, nguồn gốc rõ ràng',
                  'Trải nghiệm chọn mùi nhanh và dễ',
                  'Đóng gói sang trọng, chỉn chu từng chi tiết',
                  'Tư vấn tận tâm theo phong cách và ngân sách',
                ].map((item) => (
                  <div className="col-md-6" key={item}>
                    <div className="luxury-info-card h-100">
                      <div className="info-dot" />
                      <p className="mb-0">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="luxury-section pt-0">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end gap-3 mb-4">
            <div>
              <p className="section-eyebrow mb-2">Danh mục</p>
              <h2 className="section-title mb-0">Khám phá theo phong cách của bạn</h2>
            </div>
            <Link to="/products" className="btn luxury-link-btn">Tất cả danh mục</Link>
          </div>
          <div className="row g-3 g-lg-4">
            {categoryCards.map((cat, index) => (
              <div className="col-12 col-sm-6 col-xl-4" key={`${cat.name}-${index}`}>
                <Link to={cat.cat > 0 ? `/products?categoryId=${cat.cat}` : '/products'} className="text-decoration-none">
                  <div className="luxury-category-card">
                    <img src={cat.img} alt={cat.name} loading="lazy" decoding="async" />
                    <div className="luxury-category-overlay" />
                    <div className="luxury-category-content">
                      <span>Collection</span>
                      <h3>{cat.name}</h3>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-section pt-0">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end gap-3 mb-4">
            <div>
              <p className="section-eyebrow mb-2">Sản phẩm nổi bật</p>
              <h2 className="section-title mb-0">Những lựa chọn được yêu thích</h2>
            </div>
            <Link to="/products" className="btn luxury-link-btn">Xem tất cả</Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : featuredProducts.length === 0 ? (
            <div className="luxury-surface p-5 text-center">
              <p className="luxury-muted mb-0">Chưa có sản phẩm từ backend để hiển thị.</p>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
              {featuredProducts.map((p, index) => (
                <div className="col" key={p.id}>
                  <div className="luxury-featured-card h-100">
                    <span className="luxury-product-badge">{index % 3 === 0 ? 'Best Seller' : index % 3 === 1 ? 'New' : 'Luxury'}</span>
                    <Link to={`/products/${p.id}`} className="luxury-featured-media">
                      <img src={resolveProductImage(p.image)} alt={p.name} loading="lazy" decoding="async" />
                    </Link>
                    <div className="luxury-featured-body d-flex flex-column">
                      <div className="d-flex justify-content-between gap-2 align-items-start mb-2">
                        <h3 className="luxury-product-name mb-0">{p.name}</h3>
                      </div>
                      <p className="luxury-product-brand mb-2">{p.brand?.name || 'HuyPerfume Select'}</p>
                      <p className="luxury-product-desc mb-3">{p.description || 'Mùi hương tinh tế dành cho những ai yêu sự khác biệt.'}</p>
                      <div className="luxury-price-row mb-3">
                        <span className="luxury-price">{(p.discountPrice > 0 ? p.discountPrice : p.price).toLocaleString('vi-VN')}₫</span>
                        {p.discountPrice > 0 && <del>{p.price.toLocaleString('vi-VN')}₫</del>}
                      </div>
                      <div className="mt-auto d-flex gap-2">
                        <Link to={`/products/${p.id}`} className="btn luxury-secondary-btn flex-fill">Chi tiết</Link>
                        <button type="button" className="btn luxury-primary-btn flex-fill" onClick={() => handleAddToCart(p.id)} disabled={p.stock <= 0}>
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="luxury-section pt-0">
        <div className="container">
          <div className="row g-3 g-lg-4">
            {collectionCards.map((item) => (
              <div className="col-12 col-lg-4" key={item.title}>
                <div className="luxury-collection-card">
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
                  <div className="luxury-collection-content">
                    <p className="mb-2">Signature edit</p>
                    <h3 className="mb-3">{item.title}</h3>
                    <span>{item.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-cta-section" id="contact">
        <div className="container">
          <div className="luxury-cta-shell text-center">
            <p className="section-eyebrow mb-2 justify-content-center">Tư vấn chọn mùi</p>
            <h2 className="section-title mb-3">Tìm mùi hương dành riêng cho bạn</h2>
            <p className="luxury-muted mb-4 mx-auto" style={{ maxWidth: '42rem' }}>
              Nếu bạn đang phân vân giữa nhiều phong cách, HuyPerfume có thể giúp bạn lọc nhanh theo cảm xúc, dịp dùng và mức độ lưu hương mong muốn.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link to="/products" className="btn luxury-primary-btn btn-lg">Xem sản phẩm</Link>
              <a href="mailto:support@huyperfume.vn" className="btn luxury-secondary-btn btn-lg">Tư vấn chọn mùi</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
