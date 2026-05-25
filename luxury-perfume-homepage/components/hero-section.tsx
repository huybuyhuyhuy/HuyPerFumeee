"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const heroProducts = [
  {
    id: 1,
    name: "Chanel N°5",
    brand: "CHANEL",
    tagline: "Huyền thoại vượt thời gian",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop",
    badge: "Best Seller",
  },
  {
    id: 2,
    name: "Sauvage Elixir",
    brand: "DIOR",
    tagline: "Sức hút nam tính đầy mạnh mẽ",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop",
    badge: "Mới về",
  },
  {
    id: 3,
    name: "Black Opium",
    brand: "YSL",
    tagline: "Quyến rũ và bí ẩn",
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop",
    badge: "Hot",
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const goToSlide = useCallback((index: number, dir: "left" | "right") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    const newIndex = (currentIndex + 1) % heroProducts.length;
    goToSlide(newIndex, "right");
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    const newIndex = (currentIndex - 1 + heroProducts.length) % heroProducts.length;
    goToSlide(newIndex, "left");
  }, [currentIndex, goToSlide]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const currentProduct = heroProducts[currentIndex];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 lg:pt-32 pb-16 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent text-sm font-medium rounded-full animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Bộ sưu tập 2026
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-tight text-balance">
                Khẳng định phong cách
                <span className="block text-accent">riêng của bạn</span>
              </h1>
            </div>

            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 text-pretty leading-relaxed">
              Chính hãng 100% — Tuyển chọn kỹ lưỡng — Đóng gói tinh tế.
              Trải nghiệm hương thơm đẳng cấp từ những thương hiệu nước hoa hàng đầu thế giới.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="/san-pham"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-lg"
              >
                Khám phá ngay
                <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href="/tu-van"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary text-primary font-medium rounded-md hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
              >
                Tư vấn miễn phí
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <p className="font-serif text-3xl lg:text-4xl font-semibold text-accent">
                  500+
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sản phẩm chính hãng
                </p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-serif text-3xl lg:text-4xl font-semibold text-accent">
                  50+
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Thương hiệu cao cấp
                </p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-serif text-3xl lg:text-4xl font-semibold text-accent">
                  10K+
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Khách hàng tin tưởng
                </p>
              </div>
            </div>
          </div>

          {/* Hero Image Carousel with Animations */}
          <div className="relative group">
            {/* Orbiting particles around the image */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Orbit ring */}
              <div className="absolute inset-[-20px] border border-accent/20 rounded-full animate-spin-slow opacity-40" />
              <div className="absolute inset-[-40px] border border-dashed border-accent/10 rounded-full animate-spin-reverse opacity-30" />
              
              {/* Orbiting dots */}
              <div className="absolute inset-[-20px] animate-spin-slow">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full shadow-lg shadow-accent/50" />
              </div>
              <div className="absolute inset-[-40px] animate-spin-reverse">
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-accent/70 rounded-full" />
              </div>
              <div className="absolute inset-[-30px] animate-spin-slow" style={{ animationDuration: "15s" }}>
                <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-accent/50 rounded-full" />
              </div>
            </div>

            {/* Glow effect behind image */}
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 via-transparent to-accent/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Main image container */}
            <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-2xl overflow-hidden bg-secondary">
              {/* Product images with slide animation */}
              {heroProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`absolute inset-0 transition-all duration-600 ease-out ${
                    index === currentIndex
                      ? "opacity-100 translate-x-0 scale-100"
                      : index < currentIndex || (currentIndex === 0 && index === heroProducts.length - 1 && direction === "left")
                      ? "opacity-0 -translate-x-full scale-95"
                      : "opacity-0 translate-x-full scale-95"
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Product info overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6">
                    <p className="text-white/70 text-sm font-medium tracking-wider">{product.brand}</p>
                    <h3 className="text-white font-serif text-2xl lg:text-3xl font-semibold mt-1">{product.name}</h3>
                    <p className="text-white/80 text-sm mt-1">{product.tagline}</p>
                  </div>
                </div>
              ))}
              
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
              
              {/* Elegant border frame */}
              <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none" />
              
              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-accent/60 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-accent/60 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-accent/60 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-accent/60 rounded-br-lg" />

              {/* Navigation arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Sản phẩm trước"
              >
                <ChevronLeft className="w-5 h-5 text-primary" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Sản phẩm tiếp theo"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Slide indicators */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {heroProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index, index > currentIndex ? "right" : "left")}
                  className={`transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 h-2 bg-accent rounded-full"
                      : "w-2 h-2 bg-accent/30 hover:bg-accent/50 rounded-full"
                  }`}
                  aria-label={`Đến slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-accent rounded-full animate-bounce-slow opacity-60" />
            <div className="absolute top-1/4 -right-4 w-2 h-2 bg-accent/80 rounded-full animate-bounce-slow delay-300" />
            <div className="absolute bottom-1/3 -left-3 w-2 h-2 bg-accent/60 rounded-full animate-bounce-slow delay-700" />

            {/* Floating badge with animation */}
            <div className="absolute -bottom-6 -left-6 lg:-left-12 bg-card p-6 rounded-xl shadow-xl border border-border animate-float-delayed hover:shadow-2xl transition-shadow z-20">
              <p className="text-sm text-muted-foreground">Đánh giá từ khách hàng</p>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-accent fill-current animate-star-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="font-serif text-2xl font-semibold mt-2">4.9/5</p>
              <p className="text-sm text-muted-foreground">2,500+ đánh giá</p>
            </div>

            {/* Dynamic badge based on current product */}
            <div className="absolute -top-4 -right-4 lg:-right-8 bg-accent text-white px-4 py-2 rounded-full shadow-lg animate-float-delayed-2 z-20">
              <p className="text-sm font-medium flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {currentProduct.badge}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
