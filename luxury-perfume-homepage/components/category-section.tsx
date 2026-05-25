import { ArrowRight } from "lucide-react";

const categories = [
  {
    id: "nam",
    title: "Nam",
    description: "Mạnh mẽ & Lịch lãm",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop",
    count: "120+ sản phẩm",
  },
  {
    id: "nu",
    title: "Nữ",
    description: "Quyến rũ & Thanh lịch",
    image:
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop",
    count: "180+ sản phẩm",
  },
  {
    id: "unisex",
    title: "Unisex",
    description: "Độc đáo & Cá tính",
    image:
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop",
    count: "80+ sản phẩm",
  },
  {
    id: "qua-tang",
    title: "Quà Tặng Cao Cấp",
    description: "Gift Sets đặc biệt",
    image:
      "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=600&auto=format&fit=crop",
    count: "50+ bộ quà",
  },
  {
    id: "ban-chay",
    title: "Bán Chạy",
    description: "Top yêu thích",
    image:
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=600&auto=format&fit=crop",
    count: "Top 50",
  },
];

export function CategorySection() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-sm font-medium text-accent tracking-widest uppercase mb-3">
            Danh mục
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-balance">
            Khám phá theo phong cách
          </h2>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <a
              key={category.id}
              href={`/${category.id}`}
              className={`group relative overflow-hidden rounded-xl ${
                index === 0 || index === 1
                  ? "col-span-1 lg:col-span-1"
                  : "col-span-1"
              }`}
            >
              <div className="aspect-[3/4] lg:aspect-[2/3]">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end text-primary-foreground">
                  <p className="text-xs lg:text-sm opacity-80 mb-1">
                    {category.count}
                  </p>
                  <h3 className="font-serif text-lg lg:text-xl font-semibold mb-1">
                    {category.title}
                  </h3>
                  <p className="text-xs lg:text-sm opacity-80 hidden sm:block">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-sm font-medium opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                    <span>Xem ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
