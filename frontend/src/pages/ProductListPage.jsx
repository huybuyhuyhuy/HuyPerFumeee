import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductGridSkeleton } from '../components/Feedback/ProductSkeletons';
import { useToast } from '../store/ToastContext';

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [facetProducts, setFacetProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(searchParams.get('search') || '');
  const { isLoggedIn } = useAuth();
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(draftSearch, 350);

  const categoryId = searchParams.get('categoryId') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const search = searchParams.get('search') || undefined;
  const priceRange = searchParams.get('priceRange') || undefined;
  const sort = searchParams.get('sort') || 'newest';

  const categories = useMemo(() => {
    const map = new Map();
    facetProducts.forEach((product) => {
      if (product.category) map.set(product.category.id, product.category);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [facetProducts]);

  const brands = useMemo(() => {
    const map = new Map();
    facetProducts.forEach((product) => {
      if (product.brand) map.set(product.brand.id, product.brand);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [facetProducts]);

  const updateFilters = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    setSearchParams(nextParams);
    setPage(1);
  };

  const load = () => {
    setLoading(true);
    setError('');
    productService
      .getProducts({ page, size: 12, sort, categoryId, brandId, search, priceRange })
      .then((data) => {
        setProducts(Array.isArray(data?.content) ? data.content : []);
        setTotalPages(Number(data?.totalPages || 1));
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Không tải được danh sách sản phẩm.';
        setError(msg);
        setProducts([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, categoryId, brandId, search, priceRange]);

  useEffect(() => {
    productService
      .getProducts({ page: 1, size: 100, sort: 'newest' })
      .then((data) => setFacetProducts(Array.isArray(data?.content) ? data.content : []))
      .catch(() => setFacetProducts([]));
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

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) {
      pushToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 'info');
      return;
    }

    try {
      await cartService.addItem(productId, 1);
      pushToast('Đã thêm vào giỏ hàng.', 'success');
    } catch (err) {
      pushToast(err?.message || 'Lỗi thêm vào giỏ hàng.', 'error');
    }
  };

  return (
    <div className="container luxury-page">
      <div className="luxury-surface p-4 p-lg-5 mb-4">
        <div className="d-flex flex-column gap-4">
          <div>
            <p className="text-uppercase luxury-muted small mb-1">Explore the collection</p>
            <h3 className="mb-2">{search ? `Kết quả cho: "${search}"` : 'Tất cả sản phẩm'}</h3>
            <p className="mb-0 luxury-muted">Mỗi sản phẩm được trình bày với bố cục thoáng, rõ ràng và sang trọng hơn.</p>
          </div>

          <div className="product-filter-grid">
            <input
              type="search"
              className="form-control"
              placeholder="Tìm theo tên sản phẩm..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
            />
            <select
              className="form-select"
              value={categoryId || ''}
              onChange={(e) => updateFilters({ categoryId: e.target.value || null })}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={brandId || ''}
              onChange={(e) => updateFilters({ brandId: e.target.value || null })}
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={priceRange || ''}
              onChange={(e) => updateFilters({ priceRange: e.target.value || null })}
            >
              <option value="">Mọi mức giá</option>
              <option value="under500">Dưới 500.000₫</option>
              <option value="500to1000">500.000₫ - 1.000.000₫</option>
              <option value="1000to2000">1.000.000₫ - 2.000.000₫</option>
              <option value="above2000">Trên 2.000.000₫</option>
            </select>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value === 'newest' ? null : e.target.value })}
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
            {(categoryId || brandId || priceRange || search || sort !== 'newest') && (
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => {
                  setDraftSearch('');
                  setSearchParams({});
                  setPage(1);
                }}
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : error ? (
        <div className="text-center py-5">
          <p className="text-danger mb-3">{error}</p>
          <button className="btn btn-outline-dark" onClick={load}>
            Thử lại
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Không tìm thấy sản phẩm nào.</p>
        </div>
      ) : (
        <>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center flex-wrap gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
