import { Link } from 'react-router-dom';

const serviceHighlights = [
  { title: 'Chính hãng 100%', detail: 'Nguồn gốc minh bạch' },
  { title: 'Giao hàng toàn quốc', detail: 'Đóng gói chỉn chu' },
  { title: 'Tư vấn theo gu', detail: '8:00 - 21:00 mỗi ngày' },
];

const socialLinks = [
  { href: 'https://facebook.com', label: 'Facebook', icon: '/assets/icon/fb.png' },
  { href: 'https://instagram.com', label: 'Instagram', icon: '/assets/icon/ig.png' },
  { href: 'https://youtube.com', label: 'YouTube', icon: '/assets/icon/yt.png' },
];

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
                <small>Luxury fragrance boutique</small>
              </span>
            </Link>
            <p>
              Boutique nước hoa curated theo phong cách, cảm xúc và độ tinh tế của từng khách hàng.
            </p>
            <div className="luxury-footer-contact-pills" aria-label="Liên hệ nhanh">
              <a href="tel:0900000000">0900 000 000</a>
              <a href="mailto:support@huyperfume.vn">support@huyperfume.vn</a>
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
                <li><a href="mailto:support@huyperfume.vn">Gửi email hỗ trợ</a></li>
                <li><a href="tel:0900000000">Gọi tư vấn</a></li>
              </ul>
            </div>

            <div>
              <h6>Kết nối</h6>
              <div className="luxury-footer-socials">
                {socialLinks.map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="luxury-social-link">
                    <img src={social.icon} alt="" aria-hidden="true" width="20" height="20" loading="lazy" decoding="async" />
                  </a>
                ))}
              </div>
              <p className="luxury-footer-hours">
                <strong>Hỗ trợ khách hàng</strong>
                <span>8:00 - 21:00 mỗi ngày</span>
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
          <span>© 2026 HuyPerfume. All rights reserved.</span>
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
