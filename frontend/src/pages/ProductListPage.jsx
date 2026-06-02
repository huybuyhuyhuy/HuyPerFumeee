import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { ProductCard } from '../components/Product/ProductCard.jsx';
import { useToast } from '../store/ToastContext';
import { buildProductVariants } from '../utils/productVariants';
import { formatVnCurrency } from '../utils/formatters';

const PAGE_SIZE = 12;

const PRICE_RANGES = [
  { value: 'under500', label: 'Dưới 500.000đ' },
  { value: '500to1000', label: '500.000đ - 1.000.000đ' },
  { value: '1000to2000', label: '1.000.000đ - 2.000.000đ' },
  { value: 'above2000', label: 'Trên 2.000.000đ' },
];

const DEFAULT_PRODUCT_FACETS = {
  categories: [],
  brands: [],
  scentGroups: [],
  volumes: [],
  priceRanges: PRICE_RANGES,
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'rating', label: 'Đánh giá cao' },
];

const API_SORT_VALUES = new Set(['newest', 'price_asc', 'price_desc', 'bestseller', 'best_seller', 'rating', 'sale']);

function getPageFromParams(searchParams) {
  const page = Number(searchParams.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getVariantStock(variant) {
  return asNumber(variant?.stockQuantity ?? variant?.stock);
}

function isVariantAvailable(variant) {
  return variant?.status !== false && variant?.isAvailable !== false && getVariantStock(variant) > 0 && asNumber(variant?.price) > 0;
}

function productNeedsSelection(product, variants = buildProductVariants(product)) {
  return Boolean(
    product?.hasVariants ||
    Number(product?.variantCount ?? product?.variant_count ?? 0) > 1 ||
    (Array.isArray(product?.variants) && product.variants.length > 1) ||
    (Array.isArray(product?.decantOptions) && product.decantOptions.length > 0) ||
    variants.length > 1 ||
    variants.some((variant) => variant.isDecant)
  );
}

function getCartSelectionForVariant(variant) {
  return {
    itemType: variant?.itemType || (variant?.isDecant ? 'DECANT' : 'FULL_BOTTLE'),
    volumeMl: variant?.isDecant ? variant?.volumeMl : null,
  };
}

function getVariantDisplayName(variant) {
  if (variant?.isDecant) return `Decant ${variant.volumeMl || variant.size || ''}`.trim();
  return ['Full bottle', variant?.size || variant?.volume].filter(Boolean).join(' · ');
}

function VariantPickerModal({ picker, addingVariantId, onClose, onSelect }) {
  if (!picker) return null;

  const productName = picker.product?.name || 'HuyPerfume';
  return (
    <div className="luxury-variant-modal-layer" role="presentation">
      <button type="button" className="luxury-variant-modal-backdrop" aria-label="Đóng chọn phiên bản" onClick={onClose} />
      <section className="luxury-variant-modal" role="dialog" aria-modal="true" aria-labelledby="variant-picker-title">
        <header className="luxury-variant-modal-header">
          <div>
            <p className="section-eyebrow">Chọn phiên bản</p>
            <h2 id="variant-picker-title">{productName}</h2>
          </div>
          <button type="button" className="luxury-variant-close" aria-label="Đóng" onClick={onClose}>
            ×
          </button>
        </header>

        {picker.loading ? (
          <div className="luxury-variant-loading">Đang tải phiên bản...</div>
        ) : picker.error ? (
          <div className="luxury-variant-error">
            <p>{picker.error}</p>
            <button type="button" className="luxury-card-detail-btn" onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <div className="luxury-variant-options">
            {picker.variants.map((variant) => {
              const stock = getVariantStock(variant);
              const available = isVariantAvailable(variant);
              const variantKey = String(variant.id ?? variant.variantId ?? variant.label);
              const isAdding = addingVariantId === variantKey;

              return (
                <button
                  key={variantKey}
                  type="button"
                  className={`luxury-variant-option ${available ? 'is-available' : 'is-disabled'}`}
                  onClick={() => available && onSelect(variant)}
                  disabled={!available || Boolean(addingVariantId)}
                >
                  <span className="luxury-variant-option-main">
                    <strong>{getVariantDisplayName(variant)}</strong>
                    <small>{variant.isDecant ? 'Size chiết' : 'Nguyên chai'}</small>
                  </span>
                  <span className="luxury-variant-option-meta">
                    <b>{formatVnCurrency(variant.price)}</b>
                    <em>{stock > 0 ? `${stock.toLocaleString('vi-VN')} còn hàng` : 'Hết hàng'}</em>
                  </span>
                  <span className={`luxury-variant-status ${available ? 'available' : 'sold-out'}`}>
                    {isAdding ? 'Đang thêm...' : available ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
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
  priceRanges,
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
        {priceRanges.map((range) => (
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
  const [facets, setFacets] = useState(DEFAULT_PRODUCT_FACETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [draftSearch, setDraftSearch] = useState(searchParams.get('search') || '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [variantPicker, setVariantPicker] = useState(null);
  const [addingVariantId, setAddingVariantId] = useState('');
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(draftSearch, 350);
  const productGridRef = useScrollReveal('.scroll-reveal-item', !loading && products.length > 0);

  const page = getPageFromParams(searchParams);
  const categoryId = searchParams.get('categoryId') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const search = searchParams.get('search') || undefined;
  const priceRange = searchParams.get('priceRange') || undefined;
  const rawSort = searchParams.get('sort') || 'newest';
  const scent = searchParams.get('scent') || undefined;
  const volume = searchParams.get('volume') || undefined;
  const apiSort = API_SORT_VALUES.has(rawSort) ? rawSort : 'newest';
  const sort = rawSort === 'best_seller'
    ? 'bestseller'
    : SORT_OPTIONS.some((option) => option.value === rawSort) ? rawSort : 'newest';

  const categories = uniqueByName(Array.isArray(facets.categories) ? facets.categories : []);
  const brands = uniqueByName(Array.isArray(facets.brands) ? facets.brands : []);
  const scentOptions = Array.isArray(facets.scentGroups) ? facets.scentGroups : [];
  const volumeOptions = Array.isArray(facets.volumes) ? facets.volumes : [];
  const priceRanges = Array.isArray(facets.priceRanges) && facets.priceRanges.length > 0 ? facets.priceRanges : PRICE_RANGES;

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
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setSearchParams({});
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
      .getProductFacets()
      .then((data) => setFacets({
        categories: Array.isArray(data?.categories) ? data.categories : [],
        brands: Array.isArray(data?.brands) ? data.brands : [],
        scentGroups: Array.isArray(data?.scentGroups) ? data.scentGroups : [],
        volumes: Array.isArray(data?.volumes) ? data.volumes : [],
        priceRanges: Array.isArray(data?.priceRanges) && data.priceRanges.length > 0 ? data.priceRanges : PRICE_RANGES,
      }))
      .catch(() => setFacets(DEFAULT_PRODUCT_FACETS));
  }, []);

  useEffect(() => {
    setDraftSearch(search || '');
  }, [search]);

  useEffect(() => {
    if (!variantPicker) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !addingVariantId) setVariantPicker(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addingVariantId, variantPicker]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed !== (search || '')) {
      updateFilters({ search: trimmed || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const displayProducts = products;

  const addVariantToCart = async (product, variant) => {
    const productId = Number(product?.id);
    if (!Number.isInteger(productId) || productId <= 0) throw new Error('Sản phẩm không hợp lệ.');
    if (!isVariantAvailable(variant)) throw new Error('Phiên bản này hiện đã hết hàng.');

    await cartService.addItem(productId, 1, variant?.variantId ?? null, getCartSelectionForVariant(variant));
    pushToast('Đã thêm vào giỏ hàng.', 'success');
  };

  const openVariantPicker = async (product) => {
    setVariantPicker({ product, variants: [], loading: true, error: '' });
    try {
      const detail = await productService.getProduct(Number(product.id));
      const variants = buildProductVariants(detail);
      const availableVariants = variants.filter(isVariantAvailable);

      if (variants.length === 1 && availableVariants.length === 1) {
        setVariantPicker(null);
        await addVariantToCart(detail, availableVariants[0]);
        return;
      }

      setVariantPicker({
        product: detail,
        variants,
        loading: false,
        error: variants.length ? '' : 'Sản phẩm chưa có phiên bản khả dụng.',
      });
    } catch (err) {
      setVariantPicker({
        product,
        variants: [],
        loading: false,
        error: err?.message || 'Không tải được phiên bản sản phẩm.',
      });
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const variants = buildProductVariants(product);
      const availableVariants = variants.filter(isVariantAvailable);

      if (!availableVariants.length) {
        pushToast('Sản phẩm tạm hết hàng.', 'info');
        return { pendingSelection: true };
      }

      if (productNeedsSelection(product, variants)) {
        openVariantPicker(product);
        return { pendingSelection: true };
      }

      await addVariantToCart(product, availableVariants[0]);
      return { added: true };
    } catch (err) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
      throw err;
    }
  };

  const handleVariantSelect = async (variant) => {
    if (!variantPicker?.product) return;
    const variantKey = String(variant.id ?? variant.variantId ?? variant.label);
    setAddingVariantId(variantKey);
    try {
      await addVariantToCart(variantPicker.product, variant);
      setVariantPicker(null);
    } catch (err) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
    } finally {
      setAddingVariantId('');
    }
  };

  const closeVariantPicker = () => {
    if (addingVariantId) return;
    setVariantPicker(null);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage <= 1) nextParams.delete('page');
    else nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterProps = {
    categories,
    brands,
    scentOptions,
    volumeOptions,
    priceRanges,
    activeFilters,
    activeFilterCount,
    draftSearch,
    onSearchChange: setDraftSearch,
    onUpdateFilter: updateFilters,
    onClearFilters: clearFilters,
  };

  const resultCount = totalElements || products.length;

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
            {priceRange && <span className="luxury-summary-pill">Khoảng giá: {priceRanges.find((range) => range.value === priceRange)?.label || priceRange}</span>}
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
      <VariantPickerModal
        picker={variantPicker}
        addingVariantId={addingVariantId}
        onClose={closeVariantPicker}
        onSelect={handleVariantSelect}
      />
      <aside className={`luxury-filter-drawer ${mobileFiltersOpen ? 'open' : ''}`} aria-hidden={!mobileFiltersOpen}>
        <ProductFilters {...filterProps} compact onClose={() => setMobileFiltersOpen(false)} />
      </aside>
    </main>
  );
}
