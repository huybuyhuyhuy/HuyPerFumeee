import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { ProductCard } from '../components/Product/ProductCard.jsx';
import { useToast } from '../store/ToastContext';

const PAGE_SIZE = 12;

const PRICE_RANGES = [
  { value: 'under500', label: 'Dưới 500.000đ' },
  { value: '500to1000', label: '500.000đ - 1.000.000đ' },
  { value: '1000to2000', label: '1.000.000đ - 2.000.000đ' },
  { value: 'above2000', label: 'Trên 2.000.000đ' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'rating', label: 'Đánh giá cao' },
];

const API_SORT_VALUES = new Set(['newest', 'price_asc', 'price_desc', 'bestseller', 'best_seller', 'rating', 'sale']);

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('vi-VN');
}

function getCategoryName(product) {
  if (typeof product?.category === 'string') return product.category;
  return product?.category?.name || product?.categoryName || '';
}

function getBrandName(product) {
  if (typeof product?.brand === 'string') return product.brand;
  return product?.brand?.name || product?.brandName || '';
}

function getVolumeLabel(product) {
  if (product?.volume) return String(product.volume);
  const volumeMl = asNumber(product?.volumeMl ?? product?.volume_ml);
  return volumeMl > 0 ? `${volumeMl}ml` : '';
}

function getScentText(product) {
  return product?.scentGroup || product?.scentFamily || product?.scentNotes || product?.scent_notes || '';
}

function getEffectivePrice(product) {
  const discountPrice = asNumber(product?.discountPrice ?? product?.discount_price);
  const salePrice = asNumber(product?.salePrice);
  if (discountPrice > 0) return discountPrice;
  if (salePrice > 0) return salePrice;
  return asNumber(product?.price);
}

function getRating(product) {
  return asNumber(product?.rating);
}

function getSoldCount(product) {
  return asNumber(product?.soldCount ?? product?.sold ?? product?.totalSold);
}

function uniqueByName(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!item?.name) return;
    const key = item.id || item.name;
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  if (currentPage > 3) pages.push('start-ellipsis');

  for (let pageNumber = Math.max(2, currentPage - 1); pageNumber <= Math.min(totalPages - 1, currentPage + 1); pageNumber += 1) {
    pages.push(pageNumber);
  }

  if (currentPage < totalPages - 2) pages.push('end-ellipsis');
  pages.push(totalPages);
  return pages;
}

function ProductFilters({
  categories,
  brands,
  scentOptions,
  volumeOptions,
  activeFilters,
  activeFilterCount,
  draftSearch,
  onSearchChange,
  onUpdateFilter,
  onClearFilters,
  onClose,
  compact = false,
}) {
  return (
    <div className="luxury-filter-panel">
      <div className="luxury-filter-heading">
        <div>
          <p className="luxury-filter-eyebrow">Curated filters</p>
          <h2>Bộ lọc</h2>
        </div>
        {compact && (
          <button type="button" className="luxury-icon-btn" onClick={onClose} aria-label="Đóng bộ lọc">
            ×
          </button>
        )}
      </div>

      <label className="luxury-search-box">
        <span>Tìm kiếm</span>
        <input
          type="search"
          placeholder="Tên sản phẩm, mùi hương..."
          value={draftSearch}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      {activeFilterCount > 0 && (
        <button type="button" className="luxury-clear-filter-btn" onClick={onClearFilters}>
          Xóa bộ lọc
        </button>
      )}

      <FilterSection title="Khoảng giá">
        {PRICE_RANGES.map((range) => (
          <FilterChoice
            key={range.value}
            label={range.label}
            checked={activeFilters.priceRange === range.value}
            onChange={() => onUpdateFilter({ priceRange: activeFilters.priceRange === range.value ? null : range.value })}
          />
        ))}
      </FilterSection>

      {brands.length > 0 && (
        <FilterSection title="Thương hiệu">
          {brands.map((brand) => (
            <FilterChoice
              key={brand.id}
              label={brand.name}
              checked={String(activeFilters.brandId || '') === String(brand.id)}
              onChange={() => onUpdateFilter({ brandId: String(activeFilters.brandId || '') === String(brand.id) ? null : brand.id })}
            />
          ))}
        </FilterSection>
      )}

      {categories.length > 0 && (
        <FilterSection title="Giới tính / nhóm sản phẩm">
          {categories.map((category) => (
            <FilterChoice
              key={category.id}
              label={category.name}
              checked={String(activeFilters.categoryId || '') === String(category.id)}
              onChange={() => onUpdateFilter({ categoryId: String(activeFilters.categoryId || '') === String(category.id) ? null : category.id })}
            />
          ))}
        </FilterSection>
      )}

      {scentOptions.length > 0 && (
        <FilterSection title="Nhóm hương">
          {scentOptions.map((scent) => (
            <FilterChoice
              key={scent}
              label={scent}
              checked={activeFilters.scent === scent}
              onChange={() => onUpdateFilter({ scent: activeFilters.scent === scent ? null : scent })}
            />
          ))}
        </FilterSection>
      )}

      {volumeOptions.length > 0 && (
        <FilterSection title="Dung tích">
          {volumeOptions.map((volume) => (
            <FilterChoice
              key={volume}
              label={volume}
              checked={activeFilters.volume === volume}
              onChange={() => onUpdateFilter({ volume: activeFilters.volume === volume ? null : volume })}
            />
          ))}
        </FilterSection>
      )}
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="luxury-filter-section">
      <h3>{title}</h3>
      <div className="luxury-filter-options">{children}</div>
    </section>
  );
}

function FilterChoice({ label, checked, onChange }) {
  return (
    <label className="luxury-filter-choice">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="luxury-filter-check" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

function ProductGridSkeleton({ count = PAGE_SIZE }) {
  return (
    <div className="luxury-product-grid" aria-label="Đang tải sản phẩm">
      {Array.from({ length: count }, (_, index) => (
        <div className="luxury-listing-card luxury-listing-skeleton" key={index}>
          <div className="luxury-skeleton luxury-listing-skeleton-media" />
          <div className="luxury-listing-card-body">
            <div className="luxury-skeleton luxury-skeleton-line w-50" />
            <div className="luxury-skeleton luxury-skeleton-line-lg w-100" />
            <div className="luxury-skeleton luxury-skeleton-line w-75" />
            <div className="luxury-skeleton luxury-skeleton-line w-50" />
            <div className="luxury-skeleton luxury-skeleton-button w-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClearFilters, hasFilters }) {
  return (
    <div className="luxury-listing-state">
      <div className="luxury-state-icon" aria-hidden="true"><span>⌕</span></div>
      <h3>Không tìm thấy sản phẩm phù hợp</h3>
      <p>Thử thay đổi từ khóa hoặc chọn bộ lọc khác để khám phá thêm mùi hương.</p>
      {hasFilters && (
        <button type="button" className="luxury-state-btn" onClick={onClearFilters}>
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="luxury-listing-state error">
      <div className="luxury-state-icon" aria-hidden="true"><span>!</span></div>
      <h3>Không thể tải sản phẩm</h3>
      <p>{message || 'Đã xảy ra lỗi khi tải danh sách sản phẩm. Vui lòng thử lại.'}</p>
      <button type="button" className="luxury-state-btn" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}

function ProductPagination({ currentPage, totalPages, onPageChange }) {
  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <nav className="luxury-pagination" aria-label="Phân trang sản phẩm">
      <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} aria-label="Trang trước">
        ‹
      </button>
      {pageItems.map((item, index) =>
        typeof item === 'number' ? (
          <button
            type="button"
            key={item}
            className={item === currentPage ? 'active' : ''}
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? 'page' : undefined}
          >
            {item}
          </button>
        ) : (
          <span key={`${item}-${index}`}>...</span>
        )
      )}
      <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Trang sau">
        ›
      </button>
    </nav>
  );
}

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [facetProducts, setFacetProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogBrands, setCatalogBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(searchParams.get('search') || '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(draftSearch, 350);
  const productGridRef = useScrollReveal('.scroll-reveal-item', !loading && products.length > 0);

  const categoryId = searchParams.get('categoryId') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const search = searchParams.get('search') || undefined;
  const priceRange = searchParams.get('priceRange') || undefined;
  const sort = searchParams.get('sort') || 'newest';
  const scent = searchParams.get('scent') || undefined;
  const volume = searchParams.get('volume') || undefined;
  const apiSort = API_SORT_VALUES.has(sort) ? sort : 'newest';

  const inferredCategories = useMemo(() => {
    const items = facetProducts
      .map((product) => {
        if (!product?.category && !product?.categoryName) return null;
        return {
          id: product.category?.id ?? product.categoryId ?? product.id_category,
          name: getCategoryName(product),
        };
      })
      .filter((category) => category?.id && category?.name);

    return uniqueByName(items);
  }, [facetProducts]);

  const inferredBrands = useMemo(() => {
    const items = facetProducts
      .map((product) => {
        if (!product?.brand && !product?.brandName) return null;
        return {
          id: product.brand?.id ?? product.brandId ?? product.id_brand,
          name: getBrandName(product),
        };
      })
      .filter((brand) => brand?.id && brand?.name);

    return uniqueByName(items);
  }, [facetProducts]);

  const categories = catalogCategories.length > 0 ? catalogCategories : inferredCategories;
  const brands = catalogBrands.length > 0 ? catalogBrands : inferredBrands;

  const scentOptions = useMemo(() => {
    const map = new Map();
    facetProducts.forEach((product) => {
      const scentText = getScentText(product);
      if (!scentText) return;

      String(scentText)
        .split(/[;,/|]+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2 && item.length <= 28)
        .slice(0, 4)
        .forEach((item) => map.set(normalizeText(item), item));
    });

    return Array.from(map.values())
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .slice(0, 8);
  }, [facetProducts]);

  const volumeOptions = useMemo(() => {
    const values = new Set();
    facetProducts.forEach((product) => {
      const label = getVolumeLabel(product);
      if (label) values.add(label);
    });

    return Array.from(values).sort((a, b) => asNumber(String(a).replace(/\D/g, '')) - asNumber(String(b).replace(/\D/g, '')));
  }, [facetProducts]);

  const activeFilterCount = [categoryId, brandId, priceRange, search, scent, volume].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || sort !== 'newest';

  const activeFilters = {
    categoryId,
    brandId,
    priceRange,
    scent,
    volume,
  };

  const updateFilters = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    setSearchParams(nextParams);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setSearchParams({});
    setPage(1);
    setMobileFiltersOpen(false);
  };

  const load = () => {
    setLoading(true);
    setError('');
    productService
      .getProducts({ page, size: PAGE_SIZE, sort: apiSort, categoryId, brandId, search, priceRange, scent, volume })
      .then((data) => {
        const content = Array.isArray(data?.content) ? data.content : [];
        setProducts(content);
        setTotalPages(Number(data?.totalPages || 1));
        setTotalElements(Number(data?.totalElements || content.length));
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Không tải được danh sách sản phẩm.';
        setError(msg);
        setProducts([]);
        setTotalPages(1);
        setTotalElements(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, apiSort, categoryId, brandId, search, priceRange, scent, volume]);

  useEffect(() => {
    productService
      .getProducts({ page: 1, size: 100, sort: 'newest' })
      .then((data) => setFacetProducts(Array.isArray(data?.content) ? data.content : []))
      .catch(() => setFacetProducts([]));

    productService
      .getCategories()
      .then((data) => setCatalogCategories(uniqueByName(data)))
      .catch(() => setCatalogCategories([]));

    productService
      .getBrands()
      .then((data) => setCatalogBrands(uniqueByName(data)))
      .catch(() => setCatalogBrands([]));
  }, []);

  useEffect(() => {
    setDraftSearch(search || '');
  }, [search]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed !== (search || '')) {
      updateFilters({ search: trimmed || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const displayProducts = useMemo(() => {
    let nextProducts = [...products];

    if (scent) {
      const normalizedScent = normalizeText(scent);
      nextProducts = nextProducts.filter((product) => normalizeText(getScentText(product)).includes(normalizedScent));
    }

    if (volume) {
      nextProducts = nextProducts.filter((product) => getVolumeLabel(product) === volume);
    }

    if (sort === 'price_asc') {
      nextProducts.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sort === 'price_desc') {
      nextProducts.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sort === 'bestseller') {
      nextProducts.sort((a, b) => getSoldCount(b) - getSoldCount(a));
    } else if (sort === 'rating') {
      nextProducts.sort((a, b) => getRating(b) - getRating(a));
    }

    return nextProducts;
  }, [products, scent, sort, volume]);

  const handleAddToCart = async (productId) => {
    try {
      await cartService.addItem(productId, 1);
      pushToast('Đã thêm vào giỏ hàng.', 'success');
    } catch (err) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
      throw err;
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterProps = {
    categories,
    brands,
    scentOptions,
    volumeOptions,
    activeFilters,
    activeFilterCount,
    draftSearch,
    onSearchChange: setDraftSearch,
    onUpdateFilter: updateFilters,
    onClearFilters: clearFilters,
  };

  const resultCount = totalElements || displayProducts.length;

  return (
    <main className="luxury-listing-page">
      <div className="container luxury-listing-shell">
        <nav className="luxury-product-breadcrumb" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Sản phẩm</span>
        </nav>

        <header className="luxury-listing-hero">
          <img src="/images/perfume-banner.jpg" alt="Bộ sưu tập nước hoa cao cấp" />
          <div className="luxury-listing-hero-overlay" />
          <div className="luxury-listing-hero-content">
            <p>HuyPerfume collection</p>
            <h1>Bộ sưu tập nước hoa</h1>
            <span>Khám phá những mùi hương được tuyển chọn cho phong cách riêng của bạn.</span>
          </div>
        </header>

        <div className="luxury-listing-summary luxury-listing-summary-elevated">
          <div>
            <span className="luxury-summary-kicker">Danh sách sản phẩm</span>
            <strong>{resultCount.toLocaleString('vi-VN')}</strong>
            <span>sản phẩm</span>
          </div>
          <div className="luxury-summary-pill-row">
            {search && <span className="luxury-summary-pill">Kết quả cho: “{search}”</span>}
            {priceRange && <span className="luxury-summary-pill">Khoảng giá: {PRICE_RANGES.find((range) => range.value === priceRange)?.label || priceRange}</span>}
            {sort && <span className="luxury-summary-pill">Sắp xếp: {SORT_OPTIONS.find((option) => option.value === sort)?.label || sort}</span>}
          </div>
        </div>

        <section className="luxury-listing-layout">
          <aside className="luxury-filter-sidebar">
            <ProductFilters {...filterProps} />
          </aside>

          <div className="luxury-products-area">
            <div className="luxury-products-toolbar">
              <button type="button" className="luxury-mobile-filter-btn" onClick={() => setMobileFiltersOpen(true)}>
                <span aria-hidden="true">☰</span>
                Bộ lọc
                {activeFilterCount > 0 && <em>{activeFilterCount}</em>}
              </button>

              <div className="luxury-sort-control">
                <label htmlFor="product-sort">Sắp xếp theo</label>
                <select
                  id="product-sort"
                  value={sort}
                  onChange={(event) => updateFilters({ sort: event.target.value === 'newest' ? null : event.target.value })}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <ProductGridSkeleton />
            ) : error ? (
              <ErrorState message={error} onRetry={load} />
            ) : displayProducts.length === 0 ? (
              <EmptyState onClearFilters={clearFilters} hasFilters={hasActiveFilters} />
            ) : (
              <>
                <div className="luxury-product-grid" ref={productGridRef}>
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <ProductPagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <div
        className={`luxury-filter-backdrop ${mobileFiltersOpen ? 'open' : ''}`}
        onClick={() => setMobileFiltersOpen(false)}
        aria-hidden="true"
      />
      <aside className={`luxury-filter-drawer ${mobileFiltersOpen ? 'open' : ''}`} aria-hidden={!mobileFiltersOpen}>
        <ProductFilters {...filterProps} compact onClose={() => setMobileFiltersOpen(false)} />
      </aside>
    </main>
  );
}
