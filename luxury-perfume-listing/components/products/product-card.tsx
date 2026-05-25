'use client'

import { Star, ShoppingBag, Eye } from 'lucide-react'
import Image from 'next/image'
import { type Product, formatPrice } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onViewDetail?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart, onViewDetail }: ProductCardProps) {
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
    <article className="group relative bg-card rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(0,0,0,0.22)] focus-within:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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

        {/* Hover Actions */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 transition-all duration-300 ease-out">
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetail?.(product)}
              className="flex-1 flex items-center justify-center gap-2 bg-card/95 text-foreground py-2.5 rounded-md text-sm font-medium hover:bg-card transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Xem chi tiết</span>
            </button>
            <button
              onClick={() => onAddToCart?.(product)}
              className="flex items-center justify-center bg-accent text-accent-foreground p-2.5 rounded-md hover:bg-accent/90 transition-colors"
              aria-label="Thêm vào giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Brand */}
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {product.brand}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Volume */}
        <p className="text-sm text-muted-foreground">{product.volume}</p>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3.5 h-3.5',
                  i < Math.floor(product.rating)
                    ? 'fill-accent text-accent'
                    : 'fill-muted text-muted'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
          <span className="text-xs text-muted-foreground">
            · Đã bán {product.soldCount}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
