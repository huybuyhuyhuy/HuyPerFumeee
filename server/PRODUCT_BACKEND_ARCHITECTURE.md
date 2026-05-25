# Product Backend Architecture

This backend keeps the existing Express runtime, but product ecommerce logic is now split into production-style layers:

- Controller: `src/controllers/productController.js`, `src/controllers/cartController.js`
- Service: `src/modules/products/product.service.js`
- Repository: `src/modules/products/product.repository.js`
- Mapper: `src/modules/products/product.mapper.js`
- DTO contract: `src/modules/products/product.dto.js`
- Validation: `src/modules/products/product.validation.js`
- Cache: `src/modules/products/product.cache.js`

## Product Detail Contract

`GET /api/products/:id` returns `data` as the product object directly:

```json
{
  "id": 53,
  "name": "Dior Sauvage EDP",
  "slug": "dior-sauvage-edp",
  "price": 3200000,
  "salePrice": 2890000,
  "originalPrice": 3200000,
  "discountPercent": 10,
  "images": [],
  "description": "",
  "brand": {},
  "category": {},
  "gender": "MEN",
  "stockQuantity": 10,
  "ratingAverage": 4.8,
  "reviewCount": 152,
  "isFavorite": false,
  "variants": []
}
```

Invalid product prices are mapped to `null`, never silently converted to `0`.

## Price Rules

- `price` and `originalPrice` are the normalized original price.
- `salePrice` and `discountPrice` are set only when the sale price is positive and lower than original price.
- `effectivePrice` is `salePrice ?? originalPrice`.
- Active products with invalid price are blocked by migration constraint `CK_products_active_price_positive`.

## Inventory Rules

- If a product has variants, `stockQuantity` is the sum of active variant stock.
- Product parent stock is used only when no variants exist.
- Cart items are keyed by `productId + variantId`.
- Checkout locks inventory rows with `UPDLOCK, ROWLOCK` and decrements stock conditionally to prevent overselling.

## Image Rules

- `product_images` stores ordered gallery images.
- Only one active thumbnail is allowed per product.
- API gallery normalization preserves order and removes duplicate URLs.

## Cache

Product detail cache key:

```text
huyperfume:product:detail:{id}
```

Production should set:

```env
REDIS_URL=redis://localhost:6379
PRODUCT_CACHE_TTL_SECONDS=300
```

The cache adapter falls back to in-memory cache when Redis is not configured, so local development still runs.
