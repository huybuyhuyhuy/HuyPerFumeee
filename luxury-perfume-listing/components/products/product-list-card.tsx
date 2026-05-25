'use client'

import { Star, ShoppingBag, Eye } from 'lucide-react'
import Image from 'next/image'
import { type Product, formatPrice } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ProductListCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onViewDetail?: (product: Product) => void
}

export function ProductListCard({ product, onAddToCart, onViewDetail }: ProductListCardProps) {
  const getBadgeStyles = (badge: Product['badge']) => {
    switch (badge) {
      case 'bestseller':
        return 'bg-accent text-accent-foreground'
      case 'new':
        return 'bg-primary text-primary-foreground'
      case 'sale':
        return 'bg-destructive text-white'
      default:
        return ''
    }
  }

  const getBadgeLabel = (badge: Product['badge']) => {
    switch (badge) {
      case 'bestseller':
        return 'Best Seller'
      case 'new':
        return 'New'
      case 'sale':
        return 'Sale'
      default:
        return ''
    }
  }

  return (
    <article className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row">
      {/* Image Container */}
      <div className="relative w-full sm:w-48 md:w-56 lg:w-64 aspect-square sm:aspect-auto shrink-0 overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 256px"
        />
        
        {/* Badge */}
        {product.badge && (
          <span className={cn(
            'absolute top-3 left-3 px-3 py-1 text-xs font-medium tracking-wide rounded-full',
            getBadgeStyles(product.badge)
          )}>
            {getBadgeLabel(product.badge)}
          </span>
        )}

        {/* Discount Badge */}
        {product.discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-destructive text-white px-2 py-1 text-xs font-medium rounded-full">
            -{product.discountPercent}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
        <div className="space-y-2">
          {/* Brand */}
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {product.brand}
          </p>

          {/* Name */}
          <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
            {product.name}
          </h3>

          {/* Volume & Scent Family */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{product.volume}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>{product.scentFamily}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>{product.gender}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < Math.floor(product.rating)
                      ? 'fill-accent text-accent'
                      : 'fill-muted text-muted'
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount} đánh giá)
            </span>
            <span className="text-sm text-muted-foreground">
              · Đã bán {product.soldCount}
            </span>
          </div>

          {/* Description placeholder */}
          <p className="text-sm text-muted-foreground line-clamp-2 hidden md:block">
            Hương thơm sang trọng, tinh tế với các tầng hương được phối hợp hoàn hảo. 
            Phù hợp cho những dịp đặc biệt và sử dụng hàng ngày.
          </p>
        </div>

        {/* Bottom: Price & Actions */}
        <div className="flex items-end justify-between gap-4 mt-4 pt-4 border-t border-border">
          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.discountPercent > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.discountPercent > 0 && (
              <p className="text-sm text-destructive font-medium">
                Tiết kiệm {formatPrice(product.originalPrice - product.price)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDetail?.(product)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Xem chi tiết</span>
            </button>
            <button
              onClick={() => onAddToCart?.(product)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
