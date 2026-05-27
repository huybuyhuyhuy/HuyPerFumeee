import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { cartService } from '../services/cartService.js';
import { contactService } from '../services/contactService';
import { ProductCard } from '../components/Product/ProductCard.tsx';
import { ProductGridSkeleton } from '../components/Feedback/ProductSkeletons';
import type { Product } from '../types';
import { useToast } from '../store/ToastContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { resolveProductImage } from '../utils/image';
import { siteContact } from '../config/siteConfig';

const luxuryCollectionSections = [
  { title: 'Cho Nam', subtitle: 'Gỗ trầm, da thuộc, bản lĩnh', copy: 'Các mùi hương nam tính có độ sâu, dễ mặc nhưng vẫn đủ nổi bật trong những buổi gặp quan trọng.', image: '/assets/images/4.webp', to: '/products?categoryId=1', badge: 'Tuyển chọn nam', note: 'Gỗ / Thơm nồng' },
  { title: 'Cho Nữ', subtitle: 'Hoa trắng, musk, nét mềm sang', copy: 'Một tuyển tập nữ tính hiện đại: sạch, mượt, lưu hương đẹp và hợp cả ngày thường lẫn dịp đặc biệt.', image: '/assets/images/5.webp', to: '/products?categoryId=2', badge: 'Tuyển chọn nữ', note: 'Hoa / Xạ hương' },
  { title: 'Hương đặc trưng', subtitle: 'Mùi hương tạo dấu ấn riêng', copy: 'Những lựa chọn có độ cân bằng tốt giữa độ sang, độ bền và khả năng trở thành mùi hương nhận diện.', image: '/assets/images/7.webp', to: '/products?sort=best_seller', badge: 'Lựa chọn của HuyPerfume', note: 'Bán chạy nhất' },
  { title: 'Bộ sưu tập độc quyền', subtitle: 'Tinh tuyển, khác biệt, khó quên', copy: 'Dành cho người thích một cấu trúc mùi có cá tính rõ ràng, giàu lớp lang và không đại trà.', image: '/assets/images/12.webp', to: '/products?categoryId=4', badge: 'Độc bản', note: 'Hàng hiếm' },
];

const categoryCards = [
  { name: 'Hương hoa', cat: 2, fallbackImage: '/assets/images/5.webp', desc: 'Mềm mại, nữ tính và sáng bừng như một chiến dịch mùa xuân.', tone: 'Sắc hoa' },
  { name: 'Hương gỗ', cat: 1, fallbackImage: '/assets/images/4.webp', desc: 'Trầm ấm, bản lĩnh và có chiều sâu theo tinh thần sang trọng nam tính.', tone: 'Gỗ thành thị' },
  { name: 'Hổ phách', cat: 4, fallbackImage: '/assets/images/7.webp', desc: 'Ấm, sang và cuốn hút đúng chất luxury evening.', tone: 'Hổ phách vàng' },
  { name: 'Tươi mát', cat: 3, fallbackImage: '/assets/images/6.webp', desc: 'Sạch, sáng, thoáng và hiện đại cho nhịp sống mỗi ngày.', tone: 'Không khí sạch' },
  { name: 'Phương Đông', cat: 4, fallbackImage: '/assets/images/12.webp', desc: 'Dày dặn, gợi cảm và đầy cảm xúc như một khung hình điện ảnh.', tone: 'Nhung quyến rũ' },
  { name: 'Cam chanh', cat: 5, fallbackImage: '/assets/images/3.webp', desc: 'Bùng nổ tươi mát, giàu năng lượng và rất dễ yêu.', tone: 'Tia sáng' },
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

type ProductWithCategoryAliases = Product & {
  categoryId?: number | string | null;
  id_category?: number | string | null;
};

type ContactFormState = {
  name: string;
  phone: string;
  email: string;
  need: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

type ContactFeedback = {
  tone: 'success' | 'error';
  message: string;
} | null;

const emptyContactForm: ContactFormState = {
  name: '',
  phone: '',
  email: '',
  need: '',
  message: '',
};

const contactChannels = [
  { icon: 'headset', label: 'Hotline tư vấn', value: siteContact.phoneDisplay, note: '8:00 - 21:00 mỗi ngày', href: siteContact.phoneHref },
  { icon: 'mail', label: 'Email hỗ trợ', value: siteContact.email, note: 'Phản hồi trong ngày', href: siteContact.emailHref },
];

const consultationSteps = [
  { title: 'Chia sẻ nhu cầu', description: 'Cho chúng tôi biết dịp dùng, gu hương hoặc ngân sách.' },
  { title: 'Nhận gợi ý riêng', description: 'Chuyên viên đề xuất lựa chọn phù hợp, dễ so sánh.' },
  { title: 'Tự tin chọn mùi', description: 'Chốt sản phẩm và nhận hỗ trợ đặt hàng tận tâm.' },
];

const contactNeedOptions = [
  { value: 'daily', label: 'Nước hoa dùng hằng ngày' },
  { value: 'gift', label: 'Quà tặng cao cấp' },
  { value: 'office', label: 'Mùi hương đi làm' },
  { value: 'party', label: 'Mùi hương dự tiệc' },
  { value: 'signature', label: 'Tìm mùi hương signature' },
];

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

function validateContactForm(form: ContactFormState) {
  const errors: ContactFormErrors = {};
  const name = form.name.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();

  if (!name) {
    errors.name = 'Vui lòng nhập họ tên.';
  } else if (name.length < 2) {
    errors.name = 'Họ tên cần ít nhất 2 ký tự.';
  }

  if (!phone) {
    errors.phone = 'Vui lòng nhập số điện thoại.';
  } else if (!/^[0-9+\-\s().]{8,20}$/.test(phone)) {
    errors.phone = 'Nhập số điện thoại hợp lệ từ 8 đến 20 ký tự.';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Địa chỉ email chưa hợp lệ.';
  }

  if (!form.need) {
    errors.need = 'Chọn nhu cầu để tư vấn chính xác hơn.';
  }

  return errors;
}

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
  if (name === 'mail') return <svg {...commonProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  if (name === 'refresh') return <svg {...commonProps}><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M18 9a7 7 0 0 0-11.5-2.5L4 9" /><path d="M6 15a7 7 0 0 0 11.5 2.5L20 15" /></svg>;
  if (name === 'award') return <svg {...commonProps}><circle cx="12" cy="9" r="6" /><path d="m9 14-1 7 4-2 4 2-1-7" /></svg>;
  return <svg {...commonProps}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-5" /></svg>;
}

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [contactErrors, setContactErrors] = useState<ContactFormErrors>({});
  const [contactFeedback, setContactFeedback] = useState<ContactFeedback>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const { pushToast } = useToast();
  const sectionRevealRef = useScrollReveal('.luxury-scroll-reveal');
  const featuredRevealRef = useScrollReveal('.scroll-reveal-item', !loading && products.length > 0);

  useEffect(() => {
    productService.getProducts({ page: 1, size: 12, sort: 'best_seller' })
      .then((data) => setProducts(Array.isArray(data?.content) ? data.content : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  function getProductCategoryId(product: Product) {
    const item = product as ProductWithCategoryAliases;
    const categoryId = item.category?.id ?? item.categoryId ?? item.id_category;
    const numericCategoryId = Number(categoryId);

    return Number.isFinite(numericCategoryId) ? numericCategoryId : null;
  }

  function getProductImageByCategory(categoryId: number, fallbackImage: string) {
    const product = products.find((item) => getProductCategoryId(item) === categoryId && Boolean(item.image));

    return product?.image ? resolveProductImage(product.image) : fallbackImage;
  }

  function getProductImageByIndex(index: number, fallbackImage: string) {
    const productImage = products[index]?.image;

    return productImage ? resolveProductImage(productImage) : fallbackImage;
  }

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
  const mostLovedProducts = useMemo(() => (
    [...products]
      .sort((left, right) => {
        const leftScore = (left.rating || 0) * 100 + (left.reviewCount || 0) * 8 + (left.soldCount || 0);
        const rightScore = (right.rating || 0) * 100 + (right.reviewCount || 0) * 8 + (right.soldCount || 0);
        return rightScore - leftScore;
      })
      .slice(0, 4)
  ), [products]);
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
      throw err;
    }
  };

  const updateContactField = (field: keyof ContactFormState, value: string) => {
    setContactForm((current) => ({ ...current, [field]: value }));
    setContactErrors((current) => ({ ...current, [field]: undefined }));
    setContactFeedback(null);
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateContactForm(contactForm);
    const firstInvalidField = Object.keys(validationErrors)[0] as keyof ContactFormState | undefined;

    if (firstInvalidField) {
      setContactErrors(validationErrors);
      setContactFeedback({ tone: 'error', message: 'Vui lòng kiểm tra lại các thông tin cần thiết.' });
      const field = event.currentTarget.elements.namedItem(firstInvalidField);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    try {
      setContactSubmitting(true);
      setContactFeedback(null);
      await contactService.createContact({
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim(),
        email: contactForm.email.trim() || undefined,
        need: contactForm.need,
        message: contactForm.message.trim() || undefined,
      });
      pushToast('Đã gửi yêu cầu tư vấn. HuyPerfume sẽ liên hệ sớm.', 'success');
      setContactForm(emptyContactForm);
      setContactErrors({});
      setContactFeedback({ tone: 'success', message: 'Yêu cầu đã được gửi. Chuyên viên sẽ liên hệ với bạn sớm nhất.' });
    } catch (err: any) {
      const message = err?.message || 'Không gửi được yêu cầu tư vấn. Vui lòng thử lại hoặc gọi hotline.';
      setContactFeedback({ tone: 'error', message });
      pushToast(message, 'error');
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="luxury-home" ref={sectionRevealRef}>
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
            <p className="section-eyebrow justify-content-center">Bộ sưu tập</p>
            <h2 className="section-title">Khám phá theo phong cách</h2>
            <p className="luxury-section-lead">Những mảng hương được chọn lọc theo mood, giúp người dùng xem nhanh và tìm đúng gu chỉ trong vài giây.</p>
          </div>
          <div className="luxury-category-grid">
            {categoryCards.map((category) => {
              const image = getProductImageByCategory(category.cat, category.fallbackImage);

              return (
                <Link key={category.name} to={`/products?categoryId=${category.cat}`} className="luxury-category-card">
                  <img
                    src={image}
                    alt={category.name}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.src = category.fallbackImage;
                    }}
                  />
                  <div className="luxury-category-overlay" />
                  <div className="luxury-category-content">
                    <span className="luxury-category-tone">{category.tone}</span>
                    <p>Bộ sưu tập</p>
                    <h3>{category.name}</h3>
                    <small>{category.desc}</small>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="luxury-section luxury-featured-section">
        <div className="container" ref={featuredRevealRef}>
          <div className="luxury-featured-heading scroll-reveal-item">
            <div>
              <p className="section-eyebrow">Được yêu thích nhất</p>
              <h2 className="section-title">Được chọn nhiều nhất</h2>
              <p className="luxury-featured-subtitle">Sắp xếp theo tín hiệu thật từ lượt mua, đánh giá và mức độ quan tâm thay vì chỉ lấy ngẫu nhiên.</p>
            </div>
            <Link to="/products?sort=best_seller" className="btn luxury-link-btn">Xem tất cả</Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : products.length === 0 ? (
            <div className="luxury-surface luxury-empty-state text-center"><h3>Chưa có sản phẩm để hiển thị</h3><p className="luxury-muted mb-0">Khi backend trả dữ liệu, khu vực này sẽ tự động hiển thị sản phẩm thật.</p></div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4 luxury-mobile-snap-row">
              {mostLovedProducts.map((product) => <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />)}
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
                <span>Bản sắc riêng</span>
                <strong>Tuyển chọn tinh tế</strong>
                <p>Một trải nghiệm boutique, nơi từng lựa chọn đều có lý do và có câu chuyện.</p>
              </div>
            </div>
            <div className="luxury-story-copy">
              <p className="section-eyebrow">Câu chuyện thương hiệu</p>
              <h2 className="section-title">Đây là một brand thật, có gu và có tinh thần riêng.</h2>
              <p className="luxury-section-lead">HuyPerfume được xây dựng như một boutique fragrance house: chọn lọc, tinh tế và tập trung vào cảm giác sở hữu một mùi hương đúng với bản sắc của bạn.</p>
              <div className="luxury-story-points">
                <article>
                  <span>Vì sao chọn chúng tôi</span>
                  <strong>Chọn lọc có chủ đích</strong>
                  <p>Không bày tràn lan. Mỗi sản phẩm xuất hiện đều được cân nhắc theo tính thẩm mỹ, độ tin cậy và độ phù hợp với người dùng.</p>
                </article>
                <article>
                  <span>Thủ công tinh xảo</span>
                  <strong>Chăm chút như một atelier</strong>
                  <p>Từ ảnh sản phẩm, khoảng thở đến typography đều được tinh chỉnh để mang cảm giác thủ công cao cấp, mềm mại và chỉn chu.</p>
                </article>
                <article>
                  <span>Chính hãng</span>
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
            <p className="section-eyebrow justify-content-center">Bộ sưu tập nổi bật</p>
            <h2 className="section-title">Trải nghiệm mùi hương tuyển chọn</h2>
            <p className="luxury-section-lead">Bốn edit được chọn theo mood thật, có vai trò rõ ràng: dễ chọn hơn, sang hơn và không còn cảm giác catalog xếp đều cho có.</p>
          </div>
          <div className="luxury-collection-stack">
            {luxuryCollectionSections.map((item, index) => {
              const image = getProductImageByIndex(index, item.image);

              return (
                <article key={item.title} className={`luxury-collection-editorial-card ${index % 2 === 1 ? 'reverse' : ''}`}>
                  <div className="luxury-collection-visual">
                    <img
                      src={image}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.src = item.image;
                      }}
                    />
                    <span className="luxury-collection-badge">{item.badge}</span>
                  </div>
                  <div className="luxury-collection-copy">
                    <p className="section-eyebrow">{item.title}</p>
                    <h3>{item.subtitle}</h3>
                    <p>{item.copy}</p>
                    <span className="luxury-collection-note">{item.note}</span>
                    <Link to={item.to} className="btn luxury-primary-btn">Khám phá collection</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="luxury-section luxury-trust-section luxury-scroll-reveal">
        <div className="container">
          <div className="luxury-section-heading text-center">
            <p className="section-eyebrow justify-content-center">Uy tín & khách hàng</p>
            <h2 className="section-title">Tinh tế, minh bạch, đáng tin</h2>
            <p className="luxury-section-lead">Thông tin ngắn gọn, rõ ràng và đủ để người dùng cảm thấy an tâm mà không bị ngợp bởi marketing noise.</p>
          </div>
          <div className="luxury-trust-stat-grid">
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Cam kết chính hãng</span><strong>100%</strong><p>Cam kết sản phẩm chính hãng, nguồn gốc rõ ràng.</p></article>
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Tổng đơn hàng</span><strong>25K+</strong><p>Lượt đơn đã hoàn tất trên hệ thống.</p></article>
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Khách hàng</span><strong>10K+</strong><p>Khách hàng quay lại và giới thiệu thêm bạn bè.</p></article>
            <article className="luxury-trust-stat-card"><span className="luxury-trust-stat-label">Đánh giá</span><strong>4.9/5</strong><p>Được đánh giá cao bởi trải nghiệm mua sắm chỉn chu.</p></article>
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

      <section className="luxury-section luxury-cta-section luxury-scroll-reveal" id="contact" aria-labelledby="contact-title">
        <div className="container">
          <div className="luxury-cta-shell">
            <div className="luxury-cta-copy">
              <p className="section-eyebrow">Tư vấn cá nhân</p>
              <h2 className="section-title" id="contact-title">Tìm mùi hương thật sự hợp với bạn</h2>
              <p className="luxury-contact-intro">Chia sẻ phong cách, dịp sử dụng hoặc ngân sách. Chuyên viên HuyPerfume sẽ chọn lọc những gợi ý vừa đủ để bạn quyết định dễ dàng.</p>
              <div className="luxury-contact-grid">
                {contactChannels.map((channel) => (
                  <a href={channel.href} className="luxury-contact-card" key={channel.label}>
                    <span className="luxury-contact-icon"><SmallIcon name={channel.icon} /></span>
                    <span className="luxury-contact-card-copy">
                      <small>{channel.label}</small>
                      <strong>{channel.value}</strong>
                      <em>{channel.note}</em>
                    </span>
                    <span className="luxury-contact-arrow" aria-hidden="true">→</span>
                  </a>
                ))}
              </div>
              <ol className="luxury-contact-steps" aria-label="Quy trình tư vấn">
                {consultationSteps.map((step, index) => (
                  <li key={step.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{step.title}</strong><p>{step.description}</p></div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="luxury-cta-panel">
              <div className="luxury-contact-panel-header">
                <span className="luxury-form-eyebrow">Yêu cầu tư vấn</span>
                <h3>Nhận gợi ý trong ngày</h3>
                <p>Điền thông tin bên dưới, đội ngũ tư vấn sẽ chủ động liên hệ.</p>
              </div>
              <form className="luxury-contact-form" onSubmit={handleContactSubmit} noValidate>
                <div className="luxury-contact-form-row">
                  <label className={contactErrors.name ? 'has-error' : ''} htmlFor="contact-name">
                    <span className="luxury-field-label">Họ tên <b>*</b></span>
                    <input id="contact-name" name="name" type="text" maxLength={120} autoComplete="name" placeholder="Nguyễn Minh Anh" value={contactForm.name} onChange={(event) => updateContactField('name', event.target.value)} aria-invalid={Boolean(contactErrors.name)} aria-describedby={contactErrors.name ? 'contact-name-error' : undefined} />
                    {contactErrors.name && <small className="luxury-field-error" id="contact-name-error">{contactErrors.name}</small>}
                  </label>
                  <label className={contactErrors.phone ? 'has-error' : ''} htmlFor="contact-phone">
                    <span className="luxury-field-label">Số điện thoại <b>*</b></span>
                    <input id="contact-phone" name="phone" type="tel" inputMode="tel" maxLength={20} autoComplete="tel" placeholder={siteContact.phoneDisplay} value={contactForm.phone} onChange={(event) => updateContactField('phone', event.target.value)} aria-invalid={Boolean(contactErrors.phone)} aria-describedby={contactErrors.phone ? 'contact-phone-error' : undefined} />
                    {contactErrors.phone && <small className="luxury-field-error" id="contact-phone-error">{contactErrors.phone}</small>}
                  </label>
                </div>
                <label className={contactErrors.email ? 'has-error' : ''} htmlFor="contact-email">
                  <span className="luxury-field-label">Email <small>Không bắt buộc</small></span>
                  <input id="contact-email" name="email" type="email" maxLength={160} autoComplete="email" placeholder="email@cuaban.vn" value={contactForm.email} onChange={(event) => updateContactField('email', event.target.value)} aria-invalid={Boolean(contactErrors.email)} aria-describedby={contactErrors.email ? 'contact-email-error' : undefined} />
                  {contactErrors.email && <small className="luxury-field-error" id="contact-email-error">{contactErrors.email}</small>}
                </label>
                <label className={contactErrors.need ? 'has-error' : ''} htmlFor="contact-need">
                  <span className="luxury-field-label">Bạn đang tìm gì? <b>*</b></span>
                  <select id="contact-need" name="need" value={contactForm.need} onChange={(event) => updateContactField('need', event.target.value)} aria-invalid={Boolean(contactErrors.need)} aria-describedby={contactErrors.need ? 'contact-need-error' : undefined}>
                    <option value="" disabled>Chọn nhu cầu tư vấn</option>
                    {contactNeedOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {contactErrors.need && <small className="luxury-field-error" id="contact-need-error">{contactErrors.need}</small>}
                </label>
                <label htmlFor="contact-message">
                  <span className="luxury-field-label">Ghi chú <small>{contactForm.message.length}/1000</small></span>
                  <textarea id="contact-message" name="message" rows={4} maxLength={1000} placeholder="Ví dụ: thích hương gỗ, dùng đi làm, ngân sách khoảng 2 triệu..." value={contactForm.message} onChange={(event) => updateContactField('message', event.target.value)} />
                </label>
                {contactFeedback && (
                  <p className={`luxury-contact-feedback is-${contactFeedback.tone}`} role={contactFeedback.tone === 'error' ? 'alert' : 'status'}>
                    {contactFeedback.message}
                  </p>
                )}
                <button type="submit" className="btn luxury-primary-btn luxury-contact-submit" disabled={contactSubmitting}>
                  {contactSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu tư vấn'}
                </button>
                <p className="luxury-contact-privacy">Thông tin của bạn chỉ được dùng để hỗ trợ tư vấn, không chia sẻ cho bên thứ ba.</p>
              </form>
              <div className="luxury-contact-assurance">
                <div><span>Sản phẩm nổi bật từ</span><strong>{bestPrice}</strong></div>
                <div><span>Thời gian hỗ trợ</span><strong>8:00 - 21:00</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
