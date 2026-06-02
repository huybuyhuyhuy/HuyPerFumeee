import { Link } from 'react-router-dom';
import { resolveProductImage } from '../../utils/image';
import { formatVnCurrency } from '../../utils/formatters';
import type { Product } from '../../types';

type RelatedProductRailProps = {
  title: string;
  products?: Product[];
};

export function RelatedProductRail({ title, products = [] }: RelatedProductRailProps) {
  if (!products.length) return null;

  return (
    <section className="luxury-surface product-related-section mt-4 product-fade-in is-visible">
      <div className="d-flex align-items-end justify-content-between gap-3 mb-3">
        <div>
          <p className="story-eyebrow mb-2">{title}</p>
          <h2 className="story-subtitle mb-0">Gợi ý dành cho bạn</h2>
        </div>
      </div>
      <div className="related-rail">
        {products.map((product) => {
          const price = product.discountPrice > 0 ? product.discountPrice : product.price;
          return (
            <article key={product.id} className="luxury-discovery-card">
              <Link to={`/products/${product.id}`} className="luxury-discovery-media">
                <img src={resolveProductImage(product.image)} alt={product.name} loading="lazy" decoding="async" />
              </Link>
              <div className="luxury-discovery-body">
                <p className="luxury-product-brand mb-1">{product.brand?.name || 'HuyPerfume'}</p>
                <h3 className="luxury-product-name h6 mb-2">
                  <Link to={`/products/${product.id}`} className="text-decoration-none text-reset">{product.name}</Link>
                </h3>
                <div className="luxury-price-row mb-0">
                  <span className="luxury-price">{formatVnCurrency(price)}</span>
                  {product.discountPrice > 0 && <del>{formatVnCurrency(product.price)}</del>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
