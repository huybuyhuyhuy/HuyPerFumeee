'use client'

import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center border border-border rounded-lg overflow-hidden', className)}>
      <button
        onClick={() => onChange('grid')}
        className={cn(
          'flex items-center justify-center p-2 transition-colors',
          value === 'grid' 
            ? 'bg-accent text-accent-foreground' 
            : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Xem dạng lưới"
        aria-pressed={value === 'grid'}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={cn(
          'flex items-center justify-center p-2 transition-colors',
          value === 'list' 
            ? 'bg-accent text-accent-foreground' 
            : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Xem dạng danh sách"
        aria-pressed={value === 'list'}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}
