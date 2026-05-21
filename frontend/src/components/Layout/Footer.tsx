import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="luxury-footer mt-5">
      <div className="container py-5">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img src="/assets/icon/logo.png" alt="HuyPerfume" width="36" height="36" />
              <h5 className="mb-0">HuyPerfume</h5>
            </div>
            <p className="luxury-muted mb-3">
              Nước hoa chính hãng được tuyển chọn tinh tế, đóng gói chỉn chu và tư vấn theo phong cách riêng của từng khách hàng.
            </p>
            <div className="luxury-contact-list">
              <span>Email: support@huyperfume.vn</span>
              <span>Hotline: 0900 000 000</span>
              <span>Địa chỉ: Huế, Việt Nam</span>
            </div>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="mb-3">Mua sắm</h6>
            <ul className="list-unstyled luxury-footer-links">
              <li><Link to="/products">Tất cả sản phẩm</Link></li>
              <li><Link to="/products?categoryId=1">Nước hoa nam</Link></li>
              <li><Link to="/products?categoryId=2">Nước hoa nữ</Link></li>
              <li><Link to="/products?categoryId=3">Unisex</Link></li>
            </ul>
          </div>

          <div className="col-6 col-lg-3">
            <h6 className="mb-3">Hỗ trợ</h6>
            <ul className="list-unstyled luxury-footer-links">
              <li><a href="mailto:support@huyperfume.vn">support@huyperfume.vn</a></li>
              <li><a href="tel:0900000000">0900 000 000</a></li>
              <li><Link to="/orders">Tra cứu đơn hàng</Link></li>
              <li><Link to="/cart">Giỏ hàng</Link></li>
            </ul>
          </div>

          <div className="col-lg-3">
            <h6 className="mb-3">Kết nối</h6>
            <div className="d-flex gap-3 mb-4">
              <img src="/assets/icon/fb.png" alt="Facebook" width="32" height="32" loading="lazy" decoding="async" />
              <img src="/assets/icon/ig.png" alt="Instagram" width="32" height="32" loading="lazy" decoding="async" />
              <img src="/assets/icon/yt.png" alt="YouTube" width="32" height="32" loading="lazy" decoding="async" />
            </div>
            <p className="luxury-muted small mb-0">© 2026 HuyPerfume. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
