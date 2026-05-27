import { getDbPool, query, sql } from '../config/database.js';
import { getCart, markCartCheckedOut } from './cartModel.js';
import { invalidateProductCache } from './productModel.js';
import { computeDecantStock, decrementDecantInventory, decrementFullBottleInventory, restoreDecantInventory, syncVariantStock } from './decantInventoryModel.js';
import { getProductStorageCapabilities, hasOrderItemVariantColumn } from '../modules/products/product.repository.js';
import { getCheckoutStorageCapabilities } from '../modules/checkout/checkout.storage.js';
import {
  confirmInventoryReservation,
  createInventoryReservation,
  recordInventoryTransaction,
  releaseInventoryReservation,
} from '../modules/checkout/inventory.repository.js';
import {
  createRedisReservations,
  releaseRedisReservations,
  withInventoryReservationLocks,
} from '../modules/checkout/reservation.redis.js';

function toPositivePrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveUnitPrice(originalPrice, salePrice) {
  const original = toPositivePrice(originalPrice);
  const sale = toPositivePrice(salePrice);
  if (!original) return null;
  return sale && sale < original ? sale : original;
}

function hasColumn(columns, name) {
  return columns.has(String(name).toLowerCase());
}

function deletedFilter(columns, alias) {
  return hasColumn(columns, 'deleted_at') ? `AND ${alias}.deleted_at IS NULL` : '';
}

function toOrderItem(row) {
  return {
    id: row.item_id,
    productId: row.product_id,
    variantId: row.product_variant_id || null,
    productName: row.product_name,
    productImage: row.product_image || '',
    quantity: Number(row.quantity || 0),
    price: Number(row.price || 0),
    priceAtPurchase: Number(row.price_at_purchase || row.price || 0),
    selectedBatchCode: row.selected_batch_code || '',
  };
}

function toOrder(row, items = []) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '',
    total: Number(row.total || 0),
    shippingAddress: row.shipping_address || '',
    phone: row.phone || '',
    paymentMethod: row.payment_method || '',
    momoOrderId: row.momo_order_id || '',
    momoTransId: row.momo_trans_id || '',
    zalopayAppTransId: row.zalopay_app_trans_id || '',
    status: row.status || '',
    createdAt: row.created_at,
    items,
  };
}

function validatePaymentMethod(paymentMethod) {
  const allowed = ['COD', 'VNPAY', 'BANKING', 'MOMO', 'ZALOPAY'];
  return allowed.includes(String(paymentMethod || '').toUpperCase());
}

function validateCheckoutCart(cart) {
  if (!cart?.items?.length) {
    return { code: 400, message: 'Gio hang dang trong' };
  }

  for (const item of cart.items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { code: 400, message: 'So luong san pham trong gio hang khong hop le' };
    }
    if (!item.product?.id) {
      return { code: 400, message: 'Gio hang co san pham khong hop le' };
    }
  }

  return null;
}

function toLockItems(cart) {
  return cart.items.map((item) => ({
    productId: Number(item.product.id),
    variantId: item.product.variantId ? Number(item.product.variantId) : null,
    quantity: Number(item.quantity),
  }));
}

async function productHasVariants(transaction, productId, capabilities) {
  if (!capabilities.hasVariants) return false;

  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, productId);
  const deletedClause = deletedFilter(capabilities.variantColumns, 'product_variants').replace(/^AND /, 'WHERE ');
  const statusClause = hasColumn(capabilities.variantColumns, 'status')
    ? `${deletedClause ? 'AND' : 'WHERE'} ISNULL(status, 1) = 1`
    : '';

  const result = await request.query(
    `SELECT COUNT(*) AS total
     FROM product_variants
     ${deletedClause}
     ${statusClause}
     ${deletedClause || statusClause ? 'AND' : 'WHERE'} product_id = @productId`
  );
  return Number(result.recordset?.[0]?.total || 0) > 0;
}

async function selectDefaultAvailableVariant(transaction, productId, quantity, capabilities) {
  if (!capabilities.hasVariants || !hasOrderItemVariantColumn(capabilities)) return null;

  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, productId);
  request.input('quantity', sql.Int, quantity);
  const result = await request.query(
    `SELECT TOP 1 pv.id
     FROM product_variants pv WITH (UPDLOCK, ROWLOCK)
     WHERE pv.product_id = @productId
       AND ISNULL(pv.stock_quantity, 0) >= @quantity
       AND ISNULL(pv.price, 0) > 0
       ${deletedFilter(capabilities.variantColumns, 'pv')}
       ${hasColumn(capabilities.variantColumns, 'status') ? 'AND ISNULL(pv.status, 1) = 1' : ''}
     ORDER BY pv.id ASC`
  );
  return result.recordset?.[0]?.id || null;
}

async function prepareVariantInventoryItem(transaction, cartItem, capabilities) {
  const productId = Number(cartItem.product?.id);
  const variantId = Number(cartItem.product?.variantId || cartItem.variantId);
  const quantity = Number(cartItem.quantity);

  if (!variantId) return null;
  if (!hasOrderItemVariantColumn(capabilities)) {
    return { code: 500, message: 'Schema order_items chua ho tro product_variant_id' };
  }

  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, productId);
  request.input('variantId', sql.Int, variantId);
  const result = await request.query(
    `SELECT TOP 1
            p.id AS product_id,
            p.name AS product_name,
            p.image AS product_image,
            p.batch_code,
            pv.id AS variant_id,
            pv.sku AS variant_sku,
            pv.volume_ml AS variant_volume_ml,
            pv.variant_type,
            pv.stock_quantity,
            pv.price AS variant_price,
            pv.sale_price AS variant_sale_price,
            pv.image AS variant_image
     FROM product_variants pv WITH (UPDLOCK, ROWLOCK)
     INNER JOIN products p WITH (UPDLOCK, ROWLOCK) ON p.id = pv.product_id
     WHERE pv.id = @variantId
       AND pv.product_id = @productId
       AND p.status = 1
       ${deletedFilter(capabilities.productColumns, 'p')}
       ${deletedFilter(capabilities.variantColumns, 'pv')}
       ${hasColumn(capabilities.variantColumns, 'status') ? 'AND ISNULL(pv.status, 1) = 1' : ''}`
  );

  const row = result.recordset?.[0];
  if (!row) return { code: 404, message: 'Khong tim thay bien the san pham' };

  const variantType = String(row.variant_type || '').toUpperCase();
  const isDecant = variantType === 'DECANT';
  const isFullBottle = variantType === 'FULL';

  // ── decant stock validation: check product_inventory ──
  if (isDecant) {
    const decantVolumeMl = Number(row.variant_volume_ml) || 0;
    if (decantVolumeMl <= 0) return { code: 400, message: 'Bien the decant chua co dung tich hop le' };

    const neededMl = decantVolumeMl * quantity;
    const stock = await computeDecantStock(transaction, productId, decantVolumeMl);
    if (neededMl > stock.totalAvailableMl) {
      return { code: 400, message: `Khong du dung tich de chiet. Con ${stock.totalAvailableMl}ml, can ${neededMl}ml` };
    }

    const unitPrice = resolveUnitPrice(row.variant_price, row.variant_sale_price);
    if (!unitPrice) return { code: 400, message: `San pham ${row.product_name} chua co gia hop le` };

    return {
      productId,
      variantId,
      productName: row.product_name,
      productImage: row.variant_image || row.product_image || '',
      quantity,
      unitPrice,
      stockBefore: stock.totalAvailableMl,
      selectedBatchCode: row.variant_sku || row.batch_code || '',
      isDecant: true,
      decantVolumeMl,
      isFullBottle: false,
    };
  }

  // ── full bottle: check variant stock_quantity ──
  if (quantity > Number(row.stock_quantity || 0)) {
    return { code: 400, message: `San pham ${row.product_name} khong du ton kho` };
  }

  const unitPrice = resolveUnitPrice(row.variant_price, row.variant_sale_price);
  if (!unitPrice) return { code: 400, message: `San pham ${row.product_name} chua co gia hop le` };

  return {
    productId,
    variantId,
    productName: row.product_name,
    productImage: row.variant_image || row.product_image || '',
    quantity,
    unitPrice,
    stockBefore: Number(row.stock_quantity || 0),
    selectedBatchCode: row.variant_sku || row.batch_code || '',
    isDecant: false,
    isFullBottle: isFullBottle,
  };
}

async function prepareProductInventoryItem(transaction, cartItem, capabilities) {
  const productId = Number(cartItem.product?.id);
  const quantity = Number(cartItem.quantity);

  if (await productHasVariants(transaction, productId, capabilities)) {
    const fallbackVariantId = await selectDefaultAvailableVariant(transaction, productId, quantity, capabilities);
    if (!fallbackVariantId) {
      return { code: 400, message: 'San pham khong co bien the du ton kho de thanh toan' };
    }
    return prepareVariantInventoryItem(transaction, {
      ...cartItem,
      product: { ...cartItem.product, variantId: fallbackVariantId },
    }, capabilities);
  }

  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, productId);
  const result = await request.query(
    `SELECT TOP 1 p.id, p.name, p.image, p.batch_code, p.stock, p.price, p.discount_price
     FROM products p WITH (UPDLOCK, ROWLOCK)
     WHERE p.id = @productId
       AND p.status = 1
       ${deletedFilter(capabilities.productColumns, 'p')}`
  );

  const row = result.recordset?.[0];
  if (!row) return { code: 404, message: `Khong tim thay san pham ${productId}` };
  if (quantity > Number(row.stock || 0)) {
    return { code: 400, message: `San pham ${row.name} khong du ton kho` };
  }

  const unitPrice = resolveUnitPrice(row.price, row.discount_price);
  if (!unitPrice) return { code: 400, message: `San pham ${row.name} chua co gia hop le` };

  return {
    productId,
    variantId: null,
    productName: row.name,
    productImage: row.image || '',
    quantity,
    unitPrice,
    stockBefore: Number(row.stock || 0),
    selectedBatchCode: row.batch_code || '',
  };
}

async function decrementInventory(transaction, item) {
  // ── decant: use product_inventory instead of variant stock ──
  if (item.isDecant) {
    const neededMl = (item.decantVolumeMl || 0) * item.quantity;
    const result = await decrementDecantInventory(transaction, {
      productId: item.productId,
      neededMl,
    });
    return result.openedMlAfter;
  }

  // ── full bottle via inventory tracking ──
  if (item.isFullBottle) {
    const result = await decrementFullBottleInventory(transaction, {
      productId: item.productId,
      quantity: item.quantity,
    });
    return result.sealedBottlesAfter;
  }

  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, item.productId);
  request.input('quantity', sql.Int, item.quantity);

  if (item.variantId) {
    request.input('variantId', sql.Int, item.variantId);
    const result = await request.query(
      `UPDATE product_variants
       SET stock_quantity = stock_quantity - @quantity
       WHERE id = @variantId AND product_id = @productId AND stock_quantity >= @quantity`
    );
    return result.rowsAffected?.[0] > 0 ? item.stockBefore - item.quantity : null;
  }

  const result = await request.query(
    `UPDATE products
     SET stock = stock - @quantity
     WHERE id = @productId AND stock >= @quantity`
  );
  return result.rowsAffected?.[0] > 0 ? item.stockBefore - item.quantity : null;
}

async function insertOrderItem(transaction, orderId, item, capabilities) {
  const request = new sql.Request(transaction);
  request.input('orderId', sql.Int, orderId);
  request.input('productId', sql.Int, item.productId);
  request.input('quantity', sql.Int, item.quantity);
  request.input('price', sql.Float, item.unitPrice);
  request.input('selectedBatchCode', sql.NVarChar, item.selectedBatchCode);
  request.input('priceAtPurchase', sql.Float, item.unitPrice);

  if (item.variantId && hasOrderItemVariantColumn(capabilities)) {
    request.input('productVariantId', sql.Int, item.variantId);
    await request.query(
      `INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, price, selected_batch_code, price_at_purchase, status)
       VALUES (@orderId, @productId, @productVariantId, @quantity, @price, @selectedBatchCode, @priceAtPurchase, 'Normal')`
    );
    return;
  }

  await request.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price, selected_batch_code, price_at_purchase, status)
     VALUES (@orderId, @productId, @quantity, @price, @selectedBatchCode, @priceAtPurchase, 'Normal')`
  );
}

export async function checkoutOrder({ userId, shippingAddress, phone, paymentMethod, idempotencyKey = null }) {
  if (!userId) {
    return { code: 401, message: 'Vui long dang nhap de thanh toan' };
  }
  if (!String(shippingAddress || '').trim()) {
    return { code: 400, message: 'Dia chi giao hang khong duoc de trong' };
  }
  if (!/^\d{10}$/.test(String(phone || ''))) {
    return { code: 400, message: 'So dien thoai phai co 10 chu so' };
  }
  if (!validatePaymentMethod(paymentMethod)) {
    return { code: 400, message: 'Phuong thuc thanh toan khong hop le' };
  }

  const checkoutCapabilities = await getCheckoutStorageCapabilities();
  const safeIdempotencyKey = String(idempotencyKey || '').trim();
  if (safeIdempotencyKey && hasColumn(checkoutCapabilities.orderColumns, 'checkout_idempotency_key')) {
    const existingRows = await query(
      `SELECT TOP 1 id
       FROM orders
       WHERE user_id = ? AND checkout_idempotency_key = ?
       ORDER BY id DESC`,
      [userId, safeIdempotencyKey]
    );
    const existingOrderId = existingRows[0]?.id;
    if (existingOrderId) {
      return { order: await getOrderByIdForUser(existingOrderId, userId), idempotent: true };
    }
  }

  const cart = await getCart({ type: 'user', key: userId });
  const cartError = validateCheckoutCart(cart);
  if (cartError) return cartError;

  return withInventoryReservationLocks(toLockItems(cart), async () => {
    let redisReservationKeys = [];
    let transaction = null;

    try {
      redisReservationKeys = await createRedisReservations(toLockItems(cart), {
        owner: `user:${userId}`,
        ttlSeconds: process.env.CHECKOUT_RESERVATION_TTL_SECONDS,
      });

      const capabilities = await getProductStorageCapabilities();
      const pool = await getDbPool();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      let total = 0;
      const preparedItems = [];

      for (const cartItem of cart.items) {
        const variantPrepared = capabilities.hasVariants
          ? await prepareVariantInventoryItem(transaction, cartItem, capabilities)
          : null;
        if (variantPrepared?.code) {
          await transaction.rollback();
          return variantPrepared;
        }

        const prepared = variantPrepared || await prepareProductInventoryItem(transaction, cartItem, capabilities);
        if (prepared.code) {
          await transaction.rollback();
          return prepared;
        }

        total += prepared.unitPrice * prepared.quantity;
        preparedItems.push(prepared);
      }

      const request = new sql.Request(transaction);
      request.input('userId', sql.Int, userId);
      request.input('total', sql.Float, total);
      request.input('shippingAddress', sql.NVarChar, String(shippingAddress).trim());
      request.input('phone', sql.NVarChar, String(phone).trim());
      request.input('paymentMethod', sql.NVarChar, String(paymentMethod).trim().toUpperCase());
      request.input('status', sql.NVarChar, 'Waiting');

      const orderColumns = ['user_id', 'total', 'shipping_address', 'phone', 'payment_method', 'status'];
      const orderValues = ['@userId', '@total', '@shippingAddress', '@phone', '@paymentMethod', '@status'];
      if (safeIdempotencyKey && hasColumn(checkoutCapabilities.orderColumns, 'checkout_idempotency_key')) {
        request.input('idempotencyKey', sql.NVarChar, safeIdempotencyKey);
        orderColumns.push('checkout_idempotency_key');
        orderValues.push('@idempotencyKey');
      }
      if (hasColumn(checkoutCapabilities.orderColumns, 'inventory_status')) {
        request.input('inventoryStatus', sql.NVarChar, 'RESERVED');
        orderColumns.push('inventory_status');
        orderValues.push('@inventoryStatus');
      }

      const orderResult = await request.query(
        `INSERT INTO orders (${orderColumns.join(', ')})
         OUTPUT INSERTED.id AS id
         VALUES (${orderValues.join(', ')})`
      );

      const orderId = orderResult.recordset?.[0]?.id;
      if (!orderId) throw new Error('Khong tao duoc don hang');

      for (const item of preparedItems) {
        const reservation = await createInventoryReservation(transaction, item, {
          cartId: cart.cartId || null,
          orderId,
          userId,
        });
        const stockAfter = await decrementInventory(transaction, item);
        if (stockAfter === null) {
          await transaction.rollback();
          return { code: 400, message: `San pham ${item.productName} khong du ton kho` };
        }

        await insertOrderItem(transaction, orderId, item, capabilities);
        await recordInventoryTransaction(transaction, {
          productId: item.productId,
          variantId: item.variantId,
          orderId,
          cartId: cart.cartId || null,
          reservationId: reservation?.id || null,
          transactionType: 'RESERVE',
          quantity: -item.quantity,
          stockBefore: item.stockBefore,
          stockAfter,
          metadata: { paymentMethod, idempotencyKey: safeIdempotencyKey || null },
        });
        await confirmInventoryReservation(transaction, reservation?.id);
        await recordInventoryTransaction(transaction, {
          productId: item.productId,
          variantId: item.variantId,
          orderId,
          cartId: cart.cartId || null,
          reservationId: reservation?.id || null,
          transactionType: 'COMMIT',
          quantity: 0,
          stockBefore: stockAfter,
          stockAfter,
          metadata: { orderStatus: 'Waiting' },
        });
      }

      await transaction.commit();
      try {
        await markCartCheckedOut({ type: 'user', key: userId });
      } catch (error) {
        console.warn('Order committed but cart checkout marker failed:', error.message);
      }
      try {
        await Promise.all([...new Set(preparedItems.map((item) => item.productId))].map((id) => invalidateProductCache(id)));
      } catch (error) {
        console.warn('Order committed but product cache invalidation failed:', error.message);
      }

      // Sync variant stock_quantity for decant/full-bottle products
      try {
        await Promise.all(
          [...new Set(preparedItems.filter((item) => item.isDecant || item.isFullBottle).map((item) => item.productId))]
            .map((id) => syncVariantStock(id))
        );
      } catch (error) {
        console.warn('Order committed but variant stock sync failed:', error.message);
      }

      const createdOrder = await getOrderByIdForUser(orderId, userId);
      return { order: createdOrder };
    } catch (error) {
      try { await transaction?.rollback(); } catch {}
      if (safeIdempotencyKey && /duplicate|unique|UX_orders_checkout_idempotency/i.test(String(error.message || ''))) {
        const rows = await query(
          'SELECT TOP 1 id FROM orders WHERE user_id = ? AND checkout_idempotency_key = ? ORDER BY id DESC',
          [userId, safeIdempotencyKey]
        );
        if (rows[0]?.id) return { order: await getOrderByIdForUser(rows[0].id, userId), idempotent: true };
      }
      throw error;
    } finally {
      await releaseRedisReservations(redisReservationKeys);
    }
  });
}

function buildOrderItemSelect(capabilities) {
  const variantSelect = hasOrderItemVariantColumn(capabilities)
    ? 'oi.product_variant_id'
    : 'NULL AS product_variant_id';
  return `
    SELECT oi.id AS item_id, oi.product_id, ${variantSelect}, p.name AS product_name,
           COALESCE(pv.image, p.image) AS product_image,
           oi.quantity, oi.price, oi.price_at_purchase, oi.selected_batch_code
    FROM order_items oi
    INNER JOIN products p ON p.id = oi.product_id
    ${capabilities.hasVariants && hasOrderItemVariantColumn(capabilities)
      ? 'LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id'
      : 'LEFT JOIN (SELECT NULL AS id, NULL AS image) pv ON 1 = 0'}
  `;
}

export async function getOrderByIdForUser(orderId, userId) {
  const orderRows = await query(
    `SELECT TOP 1 o.id, o.user_id, u.name AS user_name, o.total, o.shipping_address, o.phone,
            o.payment_method, o.momo_order_id, o.momo_trans_id, o.zalopay_app_trans_id,
            o.status, o.created_at
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     WHERE o.id = ? AND o.user_id = ?`,
    [orderId, userId]
  );
  const order = orderRows[0];
  if (!order) return null;

  const capabilities = await getProductStorageCapabilities();
  const itemRows = await query(
    `${buildOrderItemSelect(capabilities)}
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );

  return toOrder(order, itemRows.map(toOrderItem));
}

export async function listOrderHistory(userId) {
  const orderRows = await query(
    `SELECT o.id, o.user_id, u.name AS user_name, o.total, o.shipping_address, o.phone,
            o.payment_method, o.momo_order_id, o.momo_trans_id, o.zalopay_app_trans_id,
            o.status, o.created_at
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     WHERE o.user_id = ?
     ORDER BY o.id DESC`,
    [userId]
  );

  const capabilities = await getProductStorageCapabilities();
  const orders = [];
  for (const orderRow of orderRows) {
    const itemRows = await query(
      `${buildOrderItemSelect(capabilities)}
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [orderRow.id]
    );
    orders.push(toOrder(orderRow, itemRows.map(toOrderItem)));
  }
  return orders;
}

async function restoreInventory(transaction, item) {
  // ── decant restore ──
  if (item.isDecant) {
    const neededMl = (item.decantVolumeMl || 0) * (item.quantity || 0);
    const result = await restoreDecantInventory(transaction, {
      productId: item.product_id,
      neededMl,
      isFullBottle: false,
    });
    return { stock_before: result.openedMl - neededMl, stock_after: result.openedMl };
  }

  // ── full bottle restore via product_inventory ──
  if (item.isFullBottle) {
    const result = await restoreDecantInventory(transaction, {
      productId: item.product_id,
      neededMl: 0,
      isFullBottle: true,
    });
    return { stock_before: result.sealedBottles - 1, stock_after: result.sealedBottles };
  }

  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, item.product_id);
  request.input('quantity', sql.Int, item.quantity);

  if (item.product_variant_id) {
    request.input('variantId', sql.Int, item.product_variant_id);
    const result = await request.query(
      `UPDATE product_variants
       SET stock_quantity = stock_quantity + @quantity
       OUTPUT deleted.stock_quantity AS stock_before, inserted.stock_quantity AS stock_after
       WHERE id = @variantId AND product_id = @productId`
    );
    return result.recordset?.[0] || null;
  }

  const result = await request.query(
    `UPDATE products
     SET stock = stock + @quantity
     OUTPUT deleted.stock AS stock_before, inserted.stock AS stock_after
     WHERE id = @productId`
  );
  return result.recordset?.[0] || null;
}

async function findReservationForOrderItem(transaction, orderId, item, checkoutCapabilities) {
  if (!checkoutCapabilities.hasInventoryReservations) return null;

  const request = new sql.Request(transaction);
  request.input('orderId', sql.Int, orderId);
  request.input('productId', sql.Int, item.product_id);
  request.input('variantId', sql.Int, item.product_variant_id || null);
  const result = await request.query(
    `SELECT TOP 1 id
     FROM inventory_reservations WITH (UPDLOCK, ROWLOCK)
     WHERE order_id = @orderId
       AND product_id = @productId
       AND ISNULL(product_variant_id, 0) = ISNULL(@variantId, 0)
       AND status = 'CONFIRMED'
     ORDER BY id DESC`
  );

  return result.recordset?.[0]?.id || null;
}

function isCancelledStatus(status) {
  return /cancelled|da huy|đã hủy/i.test(String(status || ''));
}

function isRefundedStatus(status) {
  return /refunded|hoàn tiền|hoan tien/i.test(String(status || ''));
}

async function releaseCancelledOrderInventory({ orderId, userId = null, enforceCustomerWindow = false }) {
  const capabilities = await getProductStorageCapabilities();
  const checkoutCapabilities = await getCheckoutStorageCapabilities();
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const orderRequest = new sql.Request(transaction);
    orderRequest.input('orderId', sql.Int, orderId);
    if (userId) orderRequest.input('userId', sql.Int, userId);
    const ownerClause = userId ? 'AND user_id = @userId' : '';
    const orderResult = await orderRequest.query(
      `SELECT TOP 1 id, user_id, status, created_at
       FROM orders WITH (UPDLOCK, ROWLOCK)
       WHERE id = @orderId ${ownerClause}`
    );

    const order = orderResult.recordset?.[0];
    if (!order) {
      await transaction.rollback();
      return { code: 404, message: 'Khong tim thay don hang' };
    }
    if (isCancelledStatus(order.status) || isRefundedStatus(order.status)) {
      await transaction.rollback();
      return { code: 400, message: 'Đơn hàng đã bị hủy hoặc hoàn tiền' };
    }

    if (enforceCustomerWindow) {
      const createdAt = new Date(order.created_at);
      const diffMinutes = (Date.now() - createdAt.getTime()) / (1000 * 60);
      if (diffMinutes > 5) {
        await transaction.rollback();
        return { code: 400, message: 'Chi co the huy don trong 5 phut dau' };
      }
    }

    const statusRequest = new sql.Request(transaction);
    statusRequest.input('orderId', sql.Int, orderId);
    await statusRequest.query(
      hasColumn(checkoutCapabilities.orderColumns, 'inventory_status')
        ? "UPDATE orders SET status = 'Cancelled', inventory_status = 'RELEASED' WHERE id = @orderId"
        : "UPDATE orders SET status = 'Cancelled' WHERE id = @orderId"
    );

    const variantSelect = hasOrderItemVariantColumn(capabilities)
      ? 'oi.product_variant_id'
      : 'NULL AS product_variant_id';
    const variantJoinClause = capabilities.hasVariants && hasOrderItemVariantColumn(capabilities)
      ? 'LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id'
      : '';
    const variantMetaSelect = capabilities.hasVariants && hasOrderItemVariantColumn(capabilities)
      ? 'pv.variant_type, pv.volume_ml AS variant_volume_ml'
      : 'NULL AS variant_type, NULL AS variant_volume_ml';
    const itemRequest = new sql.Request(transaction);
    itemRequest.input('orderId', sql.Int, orderId);
    const itemResult = await itemRequest.query(
      `SELECT oi.product_id, ${variantSelect}, oi.quantity,
              ${variantMetaSelect}
       FROM order_items oi
       ${variantJoinClause}
       WHERE oi.order_id = @orderId`
    );

    for (const item of itemResult.recordset || []) {
      const variantType = String(item.variant_type || '').toUpperCase();
      const enrichedItem = {
        ...item,
        isDecant: variantType === 'DECANT',
        isFullBottle: variantType === 'FULL',
        decantVolumeMl: Number(item.variant_volume_ml) || 0,
      };
      const stock = await restoreInventory(transaction, enrichedItem);
      const reservationId = await findReservationForOrderItem(transaction, orderId, enrichedItem, checkoutCapabilities);
      await releaseInventoryReservation(transaction, reservationId);
      await recordInventoryTransaction(transaction, {
        productId: enrichedItem.product_id,
        variantId: enrichedItem.product_variant_id,
        orderId,
        reservationId,
        transactionType: 'RELEASE',
        quantity: Number(item.quantity || 0),
        stockBefore: stock?.stock_before ?? null,
        stockAfter: stock?.stock_after ?? null,
        metadata: { reason: 'order_cancelled' },
      });
    }

    await transaction.commit();
    try {
      await Promise.all([...new Set((itemResult.recordset || []).map((item) => item.product_id))].map((id) => invalidateProductCache(id)));
    } catch (error) {
      console.warn('Order cancelled but product cache invalidation failed:', error.message);
    }

    // Sync variant stock for decant products after cancellation
    try {
      const decantProductIds = [...new Set((itemResult.recordset || [])
        .filter((item) => String(item.variant_type || '').toUpperCase() === 'DECANT' || String(item.variant_type || '').toUpperCase() === 'FULL')
        .map((item) => item.product_id))];
      if (decantProductIds.length > 0) {
        await Promise.all(decantProductIds.map((id) => syncVariantStock(id)));
      }
    } catch (error) {
      console.warn('Order cancelled but variant stock sync failed:', error.message);
    }
    return { ok: true };
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    throw error;
  }
}

export async function cancelOrder(userId, orderId) {
  return releaseCancelledOrderInventory({ orderId, userId, enforceCustomerWindow: true });
}

export async function cancelOrderForAdmin(orderId) {
  return releaseCancelledOrderInventory({ orderId });
}
