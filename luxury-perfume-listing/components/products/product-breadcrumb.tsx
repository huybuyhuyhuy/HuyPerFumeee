import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface ProductBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function ProductBreadcrumb({ items }: ProductBreadcrumbProps) {
  return (
    <nav aria-label="Đường dẫn" className="flex items-center gap-1 text-sm">
      <Link 
        href="/" 
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Trang chủ</span>
      </Link>
      
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          {item.href ? (
            <Link 
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
