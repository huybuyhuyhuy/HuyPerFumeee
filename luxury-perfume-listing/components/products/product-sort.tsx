'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sortOptions } from '@/lib/mock-data'

interface ProductSortProps {
  value: string
  onValueChange: (value: string) => void
}

export function ProductSort({ value, onValueChange }: ProductSortProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
        Sắp xếp theo:
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 w-[200px] rounded-full border-white/10 bg-white/5 text-white shadow-none hover:bg-white/10 focus:ring-1 focus:ring-white/30">
          <SelectValue placeholder="Chọn cách sắp xếp" />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#111318]/95 text-white backdrop-blur-xl">
          {sortOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="text-white/90 focus:bg-white/10 focus:text-white"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
