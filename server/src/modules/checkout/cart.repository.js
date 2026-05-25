import sql from 'mssql';
import { getDbPool, query } from '../../config/database.js';
import { getCheckoutStorageCapabilities } from './checkout.storage.js';

function positiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function nonNegativeInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function resolvePrice(originalPrice, salePrice) {
  const original = positiveNumber(originalPrice);
  const sale = positiveNumber(salePrice);
  return sale && original && sale < original ? sale : original;
}

function cartScopeSql(scope, alias = 'c') {
  if (scope.type === 'user') return `${alias}.user_id = @userId`;
  return `${alias}.cart_token = @cartToken`;
}

function bindScope(request, scope) {
  if (scope.type === 'user') {
    request.input('userId', sql.Int, Number(scope.key));
  } else {
    request.input('cartToken', sql.NVarChar, String(scope.key));
  }
}

export async function hasDurableCartStorage() {
  const capabilities = await getCheckoutStorageCapabilities();
  return capabilities.hasDurableCart;
}

export async function findActiveCart(scope) {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;

  const params = scope.type === 'user' ? [Number(scope.key)] : [String(scope.key)];
  const where = scope.type === 'user' ? 'user_id = ?' : 'cart_token = ?';
  const rows = await query(
    `SELECT TOP 1 id, user_id, cart_token, status
     FROM carts
     WHERE status = 'ACTIVE' AND ${where}
     ORDER BY id DESC`,
    params
  );
  return rows[0] || null;
}

export async function ensureActiveCart(scope, transaction) {
  const request = new sql.Request(transaction);
  bindScope(request, scope);
  const result = await request.query(
    `SELECT TOP 1 id
     FROM carts WITH (UPDLOCK, HOLDLOCK)
     WHERE status = 'ACTIVE' AND ${cartScopeSql(scope)}
     ORDER BY id DESC`
  );

  const existingId = result.recordset?.[0]?.id;
  if (existingId) return existingId;

  const insertRequest = new sql.Request(transaction);
  if (scope.type === 'user') {
    insertRequest.input('userId', sql.Int, Number(scope.key));
    const insertResult = await insertRequest.query(
      `INSERT INTO carts (user_id, status)
       OUTPUT INSERTED.id AS id
       VALUES (@userId, 'ACTIVE')`
    );
    return insertResult.recordset?.[0]?.id;
  }

  insertRequest.input('cartToken', sql.NVarChar, String(scope.key));
  const insertResult = await insertRequest.query(
    `INSERT INTO carts (cart_token, status, expires_at)
     OUTPUT INSERTED.id AS id
     VALUES (@cartToken, 'ACTIVE', DATEADD(day, 30, SYSUTCDATETIME()))`
  );
  return insertResult.recordset?.[0]?.id;
}

function buildCartItemSelect(capabilities) {
  const variantJoin = capabilities.hasVariants
    ? 'LEFT JOIN product_variants pv ON pv.id = ci.product_variant_id'
    : 'LEFT JOIN (SELECT NULL AS id, NULL AS sku, NULL AS barcode, NULL AS volume_ml, NULL AS volume_label, NULL AS variant_type, NULL AS price, NULL AS sale_price, NULL AS stock_quantity, NULL AS image, NULL AS status) pv ON 1 = 0';

  return `
    SELECT
      ci.id AS cart_item_id,
      ci.cart_id,
      ci.product_id,
      ci.product_variant_id,
      ci.quantity,
      ci.unit_price,
      p.name AS product_name,
      p.image AS product_image,
      p.price AS product_price,
      p.discount_price AS product_discount_price,
      p.stock AS product_stock,
      p.status AS product_status,
      c.id AS category_id,
      c.name AS category_name,
      b.id AS brand_id,
      b.name AS brand_name,
      pv.id AS variant_id,
      pv.sku AS variant_sku,
      pv.barcode AS variant_barcode,
      pv.volume_ml AS variant_volume_ml,
      pv.volume_label AS variant_volume_label,
      pv.variant_type AS variant_type,
      pv.price AS variant_price,
      pv.sale_price AS variant_sale_price,
      pv.stock_quantity AS variant_stock_quantity,
      pv.image AS variant_image,
      pv.status AS variant_status
    FROM cart_items ci
    INNER JOIN carts cart ON cart.id = ci.cart_id
    INNER JOIN products p ON p.id = ci.product_id
    LEFT JOIN categories c ON c.id = p.id_category
    LEFT JOIN brand b ON b.id = p.id_brand
    ${variantJoin}
  `;
}

function normalizeCartRow(row) {
  const hasVariant = Boolean(row.variant_id);
  const originalPrice = hasVariant ? positiveNumber(row.variant_price) : positiveNumber(row.product_price);
  const salePrice = hasVariant ? positiveNumber(row.variant_sale_price) : positiveNumber(row.product_discount_price);
  const price = resolvePrice(originalPrice, salePrice) ?? positiveNumber(row.unit_price) ?? 0;
  const stockQuantity = hasVariant ? nonNegativeInt(row.variant_stock_quantity) : nonNegativeInt(row.product_stock);
  const quantity = nonNegativeInt(row.quantity);
  const variant = hasVariant
    ? {
        id: row.variant_id,
        variantId: row.variant_id,
        sku: row.variant_sku || '',
        barcode: row.variant_barcode || '',
        volumeMl: row.variant_volume_ml ? Number(row.variant_volume_ml) : null,
        volume: row.variant_volume_label || (row.variant_volume_ml ? `${row.variant_volume_ml}ml` : ''),
        type: row.variant_type || '',
        price: originalPrice,
        salePrice: salePrice && originalPrice && salePrice < originalPrice ? salePrice : null,
        originalPrice,
        stockQuantity,
        stock: stockQuantity,
        image: row.variant_image || '',
        status: row.variant_status !== false,
        isAvailable: row.variant_status !== false && stockQuantity > 0 && Boolean(price),
      }
    : null;

  return {
    id: row.cart_item_id,
    cartId: row.cart_id,
    product: {
      id: row.product_id,
      variantId: row.product_variant_id || null,
      name: row.product_name || '',
      image: row.variant_image || row.product_image || '',
      price: originalPrice,
      salePrice: salePrice && originalPrice && salePrice < originalPrice ? salePrice : null,
      discountPrice: salePrice && originalPrice && salePrice < originalPrice ? salePrice : null,
      originalPrice,
      stock: stockQuantity,
      stockQuantity,
      status: row.product_status !== false,
      brand: row.brand_id ? { id: row.brand_id, name: row.brand_name } : null,
      category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
      selectedVariant: variant,
    },
    quantity,
    price,
    subtotal: price * quantity,
  };
}

export async function getDurableCart(scope) {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;

  const cart = await findActiveCart(scope);
  if (!cart) return { items: [], total: 0, itemCount: 0, cartId: null };

  const rows = await query(
    `${buildCartItemSelect(capabilities)}
     WHERE cart.id = ?
     ORDER BY ci.id ASC`,
    [cart.id]
  );
  const items = rows.map(normalizeCartRow);
  return {
    cartId: cart.id,
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export async function upsertDurableCartItem(scope, selection, quantity, mode = 'add') {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;

  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const cartId = await ensureActiveCart(scope, transaction);
    const productId = Number(selection.productId);
    const variantId = selection.variantId ? Number(selection.variantId) : null;
    const existingRequest = new sql.Request(transaction);
    existingRequest.input('cartId', sql.Int, cartId);
    existingRequest.input('productId', sql.Int, productId);
    existingRequest.input('variantId', sql.Int, variantId);
    const existingResult = await existingRequest.query(
      `SELECT TOP 1 id, quantity
       FROM cart_items WITH (UPDLOCK, HOLDLOCK)
       WHERE cart_id = @cartId
         AND product_id = @productId
         AND ISNULL(product_variant_id, 0) = ISNULL(@variantId, 0)`
    );

    const existing = existingResult.recordset?.[0];
    const nextQuantity = mode === 'set'
      ? quantity
      : Number(existing?.quantity || 0) + quantity;

    if (nextQuantity > selection.stockQuantity) {
      await transaction.rollback();
      return { code: 400, message: 'So luong vuot qua ton kho' };
    }

    if (existing) {
      const updateRequest = new sql.Request(transaction);
      updateRequest.input('itemId', sql.Int, existing.id);
      updateRequest.input('quantity', sql.Int, nextQuantity);
      updateRequest.input('unitPrice', sql.Float, selection.unitPrice);
      await updateRequest.query(
        `UPDATE cart_items
         SET quantity = @quantity, unit_price = @unitPrice, updated_at = SYSUTCDATETIME()
         WHERE id = @itemId`
      );
    } else {
      const insertRequest = new sql.Request(transaction);
      insertRequest.input('cartId', sql.Int, cartId);
      insertRequest.input('productId', sql.Int, productId);
      insertRequest.input('variantId', sql.Int, variantId);
      insertRequest.input('quantity', sql.Int, nextQuantity);
      insertRequest.input('unitPrice', sql.Float, selection.unitPrice);
      await insertRequest.query(
        `INSERT INTO cart_items (cart_id, product_id, product_variant_id, quantity, unit_price)
         VALUES (@cartId, @productId, @variantId, @quantity, @unitPrice)`
      );
    }

    const touchRequest = new sql.Request(transaction);
    touchRequest.input('cartId', sql.Int, cartId);
    await touchRequest.query('UPDATE carts SET updated_at = SYSUTCDATETIME() WHERE id = @cartId');

    await transaction.commit();
    return getDurableCart(scope);
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    throw error;
  }
}

export async function removeDurableCartItem(scope, productId, variantId = null) {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;

  const cart = await findActiveCart(scope);
  if (!cart) return getDurableCart(scope);

  const params = [cart.id, Number(productId)];
  let variantSql = '';
  if (variantId !== null && variantId !== undefined && variantId !== '') {
    variantSql = 'AND ISNULL(product_variant_id, 0) = ISNULL(?, 0)';
    params.push(Number(variantId));
  }

  await query(
    `DELETE FROM cart_items
     WHERE cart_id = ? AND product_id = ? ${variantSql}`,
    params
  );
  await query('UPDATE carts SET updated_at = SYSUTCDATETIME() WHERE id = ?', [cart.id]);
  return getDurableCart(scope);
}

export async function clearDurableCart(scope, status = 'ACTIVE') {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;

  const cart = await findActiveCart(scope);
  if (!cart) return { items: [], total: 0, itemCount: 0, cartId: null };

  if (status === 'CHECKED_OUT' || status === 'ABANDONED') {
    await query('UPDATE carts SET status = ?, updated_at = SYSUTCDATETIME() WHERE id = ?', [status, cart.id]);
  } else {
    await query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    await query('UPDATE carts SET updated_at = SYSUTCDATETIME() WHERE id = ?', [cart.id]);
  }

  return { items: [], total: 0, itemCount: 0, cartId: null };
}
