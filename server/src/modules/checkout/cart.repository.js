import { getDbPool, query, sql } from '../../config/database.js';
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

function hasColumn(columns, name) {
  return columns.has(String(name).toLowerCase());
}

function supportsGuestCart(capabilities) {
  return hasColumn(capabilities.cartColumns, 'cart_token');
}

function supportsCartStatus(capabilities) {
  return hasColumn(capabilities.cartColumns, 'status');
}

function supportsCartUpdatedAt(capabilities) {
  return hasColumn(capabilities.cartColumns, 'updated_at');
}

function supportsCartExpiresAt(capabilities) {
  return hasColumn(capabilities.cartColumns, 'expires_at');
}

function supportsCartItemVariant(capabilities) {
  return hasColumn(capabilities.cartItemColumns, 'product_variant_id');
}

function supportsCartItemUnitPrice(capabilities) {
  return hasColumn(capabilities.cartItemColumns, 'unit_price');
}

function supportsCartItemUpdatedAt(capabilities) {
  return hasColumn(capabilities.cartItemColumns, 'updated_at');
}

function cartScopeSql(scope, alias = 'c', capabilities = null) {
  if (scope.type === 'user') return `${alias}.user_id = @userId`;
  if (capabilities && !supportsGuestCart(capabilities)) return null;
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
  if (scope.type === 'guest' && !supportsGuestCart(capabilities)) return null;

  const params = scope.type === 'user' ? [Number(scope.key)] : [String(scope.key)];
  const where = scope.type === 'user' ? 'user_id = ?' : 'cart_token = ?';
  const statusWhere = supportsCartStatus(capabilities) ? "status = 'ACTIVE' AND " : '';
  const statusSelect = supportsCartStatus(capabilities) ? 'status' : "N'ACTIVE' AS status";
  const cartTokenSelect = supportsGuestCart(capabilities) ? 'cart_token' : 'NULL AS cart_token';
  const rows = await query(
    `SELECT TOP 1 id, user_id, ${cartTokenSelect}, ${statusSelect}
     FROM carts
     WHERE ${statusWhere}${where}
     ORDER BY id DESC`,
    params
  );
  return rows[0] || null;
}

export async function ensureActiveCart(scope, transaction) {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;
  if (scope.type === 'guest' && !supportsGuestCart(capabilities)) return null;

  const request = new sql.Request(transaction);
  bindScope(request, scope);
  const scopeSql = cartScopeSql(scope, 'carts', capabilities);
  if (!scopeSql) return null;
  const statusWhere = supportsCartStatus(capabilities) ? "status = 'ACTIVE' AND " : '';
  const result = await request.query(
    `SELECT TOP 1 id
     FROM carts WITH (UPDLOCK, HOLDLOCK)
     WHERE ${statusWhere}${scopeSql}
     ORDER BY id DESC`
  );

  const existingId = result.recordset?.[0]?.id;
  if (existingId) return existingId;

  const insertRequest = new sql.Request(transaction);
  if (scope.type === 'user') {
    insertRequest.input('userId', sql.Int, Number(scope.key));
    const columns = ['user_id'];
    const values = ['@userId'];
    if (supportsCartStatus(capabilities)) {
      columns.push('status');
      values.push("'ACTIVE'");
    }
    const insertResult = await insertRequest.query(
      `INSERT INTO carts (${columns.join(', ')})
       OUTPUT INSERTED.id AS id
       VALUES (${values.join(', ')})`
    );
    return insertResult.recordset?.[0]?.id;
  }

  insertRequest.input('cartToken', sql.NVarChar, String(scope.key));
  const columns = ['cart_token'];
  const values = ['@cartToken'];
  if (supportsCartStatus(capabilities)) {
    columns.push('status');
    values.push("'ACTIVE'");
  }
  if (supportsCartExpiresAt(capabilities)) {
    columns.push('expires_at');
    values.push('DATEADD(day, 30, SYSUTCDATETIME())');
  }
  const insertResult = await insertRequest.query(
    `INSERT INTO carts (${columns.join(', ')})
     OUTPUT INSERTED.id AS id
     VALUES (${values.join(', ')})`
  );
  return insertResult.recordset?.[0]?.id;
}

function buildCartItemSelect(capabilities) {
  const hasVariantColumn = supportsCartItemVariant(capabilities);
  const productVariantSelect = hasVariantColumn ? 'ci.product_variant_id' : 'NULL AS product_variant_id';
  const unitPriceSelect = supportsCartItemUnitPrice(capabilities) ? 'ci.unit_price' : 'NULL AS unit_price';
  const variantJoin = capabilities.hasVariants && hasVariantColumn
    ? 'LEFT JOIN product_variants pv ON pv.id = ci.product_variant_id'
    : 'LEFT JOIN (SELECT NULL AS id, NULL AS sku, NULL AS barcode, NULL AS volume_ml, NULL AS volume_label, NULL AS variant_type, NULL AS price, NULL AS sale_price, NULL AS stock_quantity, NULL AS image, NULL AS status) pv ON 1 = 0';

  return `
    SELECT
      ci.id AS cart_item_id,
      ci.cart_id,
      ci.product_id,
      ${productVariantSelect},
      ci.quantity,
      ${unitPriceSelect},
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

async function backfillLegacyVariantSelections(cartId, capabilities) {
  if (!capabilities.hasVariants || !supportsCartItemVariant(capabilities)) return;

  const variantPredicates = [
    'pv.product_id = ci.product_id',
    'ISNULL(pv.stock_quantity, 0) >= ci.quantity',
    'ISNULL(pv.price, 0) > 0',
  ];
  if (hasColumn(capabilities.variantColumns, 'status')) {
    variantPredicates.push('ISNULL(pv.status, 1) = 1');
  }
  if (hasColumn(capabilities.variantColumns, 'deleted_at')) {
    variantPredicates.push('pv.deleted_at IS NULL');
  }

  const unitPriceAssignment = supportsCartItemUnitPrice(capabilities)
    ? ', unit_price = CASE WHEN ISNULL(fallback.sale_price, 0) > 0 AND fallback.sale_price < fallback.price THEN fallback.sale_price ELSE fallback.price END'
    : '';

  await query(
    `UPDATE ci
     SET product_variant_id = fallback.id${unitPriceAssignment}
     FROM cart_items ci
     CROSS APPLY (
       SELECT TOP 1 pv.id, pv.price, pv.sale_price
       FROM product_variants pv
       WHERE ${variantPredicates.join(' AND ')}
       ORDER BY pv.id ASC
     ) fallback
     WHERE ci.cart_id = ?
       AND ci.product_variant_id IS NULL`,
    [cartId]
  );
}

export async function getDurableCart(scope) {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;
  if (scope.type === 'guest' && !supportsGuestCart(capabilities)) return null;

  const cart = await findActiveCart(scope);
  if (!cart) return { items: [], total: 0, itemCount: 0, cartId: null };

  await backfillLegacyVariantSelections(cart.id, capabilities);

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
  if (scope.type === 'guest' && !supportsGuestCart(capabilities)) return null;
  if (selection.variantId && !supportsCartItemVariant(capabilities)) {
    return { code: 500, message: 'Schema cart_items chua ho tro product_variant_id' };
  }

  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const cartId = await ensureActiveCart(scope, transaction);
    if (!cartId) {
      await transaction.rollback();
      return null;
    }
    const productId = Number(selection.productId);
    const variantId = supportsCartItemVariant(capabilities) && selection.variantId ? Number(selection.variantId) : null;
    const existingRequest = new sql.Request(transaction);
    existingRequest.input('cartId', sql.Int, cartId);
    existingRequest.input('productId', sql.Int, productId);
    if (supportsCartItemVariant(capabilities)) existingRequest.input('variantId', sql.Int, variantId);
    const variantWhere = supportsCartItemVariant(capabilities)
      ? 'AND ISNULL(product_variant_id, 0) = ISNULL(@variantId, 0)'
      : '';
    const existingResult = await existingRequest.query(
      `SELECT TOP 1 id, quantity
       FROM cart_items WITH (UPDLOCK, HOLDLOCK)
       WHERE cart_id = @cartId
         AND product_id = @productId
         ${variantWhere}`
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
      if (supportsCartItemUnitPrice(capabilities)) updateRequest.input('unitPrice', sql.Float, selection.unitPrice);
      const assignments = ['quantity = @quantity'];
      if (supportsCartItemUnitPrice(capabilities)) assignments.push('unit_price = @unitPrice');
      if (supportsCartItemUpdatedAt(capabilities)) assignments.push('updated_at = SYSUTCDATETIME()');
      await updateRequest.query(
        `UPDATE cart_items
         SET ${assignments.join(', ')}
         WHERE id = @itemId`
      );
    } else {
      const insertRequest = new sql.Request(transaction);
      insertRequest.input('cartId', sql.Int, cartId);
      insertRequest.input('productId', sql.Int, productId);
      insertRequest.input('quantity', sql.Int, nextQuantity);
      const insertColumns = ['cart_id', 'product_id', 'quantity'];
      const insertValues = ['@cartId', '@productId', '@quantity'];
      if (supportsCartItemVariant(capabilities)) {
        insertRequest.input('variantId', sql.Int, variantId);
        insertColumns.splice(2, 0, 'product_variant_id');
        insertValues.splice(2, 0, '@variantId');
      }
      if (supportsCartItemUnitPrice(capabilities)) {
        insertRequest.input('unitPrice', sql.Float, selection.unitPrice);
        insertColumns.push('unit_price');
        insertValues.push('@unitPrice');
      }
      await insertRequest.query(
        `INSERT INTO cart_items (${insertColumns.join(', ')})
         VALUES (${insertValues.join(', ')})`
      );
    }

    if (supportsCartUpdatedAt(capabilities)) {
      const touchRequest = new sql.Request(transaction);
      touchRequest.input('cartId', sql.Int, cartId);
      await touchRequest.query('UPDATE carts SET updated_at = SYSUTCDATETIME() WHERE id = @cartId');
    }

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
  if (scope.type === 'guest' && !supportsGuestCart(capabilities)) return null;

  const cart = await findActiveCart(scope);
  if (!cart) return getDurableCart(scope);

  const params = [cart.id, Number(productId)];
  let variantSql = '';
  if (supportsCartItemVariant(capabilities) && variantId !== null && variantId !== undefined && variantId !== '') {
    variantSql = 'AND ISNULL(product_variant_id, 0) = ISNULL(?, 0)';
    params.push(Number(variantId));
  }

  await query(
    `DELETE FROM cart_items
     WHERE cart_id = ? AND product_id = ? ${variantSql}`,
    params
  );
  if (supportsCartUpdatedAt(capabilities)) {
    await query('UPDATE carts SET updated_at = SYSUTCDATETIME() WHERE id = ?', [cart.id]);
  }
  return getDurableCart(scope);
}

export async function clearDurableCart(scope, status = 'ACTIVE') {
  const capabilities = await getCheckoutStorageCapabilities();
  if (!capabilities.hasDurableCart) return null;
  if (scope.type === 'guest' && !supportsGuestCart(capabilities)) return null;

  const cart = await findActiveCart(scope);
  if (!cart) return { items: [], total: 0, itemCount: 0, cartId: null };

  if ((status === 'CHECKED_OUT' || status === 'ABANDONED') && supportsCartStatus(capabilities)) {
    await query('UPDATE carts SET status = ?, updated_at = SYSUTCDATETIME() WHERE id = ?', [status, cart.id]);
  } else {
    await query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    if (supportsCartUpdatedAt(capabilities)) {
      await query('UPDATE carts SET updated_at = SYSUTCDATETIME() WHERE id = ?', [cart.id]);
    }
  }

  return { items: [], total: 0, itemCount: 0, cartId: null };
}
