import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";

const footerLinks = {
  products: {
    title: "Sản phẩm",
    links: [
      { label: "Nước hoa Nam", href: "/nam" },
      { label: "Nước hoa Nữ", href: "/nu" },
      { label: "Unisex", href: "/unisex" },
      { label: "Bán chạy", href: "/ban-chay" },
      { label: "Khuyến mãi", href: "/khuyen-mai" },
    ],
  },
  brands: {
    title: "Thương hiệu",
    links: [
      { label: "Dior", href: "/thuong-hieu/dior" },
      { label: "Chanel", href: "/thuong-hieu/chanel" },
      { label: "Creed", href: "/thuong-hieu/creed" },
      { label: "Tom Ford", href: "/thuong-hieu/tom-ford" },
      { label: "Xem tất cả", href: "/thuong-hieu" },
    ],
  },
  support: {
    title: "Hỗ trợ",
    links: [
      { label: "Hướng dẫn mua hàng", href: "/huong-dan" },
      { label: "Chính sách đổi trả", href: "/chinh-sach-doi-tra" },
      { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
      { label: "Điều khoản sử dụng", href: "/dieu-khoan" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
};

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <a href="/" className="inline-block mb-6">
              <span className="font-serif text-2xl font-semibold tracking-tight">
                Huy<span className="text-accent">Perfume</span>
              </span>
            </a>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6 max-w-md">
              Chuyên cung cấp nước hoa chính hãng từ các thương hiệu nổi tiếng
              thế giới. Cam kết chất lượng, giá tốt và dịch vụ chăm sóc khách
              hàng tận tâm.
            </p>

            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="text-primary-foreground/70">
                  123 Nguyễn Huệ, Quận 1, TP.HCM
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-accent" />
                <span className="text-primary-foreground/70">1900 8888</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-accent" />
                <span className="text-primary-foreground/70">
                  contact@huyperfume.vn
                </span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2026 HuyPerfume. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-6">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png"
              alt="Visa"
              className="h-6 opacity-70"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png"
              alt="Mastercard"
              className="h-6 opacity-70"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
