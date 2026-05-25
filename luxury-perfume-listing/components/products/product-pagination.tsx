'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ProductPagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: ProductPaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsis = totalPages > 7
    
    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    pages.push(1)
    
    if (currentPage > 3) {
      pages.push('...')
    }
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i)
      }
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...')
    }
    
    if (!pages.includes(totalPages)) {
      pages.push(totalPages)
    }
    
    return pages
  }

  return (
    <nav 
      className="flex items-center justify-center gap-1 sm:gap-2" 
      aria-label="Phân trang"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 border-border text-foreground hover:bg-secondary disabled:opacity-50"
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span 
              key={`ellipsis-${index}`} 
              className="px-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="icon"
              onClick={() => onPageChange(page as number)}
              className={cn(
                'h-9 w-9',
                currentPage === page 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'border-border text-foreground hover:bg-secondary'
              )}
              aria-label={`Trang ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          )
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 border-border text-foreground hover:bg-secondary disabled:opacity-50"
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
