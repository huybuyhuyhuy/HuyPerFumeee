"use client";

import { useState } from "react";
import { Heart, ShoppingBag, Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  volume: string;
  image: string;
  badge?: "new" | "bestseller" | "sale";
  rating: number;
}

const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Sauvage Eau de Parfum",
    brand: "Dior",
    price: 3200000,
    volume: "100ml",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=500&auto=format&fit=crop",
    badge: "bestseller",
    rating: 4.9,
  },
  {
    id: "2",
    name: "Bleu de Chanel",
    brand: "Chanel",
    price: 4500000,
    originalPrice: 5000000,
    volume: "100ml",
    image:
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=500&auto=format&fit=crop",
    badge: "sale",
    rating: 4.8,
  },
  {
    id: "3",
    name: "Black Opium",
    brand: "Yves Saint Laurent",
    price: 2800000,
    volume: "90ml",
    image:
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=500&auto=format&fit=crop",
    badge: "new",
    rating: 4.7,
  },
  {
    id: "4",
    name: "Acqua di Gio Profumo",
    brand: "Giorgio Armani",
    price: 2900000,
    volume: "75ml",
    image:
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=500&auto=format&fit=crop",
    rating: 4.8,
  },
  {
    id: "5",
    name: "La Vie Est Belle",
    brand: "Lancôme",
    price: 2600000,
    volume: "75ml",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500&auto=format&fit=crop",
    badge: "bestseller",
    rating: 4.9,
  },
  {
    id: "6",
    name: "Light Blue",
    brand: "Dolce & Gabbana",
    price: 2100000,
    originalPrice: 2400000,
    volume: "100ml",
    image:
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=500&auto=format&fit=crop",
    badge: "sale",
    rating: 4.6,
  },
  {
    id: "7",
    name: "Coco Mademoiselle",
    brand: "Chanel",
    price: 4200000,
    volume: "100ml",
    image:
      "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=500&auto=format&fit=crop",
    rating: 4.9,
  },
  {
    id: "8",
    name: "Aventus",
    brand: "Creed",
    price: 8500000,
    volume: "100ml",
    image:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?q=80&w=500&auto=format&fit=crop",
    badge: "new",
    rating: 5.0,
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const badgeStyles = {
    new: "bg-accent text-accent-foreground",
    bestseller: "bg-primary text-primary-foreground",
    sale: "bg-destructive text-destructive-foreground",
  };

  const badgeLabels = {
    new: "Mới",
    bestseller: "Bán chạy",
    sale: "Giảm giá",
  };

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge */}
        {product.badge && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full ${badgeStyles[product.badge]}`}
          >
            {badgeLabels[product.badge]}
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="absolute top-3 right-3 w-9 h-9 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card transition-colors"
          aria-label="Thêm vào yêu thích"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-destructive text-destructive" : ""
            }`}
          />
        </button>

        {/* Quick actions */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-3 flex gap-2 transition-all duration-300 ${
            isHovered
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <button className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
            <ShoppingBag className="w-4 h-4" />
            Thêm vào giỏ
          </button>
          <button
            className="w-10 h-10 bg-card border border-border rounded-md flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Xem nhanh"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {product.brand}
        </p>

        {/* Name */}
        <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-accent transition-colors">
          {product.name}
        </h3>

        {/* Volume & Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{product.volume}</span>
          <div className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-accent fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <span>{product.rating}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <p className="text-sm font-medium text-accent tracking-widest uppercase mb-3">
              Sản phẩm nổi bật
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-balance">
              Được yêu thích nhất
            </h2>
          </div>
          <a
            href="/san-pham"
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors group"
          >
            Xem tất cả
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
