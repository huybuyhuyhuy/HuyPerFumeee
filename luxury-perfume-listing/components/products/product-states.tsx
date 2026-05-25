'use client'

import { Button } from '@/components/ui/button'
import { SearchX, AlertCircle, RefreshCw, WifiOff, ShieldAlert, ChartNoAxesCombined, PackageX } from 'lucide-react'

interface EmptyStateProps {
  onClearFilters: () => void
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
        <SearchX className="h-8 w-8 text-white/70" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No matching products
      </h3>
      <p className="text-white/50 mb-6 max-w-sm leading-relaxed">
        Try adjusting filters or clearing them to reveal the full catalog.
      </p>
      <Button 
        onClick={onClearFilters}
        className="h-11 rounded-full bg-white/10 text-white hover:bg-white/15"
      >
        Clear filters
      </Button>
    </div>
  )
}

interface ErrorStateProps {
  onRetry: () => void
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
        <AlertCircle className="h-8 w-8 text-red-200" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        We couldn’t load the data
      </h3>
      <p className="text-white/50 mb-6 max-w-sm leading-relaxed">
        The dashboard hit an API issue. Retry or check your network and permissions.
      </p>
      <Button 
        onClick={onRetry}
        className="h-11 rounded-full bg-white/10 text-white hover:bg-white/15"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  )
}

export function OfflineState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
        <WifiOff className="h-8 w-8 text-sky-200" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">You’re offline</h3>
      <p className="text-white/50 mb-6 max-w-sm leading-relaxed">
        We’ll resume live updates once the connection is restored.
      </p>
      <Button onClick={onRetry} className="h-11 rounded-full bg-white/10 text-white hover:bg-white/15">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  )
}

export function PermissionState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
        <ShieldAlert className="h-8 w-8 text-amber-200" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Permission required</h3>
      <p className="text-white/50 mb-6 max-w-sm leading-relaxed">
        Your role doesn’t allow access to this operation yet.
      </p>
      <Button className="h-11 rounded-full bg-white/10 text-white hover:bg-white/15">Request access</Button>
    </div>
  )
}

export function EmptyChartState() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border border-white/8 bg-white/5 px-6 text-center backdrop-blur-xl">
      <ChartNoAxesCombined className="mb-4 h-10 w-10 text-white/35" />
      <h3 className="text-lg font-semibold text-white">No chart data yet</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">
        Once activity comes in, analytics will appear here automatically.
      </p>
    </div>
  )
}

export function EmptyInventoryState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-[1.5rem] border border-white/8 bg-white/5 backdrop-blur-xl">
      <PackageX className="mb-4 h-10 w-10 text-white/35" />
      <h3 className="text-lg font-semibold text-white">Inventory is healthy</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">
        No low-stock alerts at the moment. Everything is within threshold.
      </p>
    </div>
  )
}
