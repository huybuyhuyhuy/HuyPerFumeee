# Phase 5 - Reviews, Wishlist, Recommendations

## Public Product Engagement APIs

- `GET /api/products/:id/reviews`: approved review page with rating summary.
- `POST /api/products/:id/reviews`: authenticated user submits a review; new reviews start as `PENDING`.
- `PUT /api/reviews/:id`: review owner or moderator updates review content.
- `DELETE /api/reviews/:id`: review owner or moderator soft deletes review.
- `PUT /api/reviews/:id/moderation`: admin/staff approves, rejects, or flags a review.
- `GET /api/products/:id/related`: same brand/category/gender/scent related products.
- `GET /api/products/recommendations/trending`: trending products based on recent views, sold count, and rating.
- `GET /api/products/recommendations/personalized`: wishlist/recent-view based recommendations with trending fallback.
- `GET /api/products/recently-viewed`: user or guest-token recent product history.
- `POST /api/products/:id/view`: explicit recently viewed tracking. Product detail also records a view automatically when a user or `X-View-Token` is present.

## Rating Consistency

Only `APPROVED` reviews contribute to `ratingAverage` and `reviewCount`.

When reviews are created, updated, moderated, or deleted:

1. The aggregate rating is recalculated from `product_reviews`.
2. `products.rating_average` and `products.review_count` are refreshed when those columns exist.
3. Product detail, product lists, review lists, and recommendation caches are invalidated.

## Moderation Model

Review statuses:

- `PENDING`: submitted or edited by a customer, not public yet.
- `APPROVED`: public and counted in rating.
- `REJECTED`: hidden and excluded from rating.
- `FLAGGED`: hidden for follow-up and excluded from rating.

## Recommendation Strategy

Related products score matching signals in this order:

- Brand
- Category
- Scent group/family/notes
- Gender
- Sales and approved rating as tie breakers

Personalized recommendations use a user's wishlist and recently viewed products. Guest personalization uses `X-View-Token`; the React client creates and sends this token automatically.

Trending products combine recent view volume, sold count, rating, and freshness. If the recent view table does not exist yet, the endpoint falls back to sold count, rating, and newest products.

## Database Migration

Run `migrations/20260524_reviews_recommendations.sql` after the previous Phase 1-4 migrations. It adds:

- `product_reviews`
- `product_recent_views`
- wishlist unique/index hardening
- review/trending indexes
- product rating backfill from approved reviews
