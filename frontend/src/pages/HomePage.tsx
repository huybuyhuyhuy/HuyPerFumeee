import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { cartService } from '../services/cartService.js';
import { contactService } from '../services/contactService';
import { ProductCard } from '../components/Product/ProductCard.tsx';
import { ProductGridSkeleton } from '../components/Feedback/ProductSkeletons';
import type { Product } from '../types';
import { useToast } from '../store/ToastContext';
import { resolveProductImage } from '../utils/image';

const collectionSections = [
  { title: 'For Him', subtitle: 'Mạnh mẽ, lịch lãm, có chiều sâu', copy: 'Những mùi hương gỗ, da thuộc và trầm ấm cho phong thái tự tin.', image: '/assets/images/4.png', to: '/products?categoryId=1', badge: 'Men’s edit' },
  { title: 'For Her', subtitle: 'Thanh lịch, tinh tế, cuốn hút', copy: 'Hương hoa, trái cây và musk mềm mượt để tôn lên nét nữ tính hiện đại.', image: '/assets/images/5.png', to: '/products?categoryId=2', badge: 'Women’s edit' },
  { title: 'Signature Scents', subtitle: 'Mùi hương ký dấu cá nhân', copy: 'Các lựa chọn cân bằng giữa độ sang, độ bền và dấu ấn riêng không trộn lẫn.', image: '/assets/images/7.png', to: '/products?sort=best_seller', badge: 'House favorites' },
  { title: 'Seasonal Picks', subtitle: 'Theo mùa, theo mood', copy: 'Tươi mát cho ngày sáng, ấm áp cho những buổi tối cần cảm xúc hơn.', image: '/assets/images/6.png', to: '/products?season=seasonal', badge: 'Mood selection' },
  { title: 'Niche Collection', subtitle: 'Tinh tuyển, khác biệt, khó quên', copy: 'Những mùi hương có cá tính riêng cho người thích sự độc bản và có gu.', image: '/assets/images/12.png', to: '/products?collection=niche', badge: 'Curated niche' },
];

const signaturePoints = [
  'Chính hãng 100%',
  'Tuyển chọn kỹ lưỡng',
  'Đóng gói tinh tế',
  'Tư vấn theo phong cách',
];

const categoryCards = [
  { name: 'Floral', cat: 2, img: '/assets/images/women-perfume-banner.png', desc: 'Mềm mại, nữ tính và sáng bừng như một campaign mùa xuân.', tone: 'Petal glow' },
  { name: 'Woody', cat: 1, img: '/assets/images/men-perfume-banner.png', desc: 'Trầm ấm, bản lĩnh và có chiều sâu theo ngôn ngữ thời trang nam.', tone: 'Urban wood' },
  { name: 'Amber', cat: 4, img: '/assets/images/7.png', desc: 'Ấm, sang và cuốn hút - đúng tinh thần evening luxury.', tone: 'Golden amber' },
  { name: 'Fresh', cat: 3, img: '/assets/images/unisex-perfume-banner.png', desc: 'Sạch, sáng, thoáng và hiện đại cho nhịp sống mỗi ngày.', tone: 'Clean air' },
  { name: 'Oriental', cat: 4, img: '/assets/images/12.png', desc: 'Dày dặn, gợi cảm và đầy cảm xúc, như một khung hình điện ảnh.', tone: 'Velvet mood' },
  { name: 'Citrus', cat: 5, img: '/assets/images/3.png', desc: 'Bùng nổ tươi mát, giàu năng lượng và rất dễ yêu.', tone: 'Bright spark' },
];

type HeroSlide = {
  id: string | number;
  name: string;
  brand: string;
  tagline: string;
  image: string;
  badge: string;
  to: string;
};

type ContactFormState = {
  name: string;
  phone: string;
  email: string;
  need: string;
  message: string;
};

const fallbackHeroSlides: HeroSlide[] = [
  {
    id: 'signature',
    name: 'HuyPerfume Signature',
    brand: 'Bộ sưu tập 2026',
    tagline: 'Những mùi hương được chọn lọc cho phong cách thanh lịch, tự tin và khác biệt.',
    image: '/assets/images/7.png',
    badge: 'Tuyển chọn',
    to: '/products',
  },
  {
    id: 'modern-oud',
    name: 'Hương gỗ trầm ấm',
    brand: 'Bộ sưu tập nam',
    tagline: 'Sâu lắng, sang trọng và có độ lưu hương bền bỉ cho những khoảnh khắc quan trọng.',
    image: '/assets/images/4.png',
    badge: 'Bán chạy',
    to: '/products?categoryId=1',
  },
  {
    id: 'floral-muse',
    name: 'Hương hoa thanh lịch',
    brand: 'Bộ sưu tập nữ',
    tagline: 'Mềm mại, tinh tế và hiện đại, dành cho vẻ đẹp nữ tính không cần phô trương.',
    image: '/assets/images/5.png',
    badge: 'Mới về',
    to: '/products?categoryId=2',
  },
];

const serviceCommitments = [
  { icon: 'shield', title: 'Chính hãng 100%', description: 'Sản phẩm có nguồn gốc rõ ràng, được tuyển chọn kỹ lưỡng trước khi đến tay khách hàng.' },
  { icon: 'truck', title: 'Giao hàng nhanh', description: 'Đóng gói an toàn và giao toàn quốc, ưu tiên trải nghiệm nhận hàng gọn gàng, đúng hẹn.' },
  { icon: 'gift', title: 'Đóng gói tinh tế', description: 'Mỗi đơn hàng được chuẩn bị như một món quà, phù hợp để dùng riêng hoặc gửi tặng.' },
  { icon: 'headset', title: 'Tư vấn tận tâm', description: 'Gợi ý mùi hương theo phong cách, dịp sử dụng, ngân sách và độ lưu hương mong muốn.' },
  { icon: 'refresh', title: 'Hỗ trợ đổi trả', description: 'Quy trình hỗ trợ rõ ràng khi sản phẩm gặp lỗi hoặc không đúng với thông tin đặt hàng.' },
  { icon: 'award', title: 'Ưu đãi thành viên', description: 'Khách hàng thân thiết được nhận ưu đãi riêng và gợi ý sản phẩm phù hợp hơn theo thời gian.' },
];

const formatCurrency = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

function SmallIcon({ name }: { name: string }) {
  const commonProps = {
    className: 'luxury-line-icon',
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  if (name === 'truck') return <svg {...commonProps}><rect x="3" y="7" width="11" height="10" /><path d="M14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="17" cy="19" r="2" /></svg>;
  if (name === 'gift') return <svg {...commonProps}><rect x="4" y="10" width="16" height="10" /><rect x="4" y="6" width="16" height="4" /><path d="M12 6v14" /><path d="M9 6c-2 0-3-1-3-2s1-2 2.2-2C10 2 12 6 12 6" /><path d="M15 6c2 0 3-1 3-2s-1-2-2.2-2C14 2 12 6 12 6" /></svg>;
  if (name === 'headset') return <svg {...commonProps}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="4" y="13" width="4" height="6" /><rect x="16" y="13" width="4" height="6" /><path d="M16 20h-3" /></svg>;
  if (name === 'refresh') return <svg {...commonProps}><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M18 9a7 7 0 0 0-11.5-2.5L4 9" /><path d="M6 15a7 7 0 0 0 11.5 2.5L20 15" /></svg>;
  if (name === 'award') return <svg {...commonProps}><circle cx="12" cy="9" r="6" /><path d="m9 14-1 7 4-2 4 2-1-7" /></svg>;
  return <svg {...commonProps}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-5" /></svg>;
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [contactForm, setContactForm] = useState<ContactFormState>({ name: '', phone: '', email: '', need: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    productService.getProducts({ page: 1, size: 4, sort: 'best_seller' })
      .then((data) => setProducts(Array.isArray(data?.content) ? data.content : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const heroSlides = useMemo<HeroSlide[]>(() => {
    const realProductSlides = products.slice(0, 3).map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand?.name || 'HuyPerfume',
      tagline: product.description || 'Mùi hương được HuyPerfume tuyển chọn cho phong cách riêng của bạn.',
      image: resolveProductImage(product.image),
      badge: product.isDecant ? 'Mini size' : product.discountPrice > 0 ? 'Ưu đãi' : 'Nổi bật',
      to: `/products/${product.id}`,
    }));

    return realProductSlides.length > 0 ? realProductSlides : fallbackHeroSlides;
  }, [products]);

  const safeHeroSlides = heroSlides.length > 0 ? heroSlides : fallbackHeroSlides;
  const activeHero = safeHeroSlides[heroIndex % safeHeroSlides.length] || fallbackHeroSlides[0];
  const bestPrice = products[0] ? formatCurrency(products[0].discountPrice > 0 ? products[0].discountPrice : products[0].price) : 'Từ 690.000₫';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % safeHeroSlides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [safeHeroSlides.length]);

  const handleAddToCart = async (productId: number) => {
    try {
      await cartService.addItem(productId, 1);
      pushToast('Đã thêm vào giỏ hàng.', 'success');
    } catch (err: any) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
    }
  };

  const updateContactField = (field: keyof ContactFormState, value: string) => setContactForm((current) => ({ ...current, [field]: value }));

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) { pushToast('Vui lòng nhập họ tên và số điện thoại.', 'info'); return; }
    try {
      setContactSubmitting(true);
      await contactService.createContact({
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim() || undefined,
        need: contactForm.need,
        message: contactForm.message.trim() || undefined,
      });
      pushToast('Đã gửi yêu cầu tư vấn. HuyPerfume sẽ liên hệ sớm.', 'success');
      setContactForm({ name: '', phone: '', email: '', need: '', message: '' });
    } catch (err: any) {
      pushToast(err?.message || 'Không gửi được yêu cầu tư vấn.', 'error');
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="luxury-home">
      <section className="luxury-hero-cinematic">
        <div className="luxury-hero-cinematic-bg" aria-hidden="true">
          <div className="luxury-hero-orb luxury-hero-orb-a" />
          <div className="luxury-hero-orb luxury-hero-orb-b" />
          <div className="luxury-hero-vignette" />
        </div>
        <div className="container">
          <div className="luxury-hero-cinematic-grid">
            <div className="luxury-hero-copy product-fade-in is-visible">
              <span className="luxury-kicker">Bộ sưu tập 2026</span>
              <h1 className="luxury-hero-title">Mùi hương<span> có gu thật sự</span></h1>
              <p className="luxury-hero-desc">Một không gian chọn nước hoa theo cảm xúc, đẳng cấp và cá tính — tinh tế ngay từ giây đầu tiên.</p>
              <p className="luxury-hero-mood-copy">HuyPerfume tuyển chọn những mùi hương sang trọng, hiện đại và đủ khác biệt để tạo dấu ấn riêng.</p>
              <div className="luxury-hero-actions">
                <Link to="/products" className="btn luxury-primary-btn btn-lg">Khám phá ngay</Link>
                <a href="#contact" className="btn luxury-secondary-btn btn-lg">Tư vấn miễn phí</a>
              </div>
              <div className="luxury-hero-stats" aria-label="Điểm nổi bật của HuyPerfume">
                <div><strong>500+</strong><span>Sản phẩm chính hãng</span></div>
                <div><strong>50+</strong><span>Thương hiệu cao cấp</span></div>
                <div><strong>10K+</strong><span>Khách hàng tin tưởng</span></div>
              </div>
            </div>

            <div className="luxury-hero-showcase" aria-label={`Featured ${activeHero.name}`}>
              <div className="luxury-hero-frame-wrap">
                <div className="luxury-hero-frame-glow" aria-hidden="true" />
                <Link to={activeHero.to} className="luxury-hero-frame" aria-label={`Xem ${activeHero.name}`}>
                  <img src={activeHero.image} alt={activeHero.name} loading="eager" decoding="async" fetchPriority="high" />
                  <div className="luxury-hero-product">
                    <p>{activeHero.brand}</p>
                    <h2>{activeHero.name}</h2>
                    <span>{activeHero.tagline}</span>
                  </div>
                </Link>
                <div className="luxury-hero-floating-bottle" aria-hidden="true"><img src="/assets/images/7.png" alt="" loading="lazy" decoding="async" /></div>
              </div>
              <div className="luxury-hero-floating-card"><span>Đánh giá khách hàng</span><strong>4.9/5</strong><small>Hơn 2,500 phản hồi</small></div>
              <div className="luxury-hero-badge">{activeHero.badge}</div>
              <div className="luxury-hero-controls" aria-label="Chuyển sản phẩm nổi bật">
                <button type="button" onClick={() => setHeroIndex((current) => (current - 1 + safeHeroSlides.length) % safeHeroSlides.length)} aria-label="Sản phẩm trước">‹</button>
                <div>
                  {safeHeroSlides.map((slide, index) => <button key={slide.id} type="button" className={index === heroIndex % safeHeroSlides.length ? 'active' : ''} onClick={() => setHeroIndex(index)} aria-label={`Đến sản phẩm ${index + 1}`} />)}
                </div>
                <button type="button" onClick={() => setHeroIndex((current) => (current + 1) % safeHeroSlides.length)} aria-label="Sản phẩm tiếp theo">›</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="luxury-section luxury-category-section luxury-scroll-reveal">
        <div className="container">
          <div className="luxury-section-heading text-center">
            <p className="section-eyebrow justify-content-center">Danh mục</p>
            <h2 className="section-title">Khám phá theo phong cách</h2>
          </div>
          <div className="luxury-category-grid">
            {categoryCards.map((category) => (
              <Link key={category.name} to={`/products?categoryId=${category.cat}`} className="luxury-category-card">
                <img src={category.img} alt={category.name} loading="lazy" decoding="async" />
                <div className="luxury-category-overlay" />
                <div className="luxury-category-content"><p>Collection</p><h3>{category.name}</h3></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-section luxury-featured-section luxury-scroll-reveal">
        <div className="container">
          <div className="luxury-featured-heading">
            <div><p className="section-eyebrow">Sản phẩm nổi bật</p><h2 className="section-title">Được yêu thích nhất</h2></div>
            <Link to="/products" className="btn luxury-link-btn">Xem tất cả</Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="luxury-surface luxury-empty-state text-center"><h3>Chưa có sản phẩm để hiển thị</h3><p className="luxury-muted mb-0">Khi backend trả dữ liệu, khu vực này sẽ tự động hiển thị sản phẩm thật.</p></div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4 luxury-mobile-snap-row">
              {products.map((product) => <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />)}
            </div>
          )}
        </div>
      </section>

      <section className="luxury-section luxury-story-section luxury-scroll-reveal">
        <div className="container">
          <div className="luxury-story-grid">
            <div className="luxury-story-media">
              <img src="/assets/images/12.png" alt="HuyPerfume craftsmanship" loading="lazy" decoding="async" />
              <div className="luxury-story-media-card">
                <span>Signature identity</span>
                <strong>Curated, not crowded</strong>
                <p>Một trải nghiệm boutique, nơi từng lựa chọn đều có lý do và có câu chuyện.</p>
              </div>
            </div>
            <div className="luxury-story-copy">
              <p className="section-eyebrow">Brand story</p>
              <h2 className="section-title">Đây là một brand thật, có gu và có tinh thần riêng.</h2>
              <p className="luxury-section-lead">HuyPerfume được xây dựng như một boutique fragrance house: chọn lọc, tinh tế và tập trung vào cảm giác sở hữu một mùi hương đúng với bản sắc của bạn.</p>
              <div className="luxury-story-points">
                <article>
                  <span>Why choose us</span>
                  <strong>Chọn lọc có chủ đích</strong>
                  <p>Không bày tràn lan. Mỗi sản phẩm xuất hiện đều được cân nhắc theo tính thẩm mỹ, độ tin cậy và độ phù hợp với người dùng.</p>
                </article>
                <article>
                  <span>Craftsmanship</span>
                  <strong>Chăm chút như một atelier</strong>
                  <p>Từ ảnh sản phẩm, khoảng thở đến typography đều được tinh chỉnh để mang cảm giác thủ công cao cấp, mềm mại và chỉn chu.</p>
                </article>
                <article>
                  <span>Authenticity</span>
                  <strong>Minh bạch và đáng tin</strong>
                  <p>Thông tin sản phẩm, trust cues và social proof được trình bày rõ ràng để người dùng cảm thấy an tâm ngay từ đầu.</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="luxury-section luxury-collection-editorial luxury-scroll-reveal">
        <div className="container">
          <div className="luxury-section-heading text-center">
            <p className="section-eyebrow justify-content-center">Featured collections</p>
            <h2 className="section-title">Curated fragrance experience</h2>
            <p className="luxury-section-lead">Mỗi collection có nhịp riêng, không lặp layout, giống một tạp chí mùi hương hơn là một catalog thông thường.</p>
          </div>
          <div className="luxury-collection-stack">
            {collectionSections.map((item, index) => (
              <article key={item.title} className={`luxury-collection-editorial-card ${index % 2 === 1 ? 'reverse' : ''}`}>
                <div className="luxury-collection-visual">
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
                  <span className="luxury-collection-badge">{item.badge}</span>
                </div>
                <div className="luxury-collection-copy">
                  <p className="section-eyebrow">{item.title}</p>
                  <h3>{item.subtitle}</h3>
                  <p>{item.copy}</p>
                  <Link to={item.to} className="btn luxury-primary-btn">Khám phá collection</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-section luxury-trust-section luxury-scroll-reveal">
        <div className="container">
          <div className="luxury-section-heading text-center">
            <p className="section-eyebrow justify-content-center">Trust & social proof</p>
            <h2 className="section-title">Tinh tế, minh bạch, đáng tin</h2>
            <p className="luxury-section-lead">Thông tin ngắn gọn, rõ ràng và đủ để người dùng cảm thấy an tâm mà không bị ngợp bởi marketing noise.</p>
          </div>
          <div className="luxury-trust-stat-grid">
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Authentic guarantee</span><strong>100%</strong><p>Cam kết sản phẩm chính hãng, nguồn gốc rõ ràng.</p></article>
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Total orders</span><strong>25K+</strong><p>Lượt đơn đã hoàn tất trên hệ thống.</p></article>
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Customer count</span><strong>10K+</strong><p>Khách hàng quay lại và giới thiệu thêm bạn bè.</p></article>
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Rating</span><strong>4.9/5</strong><p>Được đánh giá cao bởi trải nghiệm mua sắm chỉn chu.</p></article>
          </div>
          <div className="luxury-trust-badges">
            {serviceCommitments.slice(0, 4).map((item) => (
              <div key={item.title} className="luxury-trust-badge-card">
                <div className="luxury-trust-badge-icon"><SmallIcon name={item.icon} /></div>
                <div><strong>{item.title}</strong><span>{item.description}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="luxury-section luxury-cta-section" id="contact">
        <div className="container">
          <div className="luxury-cta-shell">
            <div className="luxury-cta-copy">
              <p className="section-eyebrow">Liên hệ ngay</p>
              <h2 className="section-title">Cần tư vấn?<span> HuyPerfume sẵn sàng hỗ trợ</span></h2>
              <p className="luxury-muted">Chọn nhanh theo nhóm mùi, dịp sử dụng hoặc ngân sách. Đội ngũ HuyPerfume sẽ giúp bạn rút ngắn hành trình tìm mùi hương phù hợp.</p>
              <div className="luxury-contact-grid">
                <a href="tel:0900000000" className="luxury-contact-card"><span>Hotline</span><strong>0900 000 000</strong></a>
                <a href="mailto:support@huyperfume.vn" className="luxury-contact-card"><span>Email hỗ trợ</span><strong>support@huyperfume.vn</strong></a>
              </div>
              <div className="luxury-cta-actions">
                <Link to="/products" className="btn luxury-primary-btn btn-lg">Xem sản phẩm</Link>
                <a href="mailto:support@huyperfume.vn" className="btn luxury-secondary-btn btn-lg">Tư vấn chọn mùi</a>
              </div>
            </div>
            <div className="luxury-cta-panel">
              <form className="luxury-contact-form" onSubmit={handleContactSubmit}>
                <span className="luxury-form-eyebrow">Gửi yêu cầu tư vấn</span>
                <h3>Nhận gợi ý mùi hương</h3>
                <label>Họ tên<input name="name" type="text" placeholder="Tên của bạn" value={contactForm.name} onChange={(event) => updateContactField('name', event.target.value)} required /></label>
                <label>Số điện thoại<input name="phone" type="tel" placeholder="0900 000 000" value={contactForm.phone} onChange={(event) => updateContactField('phone', event.target.value)} required /></label>
                <label>Email<input name="email" type="email" placeholder="support@huyperfume.vn" value={contactForm.email} onChange={(event) => updateContactField('email', event.target.value)} /></label>
                <label>Nhu cầu<select name="need" value={contactForm.need} onChange={(event) => updateContactField('need', event.target.value)}><option value="" disabled>Chọn nhu cầu</option><option value="daily">Nước hoa dùng hằng ngày</option><option value="gift">Quà tặng cao cấp</option><option value="office">Mùi hương đi làm</option><option value="party">Mùi hương dự tiệc</option></select></label>
                <label>Ghi chú<textarea name="message" rows={3} placeholder="Ví dụ: thích hương gỗ, ngân sách 2 triệu..." value={contactForm.message} onChange={(event) => updateContactField('message', event.target.value)} /></label>
                <button type="submit" disabled={contactSubmitting}>{contactSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
              </form>
              <div><span>Giá tham khảo</span><strong>{bestPrice}</strong><p>Tùy sản phẩm và dung tích</p></div>
              <div><span>Thời gian hỗ trợ</span><strong>8:00 - 21:00</strong><p>Phản hồi nhanh trong ngày</p></div>
              <div><span>Giao hàng</span><strong>1 - 3 ngày</strong><p>Áp dụng toàn quốc</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
