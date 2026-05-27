import { Link } from 'react-router-dom';
import { siteContact } from '../../config/siteConfig';

const serviceHighlights = [
  { title: 'Chính hãng 100%', detail: 'Nguồn gốc minh bạch' },
  { title: 'Giao hàng toàn quốc', detail: 'Đóng gói chỉn chu' },
  { title: 'Tư vấn theo gu', detail: siteContact.supportHours },
];

const socialLinks = [
  { href: 'https://www.facebook.com/qhuy.29', label: 'Facebook', platform: 'facebook' },
  { href: 'https://www.instagram.com/quochuy29_/', label: 'Instagram', platform: 'instagram' },
  { href: 'https://www.youtube.com/@quochuy4739', label: 'YouTube', platform: 'youtube' },
  { href: `https://zalo.me/${siteContact.phone}`, label: 'Zalo', platform: 'zalo' },
];

function SocialIcon({ platform }: { platform: string }) {
  if (platform === 'facebook') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.5-3h-3.2V8.2c0-.9.4-1.5 1.7-1.5h1.6V4.1c-.3 0-1.1-.1-2.1-.1-3 0-4.8 1.6-4.8 4.5V10H7.7v3h2.6v8z" /></svg>;
  }

  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.6" />
        <circle cx="12" cy="12" r="4" />
        <circle className="luxury-social-dot" cx="16.9" cy="7.2" r="1" />
      </svg>
    );
  }

  if (platform === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.4 7.1c-.3-1-1.1-1.8-2.1-2.1-1.7-.5-6.3-.5-6.3-.5s-4.6 0-6.3.5c-1 .3-1.8 1.1-2.1 2.1-.5 1.8-.5 4.9-.5 4.9s0 3.1.5 4.9c.3 1 1.1 1.8 2.1 2.1 1.7.5 6.3.5 6.3.5s4.6 0 6.3-.5c1-.3 1.8-1.1 2.1-2.1.5-1.8.5-4.9.5-4.9s0-3.1-.5-4.9z" />
        <path className="luxury-social-play" d="m10 15.5 5-3.5-5-3.5z" />
      </svg>
    );
  }

  return <span className="luxury-social-zalo" aria-hidden="true">Zalo</span>;
}

export function Footer() {
  return (
    <footer className="luxury-footer">
      <div className="container luxury-footer-shell">
        <div className="luxury-footer-assurance" aria-label="Cam kết dịch vụ">
          {serviceHighlights.map((item) => (
            <div key={item.title} className="luxury-footer-assurance-item">
              <span className="luxury-footer-assurance-mark" aria-hidden="true" />
              <span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="luxury-footer-grid">
          <div className="luxury-footer-brand">
            <Link to="/home" className="luxury-footer-logo" aria-label="HuyPerfume - Về trang chủ">
              <span className="luxury-footer-logo-mark">
                <img src="/assets/icon/logo.png" alt="" width="42" height="42" loading="lazy" decoding="async" />
              </span>
              <span className="luxury-footer-logo-copy">
                <strong>HuyPerfume</strong>
                <small>Cửa hàng nước hoa cao cấp</small>
              </span>
            </Link>
            <p>
              Boutique nước hoa curated theo phong cách, cảm xúc và độ tinh tế của từng khách hàng.
            </p>
            <div className="luxury-footer-contact-pills" aria-label="Liên hệ nhanh">
              <a href={siteContact.phoneHref}>{siteContact.phoneDisplay}</a>
              <a href={siteContact.emailHref}>{siteContact.email}</a>
            </div>
          </div>

          <nav className="luxury-footer-nav" aria-label="Liên kết chân trang">
            <div>
              <h6>Mua sắm</h6>
              <ul className="list-unstyled luxury-footer-links">
                <li><Link to="/products">Tất cả sản phẩm</Link></li>
                <li><Link to="/products?categoryId=1">Nước hoa nam</Link></li>
                <li><Link to="/products?categoryId=2">Nước hoa nữ</Link></li>
                <li><Link to="/products?categoryId=3">Unisex</Link></li>
              </ul>
            </div>

            <div>
              <h6>Hỗ trợ</h6>
              <ul className="list-unstyled luxury-footer-links">
                <li><Link to="/orders">Tra cứu đơn hàng</Link></li>
                <li><Link to="/cart">Giỏ hàng</Link></li>
                <li><a href={siteContact.emailHref}>Gửi email hỗ trợ</a></li>
                <li><a href={siteContact.phoneHref}>Gọi tư vấn</a></li>
              </ul>
            </div>

            <div>
              <h6>Kết nối</h6>
              <div className="luxury-footer-socials">
                {socialLinks.map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="luxury-social-link">
                    <SocialIcon platform={social.platform} />
                  </a>
                ))}
              </div>
              <p className="luxury-footer-hours">
                <strong>Hỗ trợ khách hàng</strong>
                <span>{siteContact.supportHours}</span>
              </p>
            </div>
          </nav>

          <div className="luxury-footer-newsletter">
            <span className="luxury-footer-eyebrow">Đặc quyền thành viên</span>
            <h3>Nhận tin hương mới và ưu đãi riêng</h3>
            <p>Một email chọn lọc về bộ sưu tập mới và gợi ý quà tặng phù hợp.</p>
            <form className="luxury-newsletter" onSubmit={(event) => event.preventDefault()} aria-label="Đăng ký nhận tin">
              <label htmlFor="newsletter-email" className="luxury-newsletter-label">Email nhận bản tin</label>
              <div className="luxury-newsletter-row">
                <input id="newsletter-email" type="email" placeholder="Email của bạn" required />
                <button type="submit" className="btn luxury-primary-btn">Đăng ký</button>
              </div>
              <small>Không spam. Có thể hủy đăng ký bất cứ lúc nào.</small>
            </form>
          </div>
        </div>

        <div className="luxury-footer-bottom">
          <span>© 2026 HuyPerfume. Đã đăng ký bản quyền.</span>
          <div className="luxury-footer-bottom-notes">
            <span>Thanh toán bảo mật</span>
            <span>Đổi trả minh bạch</span>
            <span>Giao hàng toàn quốc</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
