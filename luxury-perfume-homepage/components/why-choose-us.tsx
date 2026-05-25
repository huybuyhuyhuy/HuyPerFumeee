import { Shield, Truck, Gift, Headphones, RefreshCw, Award } from "lucide-react";

const commitments = [
  {
    icon: Shield,
    title: "Chính hãng 100%",
    description:
      "Cam kết tất cả sản phẩm đều là hàng chính hãng, có tem nhãn đầy đủ từ nhà phân phối.",
  },
  {
    icon: Truck,
    title: "Giao hàng nhanh",
    description:
      "Giao hàng toàn quốc trong 1-3 ngày. Miễn phí vận chuyển cho đơn từ 500.000đ.",
  },
  {
    icon: Gift,
    title: "Đóng gói tinh tế",
    description:
      "Đóng gói cẩn thận như một món quà, kèm túi xách và ribbon cao cấp.",
  },
  {
    icon: Headphones,
    title: "Tư vấn tận tâm",
    description:
      "Đội ngũ tư vấn chuyên nghiệp, hỗ trợ chọn hương phù hợp với phong cách của bạn.",
  },
  {
    icon: RefreshCw,
    title: "Đổi trả dễ dàng",
    description:
      "Đổi trả trong vòng 7 ngày nếu sản phẩm có lỗi hoặc không đúng như mô tả.",
  },
  {
    icon: Award,
    title: "Tích điểm thành viên",
    description:
      "Tích lũy điểm với mỗi đơn hàng, đổi quà tặng và nhận ưu đãi độc quyền.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-sm font-medium text-accent tracking-widest uppercase mb-3">
            Cam kết dịch vụ
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-balance">
            Tại sao chọn HuyPerfume?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto text-pretty">
            Chúng tôi không chỉ bán nước hoa, chúng tôi mang đến trải nghiệm mua
            sắm đẳng cấp với dịch vụ chăm sóc khách hàng tận tâm.
          </p>
        </div>

        {/* Commitments grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {commitments.map((item, index) => (
            <div
              key={index}
              className="group p-6 lg:p-8 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-5 group-hover:bg-accent/30 transition-colors">
                <item.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">
                {item.title}
              </h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
