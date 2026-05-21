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
    <div className="container luxury-page">
      <div className="row g-4 align-items-start">
        <div className="col-lg-6">
          <div className="luxury-surface p-3 p-lg-4">
            <SkeletonBlock className="luxury-skeleton-detail-image" />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="luxury-surface p-4 p-lg-5">
            <SkeletonBlock className="luxury-skeleton-line w-25 mb-4" />
            <SkeletonBlock className="luxury-skeleton-line w-75 mb-3 luxury-skeleton-line-lg" />
            <SkeletonBlock className="luxury-skeleton-line w-50 mb-4" />
            <SkeletonBlock className="luxury-skeleton-line w-100 mb-2" />
            <SkeletonBlock className="luxury-skeleton-line w-100 mb-2" />
            <SkeletonBlock className="luxury-skeleton-line w-75 mb-4" />
            <div className="d-flex gap-3">
              <SkeletonBlock className="luxury-skeleton-button" />
              <SkeletonBlock className="luxury-skeleton-button flex-grow-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
