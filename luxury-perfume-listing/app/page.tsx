'use client'

import { useState, useMemo } from 'react'
import { products, type Product } from '@/lib/mock-data'
import { ProductBreadcrumb } from '@/components/products/product-breadcrumb'
import { ProductHeader } from '@/components/products/product-header'
import { ProductFilters, type FilterState } from '@/components/products/product-filters'
import { MobileFilters } from '@/components/products/mobile-filters'
import { ProductSort } from '@/components/products/product-sort'
import { ProductCard } from '@/components/products/product-card'
import { ProductGridSkeleton } from '@/components/products/product-skeleton'
import { ProductPagination } from '@/components/products/product-pagination'
import { EmptyState, ErrorState, OfflineState, PermissionState, EmptyChartState, EmptyInventoryState } from '@/components/products/product-states'
import { Bell, Search, LayoutGrid, LayoutSidebarLeft, ChevronLeft, ChevronRight, Plus, ArrowUpRight, UserCircle2, Command, Sparkles, TrendingUp, Package, Users, ShoppingBag, AlertTriangle, Clock3, BadgeInfo, RefreshCcw, PackageX, CheckCircle2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts'

type ViewState = 'loading' | 'error' | 'success'

const PRODUCTS_PER_PAGE = 8

const emptyFilters: FilterState = {
  priceRange: [],
  brands: [],
  genders: [],
  scentFamilies: [],
  volumes: []
}

export default function ProductListingPage() {
  // State
  const [viewState, setViewState] = useState<ViewState>('success')
  const [connectionState] = useState<'online' | 'offline'>('online')
  const [permissionState] = useState<'allowed' | 'restricted'>('allowed')
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [query, setQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // Calculate active filter count
  const activeFilterCount = useMemo(() => 
    Object.values(filters).reduce((acc, arr) => acc + arr.length, 0),
    [filters]
  )

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase()
      if (normalizedQuery) {
        const haystack = `${product.name} ${product.brand} ${product.scentFamily} ${product.gender}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }

      // Price range filter
      if (filters.priceRange.length > 0) {
        const matchesPrice = filters.priceRange.some((range) => {
          if (range === 'Dưới 500.000đ') return product.price < 500000
          if (range === '500.000đ - 1.000.000đ') return product.price >= 500000 && product.price <= 1000000
          if (range === '1.000.000đ - 2.000.000đ') return product.price >= 1000000 && product.price <= 2000000
          if (range === 'Trên 2.000.000đ') return product.price > 2000000
          return true
        })
        if (!matchesPrice) return false
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false
      }

      // Gender filter
      if (filters.genders.length > 0 && !filters.genders.includes(product.gender)) {
        return false
      }

      // Scent family filter
      if (filters.scentFamilies.length > 0 && !filters.scentFamilies.includes(product.scentFamily)) {
        return false
      }

      // Volume filter
      if (filters.volumes.length > 0 && !filters.volumes.includes(product.volume)) {
        return false
      }

      return true
    })
  }, [filters])

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price)
      case 'bestseller':
        return sorted.sort((a, b) => b.soldCount - a.soldCount)
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating)
      case 'newest':
      default:
        return sorted
    }
  }, [filteredProducts, sortBy])

  // KPI data
  const totalRevenue = useMemo(() => filteredProducts.reduce((sum, product) => sum + product.price, 0), [filteredProducts])
  const totalReviews = useMemo(() => filteredProducts.reduce((sum, product) => sum + product.reviewCount, 0), [filteredProducts])
  const averageRating = useMemo(() => {
    if (filteredProducts.length === 0) return 0
    return filteredProducts.reduce((sum, product) => sum + product.rating, 0) / filteredProducts.length
  }, [filteredProducts])

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE)
  const allVisibleSelected = paginatedProducts.length > 0 && paginatedProducts.every((product) => selectedRows.includes(product.id))
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE
    return sortedProducts.slice(start, start + PRODUCTS_PER_PAGE)
  }, [sortedProducts, currentPage])

  const chartData = [
    { label: 'Mon', revenue: 42, orders: 18, inventory: 66, customers: 14 },
    { label: 'Tue', revenue: 48, orders: 22, inventory: 62, customers: 16 },
    { label: 'Wed', revenue: 45, orders: 20, inventory: 60, customers: 18 },
    { label: 'Thu', revenue: 58, orders: 27, inventory: 56, customers: 21 },
    { label: 'Fri', revenue: 64, orders: 30, inventory: 52, customers: 24 },
    { label: 'Sat', revenue: 71, orders: 34, inventory: 48, customers: 29 },
    { label: 'Sun', revenue: 67, orders: 31, inventory: 45, customers: 27 },
  ]

  const alerts = [
    { id: 'low-stock', type: 'critical', title: 'Low stock alert', description: '3 products are below minimum threshold.', time: '2m ago', icon: PackageX, action: 'Reorder now' },
    { id: 'pending-orders', type: 'medium', title: 'Pending orders', description: '12 orders are waiting for fulfillment.', time: '14m ago', icon: Clock3, action: 'Review queue' },
    { id: 'failed-payment', type: 'critical', title: 'Failed payment', description: '2 payments require manual follow-up.', time: '27m ago', icon: AlertTriangle, action: 'Resolve payment' },
    { id: 'refund-request', type: 'info', title: 'Refund request', description: '1 customer requested a refund review.', time: '1h ago', icon: RefreshCcw, action: 'Open case' },
    { id: 'product-issue', type: 'medium', title: 'Product issue', description: '1 SKU reported packaging damage.', time: '3h ago', icon: BadgeInfo, action: 'Inspect item' },
  ]

  const alertGroups = [
    { label: 'Critical', count: alerts.filter((item) => item.type === 'critical').length, tone: 'border-red-400/20 bg-red-400/10 text-red-200' },
    { label: 'Medium', count: alerts.filter((item) => item.type === 'medium').length, tone: 'border-amber-400/20 bg-amber-400/10 text-amber-200' },
    { label: 'Info', count: alerts.filter((item) => item.type === 'info').length, tone: 'border-sky-400/20 bg-sky-400/10 text-sky-200' },
  ]

  const kpiCards = [
    {
      label: 'Revenue',
      value: `${(totalRevenue / 1000000).toFixed(1)}M`,
      delta: '+12.8%',
      trend: 'up',
      note: 'Tổng giá trị danh mục hiện tại',
      spark: [18, 24, 20, 30, 28, 34, 40],
      icon: TrendingUp,
    },
    {
      label: 'Products',
      value: sortedProducts.length.toString().padStart(2, '0'),
      delta: '+4.1%',
      trend: 'up',
      note: 'Sản phẩm đang hiển thị',
      spark: [10, 14, 12, 18, 16, 20, 22],
      icon: Package,
    },
    {
      label: 'Reviews',
      value: totalReviews.toLocaleString('vi-VN'),
      delta: '+8.4%',
      trend: 'up',
      note: 'Tổng phản hồi khách hàng',
      spark: [8, 10, 12, 15, 14, 18, 20],
      icon: Users,
    },
    {
      label: 'Avg rating',
      value: averageRating ? averageRating.toFixed(1) : '0.0',
      delta: '+0.2',
      trend: 'up',
      note: 'Điểm đánh giá trung bình',
      spark: [14, 16, 15, 17, 19, 18, 20],
      icon: ShoppingBag,
    },
  ]

  // Handlers
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const handleAddToCart = (product: Product) => {
    console.log('[v0] Add to cart:', product.name)
    // Implement cart logic here
  }

  const handleViewDetail = (product: Product) => {
    console.log('[v0] View detail:', product.name)
    // Implement navigation logic here
  }

  const handleRetry = () => {
    setViewState('loading')
    // Simulate retry
    setTimeout(() => setViewState('success'), 1000)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleRow = (productId: string) => {
    setSelectedRows((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])
  }

  const toggleVisibleRows = () => {
    if (allVisibleSelected) {
      setSelectedRows((current) => current.filter((id) => !paginatedProducts.some((product) => product.id === id)))
      return
    }
    setSelectedRows((current) => Array.from(new Set([...current, ...paginatedProducts.map((product) => product.id)])))
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#0f1115_0%,#111318_100%)] text-foreground">
      <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="sticky top-4 z-30 mb-6 rounded-[1.75rem] border border-white/8 bg-black/20 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-5 lg:px-6 py-3.5 sm:py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden md:flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-white/80">
                <Command className="h-3.5 w-3.5" />
                Ctrl K
              </div>
              <div className="relative hidden md:block w-[min(42vw,520px)]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  aria-label="Tìm kiếm sản phẩm hoặc đơn hàng"
                  placeholder="Search products, orders, customers..."
                  className="h-11 rounded-full border-white/8 bg-white/6 pl-10 text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-white/30"
                />
              </div>
            </div>

              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-white/8 bg-white/5 text-white hover:bg-white/10">
                <Bell className="h-4.5 w-4.5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-10 w-10 rounded-full border border-white/8 bg-white/5 text-white hover:bg-white/10">
                <Plus className="h-4.5 w-4.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full border border-white/8 bg-white/5 px-2.5 py-1.5 text-left text-white hover:bg-white/10 transition-colors">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src="/images/admin-avatar.png" alt="Admin" />
                      <AvatarFallback className="bg-white/10 text-white">AD</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block leading-tight">
                      <div className="text-sm font-medium">Admin</div>
                      <div className="text-[11px] text-white/50">Control center</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#111318]/95 text-white backdrop-blur-xl">
                  <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem>View profile</DropdownMenuItem>
                  <DropdownMenuItem>Preferences</DropdownMenuItem>
                  <DropdownMenuItem>Notifications</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-red-300 focus:text-red-300">Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.22)] overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 lg:pt-8">
            <ProductBreadcrumb 
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Sản phẩm' }
              ]} 
            />
            <div className="mt-4 sm:mt-6">
              <ProductHeader totalProducts={sortedProducts.length} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[1.35rem] border border-white/8 bg-white/5 p-3 sm:p-4 backdrop-blur-xl">
              <Button variant="outline" className="h-11 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 active:scale-[0.98]" onClick={toggleVisibleRows}>
                {allVisibleSelected ? 'Unselect visible' : 'Select visible'}
              </Button>
              <Button variant="outline" className="h-11 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 active:scale-[0.98]">
                Bulk actions
              </Button>
              <span className="text-sm text-white/45">Selected {selectedRows.length}</span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              {kpiCards.map((card) => (
                <article key={card.label} className="group rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-transform duration-300 ease-out hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{card.label}</p>
                      <div className="mt-2 flex items-end gap-2">
                        <h3 className="text-3xl sm:text-4xl font-semibold text-white tracking-[-0.04em]">{card.value}</h3>
                        <span className={cn('mb-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium', card.trend === 'up' ? 'bg-emerald-400/12 text-emerald-300' : 'bg-red-400/12 text-red-300')}>
                          <ArrowUpRight className={cn('h-3 w-3', card.trend === 'down' && 'rotate-180')} />
                          {card.delta}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
                      {card.label === 'Revenue' && <Sparkles className="h-4 w-4" />}
                      {card.label === 'Products' && <LayoutGrid className="h-4 w-4" />}
                      {card.label === 'Reviews' && <UserCircle2 className="h-4 w-4" />}
                      {card.label === 'Avg rating' && <Bell className="h-4 w-4" />}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/50">{card.note}</p>
                  <div className="mt-4 flex items-end gap-1.5 h-10">
                    {card.spark.map((bar, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-full bg-gradient-to-t from-white/15 to-white/55"
                        style={{ height: `${bar}%` }}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5 sm:gap-6">
              <section className="rounded-[1.75rem] border border-white/8 bg-white/5 p-4 sm:p-5 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45 mb-2">Action center</p>
                    <h3 className="text-xl sm:text-2xl text-white tracking-[-0.03em]">Real operational alerts</h3>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-white/65">
                    <Filter className="h-3.5 w-3.5" />
                    Grouped live feed
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  {alertGroups.map((group) => (
                    <div key={group.label} className={cn('rounded-2xl border px-3 py-3 text-sm backdrop-blur-xl', group.tone)}>
                      <p className="text-[11px] uppercase tracking-[0.22em] opacity-80">{group.label}</p>
                      <strong className="mt-1 block text-2xl tracking-[-0.03em]">{group.count}</strong>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3">
                  {alerts.map((alert) => {
                    const Icon = alert.icon
                    const severityStyles = alert.type === 'critical'
                      ? 'border-red-400/20 bg-red-400/10 text-red-100'
                      : alert.type === 'medium'
                        ? 'border-amber-400/20 bg-amber-400/10 text-amber-100'
                        : 'border-sky-400/20 bg-sky-400/10 text-sky-100'
                    return (
                      <article key={alert.id} className={cn('group rounded-[1.35rem] border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8', severityStyles)}>
                        <div className="flex items-start gap-3">
                          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5', alert.type === 'critical' ? 'text-red-200' : alert.type === 'medium' ? 'text-amber-200' : 'text-sky-200')}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h4 className="text-base font-semibold text-white">{alert.title}</h4>
                                <p className="mt-1 text-sm text-white/60 leading-6">{alert.description}</p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">{alert.time}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Priority: {alert.type}</p>
                              <Button variant="ghost" className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10">{alert.action}</Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className="grid gap-5 sm:gap-6">
                <article className="rounded-[1.75rem] border border-white/8 bg-white/5 p-4 sm:p-5 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45 mb-2">Timeline</p>
                      <h3 className="text-xl text-white tracking-[-0.03em]">Operational event feed</h3>
                    </div>
                    <CheckCircle2 className="h-4.5 w-4.5 text-white/55" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { time: '09:20', title: 'Low stock detected', desc: '3 SKUs entered critical threshold.' },
                      { time: '09:48', title: 'Pending queue updated', desc: '12 orders moved to fulfillment review.' },
                      { time: '10:15', title: 'Payment issue flagged', desc: '2 failed transactions require follow-up.' },
                      { time: '10:42', title: 'Refund request opened', desc: '1 customer case added to support queue.' },
                    ].map((item) => (
                      <div key={item.time} className="flex gap-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/80" />
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-medium text-white">{item.title}</h4>
                            <span className="text-[11px] text-white/45">{item.time}</span>
                          </div>
                          <p className="mt-1 text-sm text-white/55">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[1.75rem] border border-white/8 bg-white/5 p-4 sm:p-5 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45 mb-2">Smart actions</p>
                      <h3 className="text-xl text-white tracking-[-0.03em]">Suggested next steps</h3>
                    </div>
                    <BadgeInfo className="h-4.5 w-4.5 text-white/55" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { title: 'Reorder low stock', desc: 'Create purchase order for critical SKUs.' },
                      { title: 'Review failed payments', desc: 'Open payment reconciliation panel.' },
                      { title: 'Process refunds', desc: 'Batch handle pending refund requests.' },
                      { title: 'Inspect product issues', desc: 'Escalate damaged packaging cases.' },
                    ].map((item) => (
                      <button key={item.title} className="rounded-2xl border border-white/8 bg-black/10 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-white/55 leading-6">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </article>
              </section>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
              <aside className="hidden lg:block sticky top-28 self-start">
                <div className="rounded-[1.75rem] border border-white/8 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl p-4">
                  <ProductFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    className="w-full"
                  />
                </div>
              </aside>

              <section className="min-w-0">
                <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8">
                  <div className="flex flex-wrap items-center gap-3 justify-between rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-3 sm:px-5 sm:py-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <MobileFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        activeFilterCount={activeFilterCount}
                      />
                      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-primary/80" />
                        <span>{activeFilterCount} bộ lọc đang áp dụng</span>
                      </div>
                    </div>
                    <ProductSort value={sortBy} onValueChange={setSortBy} />
                  </div>
                </div>

                {viewState === 'loading' && (
                  <ProductGridSkeleton count={PRODUCTS_PER_PAGE} />
                )}

                {viewState === 'error' && (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-6">
                    <ErrorState onRetry={handleRetry} />
                  </div>
                )}

                {viewState === 'success' && (
                  <>
                    {paginatedProducts.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-6">
                        <EmptyState onClearFilters={handleClearFilters} />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          {paginatedProducts.map((product) => (
                            <div key={product.id} className="group rounded-[1.35rem] border border-white/8 bg-white/5 p-3 sm:p-4 backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.14)] transition-all duration-300 hover:bg-white/8 hover:-translate-y-0.5">
                              <div className="flex items-start gap-3 sm:gap-4">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(product.id)}
                                  onChange={() => toggleRow(product.id)}
                                  className="mt-2 h-4 w-4 rounded border-white/20 bg-transparent text-primary focus:ring-1 focus:ring-white/30"
                                  aria-label={`Select ${product.name}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <ProductCard
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onViewDetail={handleViewDetail}
                                  />
                                </div>
                                <div className="hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10">
                                    <ArrowUpRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {totalPages > 1 && (
                          <div className="mt-8 sm:mt-12 rounded-[1.35rem] border border-white/8 bg-white/5 p-4 sm:p-5 backdrop-blur-xl">
                            <ProductPagination
                              currentPage={currentPage}
                              totalPages={totalPages}
                              onPageChange={handlePageChange}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
