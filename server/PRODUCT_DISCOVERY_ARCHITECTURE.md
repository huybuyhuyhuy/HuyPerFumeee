# Product Discovery

Phase 4 upgrades `GET /products` into the primary discovery endpoint for the React storefront.

## Supported Query Parameters

- `q`, `keyword`, or `search`: keyword search across product name, slug, SKU, batch code, description, scent notes, brand, category, and variant SKU/barcode.
- `brandId` or `brand`: filter by numeric brand ID or brand name/slug, for example `brand=dior`.
- `categoryId` or `category`: filter by numeric category ID or category name/slug.
- `gender`: supports `men`, `women`, and `unisex`, with category-name fallback when product gender is missing.
- `scent` or `scentGroup`: filter by scent text or grouped scent families such as `fresh`, `floral`, `woody`, `amber`, `spicy`, `sweet`, `musk`, and `leather`.
- `volumeMl` or `volume`: filters product volume and active variant volume.
- `minPrice` and `maxPrice`: filters effective product price. Variant products use active variant effective price.
- `priceRange`: supports `under500`, `500to1000`, `1000to2000`, and `above2000`.
- `badge=sale`, `sale=true`, or `onSale=true`: sale products, including products with discounted variants.
- `bestSeller=true`: products with order-item sales.
- `sort`: `newest`, `price_asc`, `price_desc`, `best_seller`, `bestseller`, `rating`, or `sale`.
- `page` and `size`: offset pagination with a maximum page size of 100.

Example:

```http
GET /products?brand=dior&gender=men&minPrice=1000000&maxPrice=5000000&sort=best_seller&page=1&size=12
```

## Query Strategy

- Filters are built as SQL predicates with parameter binding.
- Brand/category text filters use lookup subqueries so count queries stay lightweight.
- Variant-aware price and volume use `EXISTS` predicates, so parent product stock or price does not override active variants.
- Bestseller sorting uses an aggregated `order_items` join.
- List responses are cached in Redis using a stable SHA-256 fingerprint of page, size, sort, and normalized filters.
- Product cache invalidation clears all product list keys after inventory or product mutations.

## Indexing

Apply `migrations/20260524_product_discovery_indexes.sql` after Phase 1. It adds discovery indexes for active product filtering, price filtering, variant price/volume lookup, sales aggregation, and brand/category name lookup.

## Frontend Compatibility

The endpoint remains `GET /products`, so existing React screens keep working. Existing `brandId`, `categoryId`, `priceRange`, `scent`, and `volume` parameters are preserved, while new aliases such as `brand=dior` and `q=sauvage` are now accepted.
