import { Phone, MessageCircle, Mail, MapPin, Clock, Truck } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA Card */}
        <div className="relative overflow-hidden rounded-2xl bg-secondary p-8 lg:p-12">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Content */}
            <div>
              <p className="text-sm font-medium text-accent tracking-widest uppercase mb-3">
                Liên hệ ngay
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 text-balance">
                Cần tư vấn?
                <span className="block text-accent">Chúng tôi sẵn sàng hỗ trợ</span>
              </h2>
              <p className="text-muted-foreground mb-8 text-pretty leading-relaxed">
                Đội ngũ chuyên gia nước hoa của HuyPerfume luôn sẵn sàng tư vấn,
                giúp bạn tìm được hương thơm phù hợp nhất với phong cách và sở thích.
              </p>

              {/* Contact options */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <a
                  href="tel:19008888"
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-accent transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hotline</p>
                    <p className="font-serif text-lg font-semibold">1900 8888</p>
                  </div>
                </a>

                <a
                  href="https://zalo.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-accent transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <MessageCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Zalo Chat</p>
                    <p className="font-serif text-lg font-semibold">Nhắn tin ngay</p>
                  </div>
                </a>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/tu-van"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  Đặt lịch tư vấn miễn phí
                </a>
                <a
                  href="/cua-hang"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary font-medium rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Tìm cửa hàng
                </a>
              </div>
            </div>

            {/* Info cards */}
            <div className="space-y-4">
              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Giờ làm việc</h3>
                    <p className="text-sm text-muted-foreground">
                      Thứ 2 - Chủ nhật: 8:00 - 21:00
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hotline hoạt động 24/7
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Giao hàng nhanh</h3>
                    <p className="text-sm text-muted-foreground">
                      Nội thành HCM & Hà Nội: 1-2 giờ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Toàn quốc: 1-3 ngày làm việc
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email hỗ trợ</h3>
                    <p className="text-sm text-muted-foreground">
                      support@huyperfume.vn
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phản hồi trong vòng 2 giờ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
