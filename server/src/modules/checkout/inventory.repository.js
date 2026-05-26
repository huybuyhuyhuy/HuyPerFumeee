import { sql } from '../../config/database.js';
import { randomUUID } from 'crypto';
import { env } from '../../config/env.js';
import { getCheckoutStorageCapabilities } from './checkout.storage.js';

function metadataText(metadata = {}) {
  try {
    return JSON.stringify(metadata);
  } catch {
    return '{}';
  }
}

export async function createInventoryReservation(transaction, item, { cartId = null, orderId = null, userId = null, ttlSeconds = null } = {}) {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasInventoryReservations) return null;

  const request = new sql.Request(transaction);
  const key = `inv_${randomUUID()}`;
  request.input('reservationKey', sql.NVarChar, key);
  request.input('cartId', sql.Int, cartId);
  request.input('orderId', sql.Int, orderId);
  request.input('userId', sql.Int, userId);
  request.input('productId', sql.Int, item.productId);
  request.input('variantId', sql.Int, item.variantId || null);
  request.input('quantity', sql.Int, item.quantity);
  request.input('ttlSeconds', sql.Int, Math.max(30, Number(ttlSeconds || env.checkoutReservationTtlSeconds || 900)));

  const result = await request.query(
    `INSERT INTO inventory_reservations
       (reservation_key, cart_id, order_id, user_id, product_id, product_variant_id, quantity, status, expires_at)
     OUTPUT INSERTED.id AS id, INSERTED.reservation_key AS reservation_key
     VALUES
       (@reservationKey, @cartId, @orderId, @userId, @productId, @variantId, @quantity, 'RESERVED', DATEADD(second, @ttlSeconds, SYSUTCDATETIME()))`
  );

  return {
    id: result.recordset?.[0]?.id,
    key: result.recordset?.[0]?.reservation_key,
  };
}

export async function confirmInventoryReservation(transaction, reservationId) {
  if (!reservationId) return;
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasInventoryReservations) return;

  const request = new sql.Request(transaction);
  request.input('reservationId', sql.Int, reservationId);
  await request.query(
    `UPDATE inventory_reservations
     SET status = 'CONFIRMED', updated_at = SYSUTCDATETIME()
     WHERE id = @reservationId`
  );
}

export async function releaseInventoryReservation(transaction, reservationId) {
  if (!reservationId) return;
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasInventoryReservations) return;

  const request = new sql.Request(transaction);
  request.input('reservationId', sql.Int, reservationId);
  await request.query(
    `UPDATE inventory_reservations
     SET status = 'RELEASED', updated_at = SYSUTCDATETIME()
     WHERE id = @reservationId`
  );
}

export async function recordInventoryTransaction(transaction, entry) {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasInventoryTransactions) return;

  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, entry.productId);
  request.input('variantId', sql.Int, entry.variantId || null);
  request.input('orderId', sql.Int, entry.orderId || null);
  request.input('cartId', sql.Int, entry.cartId || null);
  request.input('reservationId', sql.Int, entry.reservationId || null);
  request.input('transactionType', sql.NVarChar, entry.transactionType);
  request.input('quantity', sql.Int, entry.quantity);
  request.input('stockBefore', sql.Int, entry.stockBefore ?? null);
  request.input('stockAfter', sql.Int, entry.stockAfter ?? null);
  request.input('metadata', sql.NVarChar, metadataText(entry.metadata));

  await request.query(
    `INSERT INTO inventory_transactions
       (product_id, product_variant_id, order_id, cart_id, reservation_id, transaction_type,
        quantity, stock_before, stock_after, metadata)
     VALUES
       (@productId, @variantId, @orderId, @cartId, @reservationId, @transactionType,
        @quantity, @stockBefore, @stockAfter, @metadata)`
  );
}
