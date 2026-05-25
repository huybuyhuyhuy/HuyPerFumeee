'use client'

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'
import { ProductFilters, type FilterState } from './product-filters'
import { cn } from '@/lib/utils'

interface MobileFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  onClearFilters: () => void
  activeFilterCount: number
}

export function MobileFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  activeFilterCount
}: MobileFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="lg:hidden h-11 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-y-auto border-white/10 bg-[#111318]/95 text-white backdrop-blur-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-white">Bộ lọc sản phẩm</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <ProductFilters
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
