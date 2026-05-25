'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { brands, priceRanges, genders, scentFamilies, volumes } from '@/lib/mock-data'

export interface FilterState {
  priceRange: string[]
  brands: string[]
  genders: string[]
  scentFamilies: string[]
  volumes: string[]
}

interface ProductFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  onClearFilters: () => void
  className?: string
}

export function ProductFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  className 
}: ProductFiltersProps) {
  const containerClassName = className ?? 'w-full'
  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0)

  const toggleFilter = (key: keyof FilterState, value: string) => {
    const current = filters[key]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFilterChange({ ...filters, [key]: updated })
  }

  return (
    <aside className={containerClassName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Bộ lọc</h2>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground h-auto py-1 px-2"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Price Range */}
        <FilterSection title="Khoảng giá">
          {priceRanges.map((range) => (
            <FilterCheckbox
              key={range.label}
              label={range.label}
              checked={filters.priceRange.includes(range.label)}
              onCheckedChange={() => toggleFilter('priceRange', range.label)}
            />
          ))}
        </FilterSection>

        {/* Brands */}
        <FilterSection title="Thương hiệu">
          {brands.map((brand) => (
            <FilterCheckbox
              key={brand}
              label={brand}
              checked={filters.brands.includes(brand)}
              onCheckedChange={() => toggleFilter('brands', brand)}
            />
          ))}
        </FilterSection>

        {/* Gender */}
        <FilterSection title="Giới tính">
          {genders.map((gender) => (
            <FilterCheckbox
              key={gender.value}
              label={gender.label}
              checked={filters.genders.includes(gender.value)}
              onCheckedChange={() => toggleFilter('genders', gender.value)}
            />
          ))}
        </FilterSection>

        {/* Scent Family */}
        <FilterSection title="Nhóm hương">
          {scentFamilies.map((scent) => (
            <FilterCheckbox
              key={scent}
              label={scent}
              checked={filters.scentFamilies.includes(scent)}
              onCheckedChange={() => toggleFilter('scentFamilies', scent)}
            />
          ))}
        </FilterSection>

        {/* Volume */}
        <FilterSection title="Dung tích">
          {volumes.map((vol) => (
            <FilterCheckbox
              key={vol}
              label={vol}
              checked={filters.volumes.includes(vol)}
              onCheckedChange={() => toggleFilter('volumes', vol)}
            />
          ))}
        </FilterSection>
      </div>
    </aside>
  )
}

function FilterSection({ 
  title, 
  children 
}: { 
  title: string
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function FilterCheckbox({
  label,
  checked,
  onCheckedChange
}: {
  label: string
  checked: boolean
  onCheckedChange: () => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <Checkbox 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent"
      />
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  )
}
