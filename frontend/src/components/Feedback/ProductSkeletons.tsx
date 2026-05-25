function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`luxury-skeleton ${className}`.trim()} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="col">
      <div className="card h-100 luxury-card overflow-hidden">
        <SkeletonBlock className="luxury-skeleton-media" />
        <div className="card-body p-4">
          <SkeletonBlock className="luxury-skeleton-line w-75 mb-3" />
          <SkeletonBlock className="luxury-skeleton-line w-50 mb-3" />
          <SkeletonBlock className="luxury-skeleton-line w-100 mb-2" />
          <SkeletonBlock className="luxury-skeleton-line w-100" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container luxury-page product-detail-page">
      <div className="row g-4 g-xl-5 align-items-start">
        <div className="col-lg-6">
          <div className="luxury-surface p-3 p-lg-4">
            <SkeletonBlock className="luxury-skeleton-detail-image" />
            <div className="d-grid gap-2 mt-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={index} className="luxury-skeleton-detail-thumb" />
              ))}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="luxury-surface p-4 p-lg-5">
            <SkeletonBlock className="luxury-skeleton-line w-25 mb-4" />
            <SkeletonBlock className="luxury-skeleton-detail-title w-75 mb-3" />
            <SkeletonBlock className="luxury-skeleton-detail-copy w-50 mb-4" />
            <SkeletonBlock className="luxury-skeleton-detail-price mb-4" />
            <SkeletonBlock className="luxury-skeleton-line w-100 mb-2" />
            <SkeletonBlock className="luxury-skeleton-line w-100 mb-2" />
            <SkeletonBlock className="luxury-skeleton-line w-75 mb-4" />
            <div className="luxury-skeleton-detail-actions mb-4">
              <SkeletonBlock className="luxury-skeleton-button" />
              <SkeletonBlock className="luxury-skeleton-button" />
              <SkeletonBlock className="luxury-skeleton-button" />
            </div>
            <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={index} className="luxury-skeleton-detail-tab" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="luxury-skeleton-detail-rail mt-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="luxury-skeleton-detail-card">
            <SkeletonBlock className="luxury-skeleton-media" />
            <div className="p-3">
              <SkeletonBlock className="luxury-skeleton-line w-75 mb-2" />
              <SkeletonBlock className="luxury-skeleton-line w-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
