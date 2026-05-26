import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveProductImage } from '../../utils/image';

type ProductGalleryProps = {
  product: {
    name?: string;
    image?: string;
    images?: string[];
  };
};

function getTouchPoint(event: React.TouchEvent) {
  return event.touches[0]?.clientX ?? 0;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const gallery = useMemo(() => {
    const items = [product.image, ...(product.images || [])]
      .map((image) => resolveProductImage(image))
      .filter((image, index, arr) => Boolean(image) && arr.indexOf(image) === index);

    return items.length > 0 ? items : [resolveProductImage(null)];
  }, [product.image, product.images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const activeImage = gallery[activeIndex] || gallery[0];
  const hasMultipleImages = gallery.length > 1;

  useEffect(() => {
    setActiveIndex(0);
    setIsLoaded(false);
    setOffset({ x: 0, y: 0 });
  }, [gallery.join('|')]);

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [activeImage]);

  const goTo = (index: number) => {
    const next = (index + gallery.length) % gallery.length;
    setActiveIndex(next);
    setIsLoaded(false);
    setOffset({ x: 0, y: 0 });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!zooming || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setOffset({ x: (x - 0.5) * 8, y: (y - 0.5) * 8 });
  };

  return (
    <section className="luxury-surface product-gallery-shell product-gallery-premium">
      <div
        ref={frameRef}
        className={`product-gallery-main ${isLoaded ? 'is-loaded' : 'is-loading'} ${isFullscreen ? 'is-fullscreen' : ''}`}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => {
          setZooming(false);
          setOffset({ x: 0, y: 0 });
        }}
        onMouseMove={(event) => handleMove(event.clientX, event.clientY)}
        onTouchStart={(event) => setTouchStartX(getTouchPoint(event))}
        onTouchMove={(event) => {
          const currentX = getTouchPoint(event);
          if (touchStartX === null) return;
          const diff = currentX - touchStartX;
          if (Math.abs(diff) > 48) {
            goTo(activeIndex + (diff < 0 ? 1 : -1));
            setTouchStartX(currentX);
          }
        }}
        onTouchEnd={() => setTouchStartX(null)}
        onClick={() => setIsFullscreen((value) => !value)}
      >
        <div className="product-gallery-shimmer" aria-hidden="true" />
        <img
          ref={imageRef}
          src={activeImage}
          alt={product.name || 'Hình ảnh sản phẩm'}
          className="product-gallery-image"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          style={{ transform: `scale(${zooming ? 1.08 : 1}) translate(${offset.x}px, ${offset.y}px)` }}
        />

        <div className="product-gallery-hero-copy">
          <span>Khám phá chi tiết</span>
          <strong>{product.name || 'Nước hoa tuyển chọn'}</strong>
        </div>

        <button
          type="button"
          className="product-gallery-fullscreen-btn"
          aria-label={`Phóng to ảnh ${product.name || 'sản phẩm'}`}
          onClick={(event) => { event.stopPropagation(); setIsFullscreen(true); }}
        >
          Phóng to
        </button>
      </div>

      {hasMultipleImages ? (
        <div className="product-gallery-controls">
          <button type="button" className="product-gallery-nav" onClick={() => goTo(activeIndex - 1)} aria-label="Ảnh trước">
            ←
          </button>
          <div className="product-gallery-counter">
            {String(activeIndex + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
          </div>
          <button type="button" className="product-gallery-nav" onClick={() => goTo(activeIndex + 1)} aria-label="Ảnh tiếp theo">
            →
          </button>
        </div>
      ) : (
        <p className="product-gallery-hint">Di chuột để xem kỹ chi tiết sản phẩm</p>
      )}

      {hasMultipleImages && (
        <div className="product-gallery-thumbs" role="list" aria-label="Thư viện hình ảnh sản phẩm">
          {gallery.map((image, index) => (
            <button
              key={image}
              type="button"
              className={`product-gallery-thumb ${index === activeIndex ? 'active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              <img src={image} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      {isFullscreen && (
        <div className="product-gallery-modal" role="dialog" aria-modal="true" aria-label="Ảnh sản phẩm phóng to" onClick={() => setIsFullscreen(false)}>
          <button type="button" className="product-gallery-modal-close" aria-label="Đóng ảnh phóng to" onClick={() => setIsFullscreen(false)}>
            Đóng
          </button>
          <img src={activeImage} alt={product.name || 'Hình ảnh sản phẩm'} className="product-gallery-modal-image" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </section>
  );
}
