# Checkout And Inventory Consistency

Phase 2 adds a production checkout path around the existing Express API.

## Modules

- Cart controller/model: `src/controllers/cartController.js`, `src/models/cartModel.js`
- Durable cart repository: `src/modules/checkout/cart.repository.js`
- Checkout storage capability detection: `src/modules/checkout/checkout.storage.js`
- Redis reservation locks: `src/modules/checkout/reservation.redis.js`
- Inventory reservation and ledger writes: `src/modules/checkout/inventory.repository.js`
- Order checkout transaction: `src/models/orderModel.js`

## Checkout Pipeline

1. Validate request payload and cart lines.
2. Acquire Redis inventory locks in deterministic stock-key order.
3. Create short-lived Redis reservation markers.
4. Open a SQL transaction.
5. Lock product or variant stock rows with `UPDLOCK, ROWLOCK`.
6. Revalidate price and inventory from database.
7. Insert order and order items.
8. Create `inventory_reservations`.
9. Decrement stock with guarded `stock >= quantity` updates.
10. Write `inventory_transactions` ledger rows.
11. Commit transaction.
12. Mark cart as checked out and invalidate product cache.

## Oversell Protection

The system uses both:

- Pessimistic SQL row locks for authoritative stock.
- Redis locks/reservation keys to reduce checkout contention before the database transaction.

The SQL update is still guarded by stock availability, so Redis failure cannot create overselling.

## Cancellation

Customer and admin cancellation both restore stock inside a SQL transaction, release reservation records, write a `RELEASE` inventory transaction, and invalidate product cache.

## Idempotency

Clients can send `Idempotency-Key` or `idempotencyKey`. If the migration column exists, repeated checkout requests return the original order instead of creating duplicates. The unique index is scoped by `user_id` so different customers can safely reuse client-generated keys.

## Concurrency Notes

Order cancellation locks the order row with `UPDLOCK, ROWLOCK` before restoring stock, so two cancellation requests cannot restore the same inventory twice.

Redis reservation keys are cleaned up on both success and partial reservation failure; SQL stock updates remain the source of truth.
