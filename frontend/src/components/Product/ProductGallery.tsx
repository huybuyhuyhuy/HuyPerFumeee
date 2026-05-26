import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { Product } from '../../types';
import { resolveProductImage } from '../../utils/image';

function getGalleryImages(product: Product) {
  const apiImages = Array.isArray(product.images) ? product.images : [];
  const rawImages = [product.image, ...apiImages].filter(Boolean);
  const uniqueImages = [...new Set(rawImages.map((image) => resolveProductImage(image)))];
  return uniqueImages.length ? uniqueImages : [resolveProductImage(null)];
}

export function ProductGallery({ product }: { product: Product }) {
  const images = useMemo(() => getGalleryImages(product), [product]);
  const [activeImage, setActiveImage] = useState(images[0]);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

  useEffect(() => {
    setActiveImage(images[0]);
  }, [images]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  return (
    <div className="luxury-surface p-3 p-lg-4">
      <div
        className="product-gallery-stage"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomOrigin('50% 50%')}
      >
        <img
          src={activeImage}
          alt={product.name}
          className="product-gallery-image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          style={{ transformOrigin: zoomOrigin }}
        />
      </div>
      <div className="product-gallery-thumbs mt-3">
        {images.map((image) => (
          <button
            type="button"
            key={image}
            className={`product-gallery-thumb ${image === activeImage ? 'active' : ''}`}
            onClick={() => setActiveImage(image)}
            aria-label={`Xem ảnh ${product.name}`}
          >
            <img src={image} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
}
