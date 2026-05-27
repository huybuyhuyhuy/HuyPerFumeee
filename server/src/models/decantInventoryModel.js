import { query, sql } from '../config/database.js';

// ── helpers ──────────────────────────────────────────────
function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

// ── read current inventory ───────────────────────────────
export async function getProductInventory(productId) {
  const rows = await query(
    `SELECT sealed_bottles, opened_ml, bottle_volume_ml
     FROM product_inventory WHERE product_id = ?`,
    [productId]
  );
  if (rows.length === 0) return { sealedBottles: 0, openedMl: 0, bottleVolumeMl: 100 };
  return {
    sealedBottles: toInt(rows[0].sealed_bottles),
    openedMl: toInt(rows[0].opened_ml),
    bottleVolumeMl: toInt(rows[0].bottle_volume_ml) || 100,
  };
}

// ── ensure a product_inventory row exists ────────────────
export async function ensureProductInventory(transaction, productId, bottleVolumeMl = 100) {
  const req = new sql.Request(transaction);
  req.input('productId', sql.Int, productId);
  req.input('bottleVolumeMl', sql.Int, bottleVolumeMl);

  const existing = await req.query(
    `SELECT id FROM product_inventory WITH (UPDLOCK, ROWLOCK) WHERE product_id = @productId`
  );
  if (existing.recordset?.length > 0) return existing.recordset[0].id;

  const insert = await req.query(
    `INSERT INTO product_inventory (product_id, sealed_bottles, opened_ml, bottle_volume_ml)
     VALUES (@productId, 0, 0, @bottleVolumeMl);
     SELECT SCOPE_IDENTITY() AS id`
  );
  return insert.recordset?.[0]?.id;
}

// ── compute available decant units ───────────────────────
export async function computeDecantStock(transaction, productId, decantVolumeMl) {
  const req = new sql.Request(transaction);
  req.input('productId', sql.Int, productId);

  const result = await req.query(
    `SELECT sealed_bottles, opened_ml, bottle_volume_ml
     FROM product_inventory WITH (UPDLOCK, ROWLOCK)
     WHERE product_id = @productId`
  );
  const row = result.recordset?.[0];
  if (!row) return { units: 0, totalAvailableMl: 0, sealedBottles: 0, openedMl: 0 };

  const sealedBottles = toInt(row.sealed_bottles);
  const openedMl = toInt(row.opened_ml);
  const bottleVolumeMl = toInt(row.bottle_volume_ml) || 100;
  const totalAvailableMl = openedMl + sealedBottles * bottleVolumeMl;
  const units = decantVolumeMl > 0 ? Math.floor(totalAvailableMl / decantVolumeMl) : 0;

  return { units, totalAvailableMl, sealedBottles, openedMl, bottleVolumeMl };
}

// ── insert a movement record ─────────────────────────────
async function insertMovement(transaction, entry) {
  const req = new sql.Request(transaction);
  req.input('productId', sql.Int, entry.productId);
  req.input('orderId', sql.Int, entry.orderId || null);
  req.input('orderItemId', sql.Int, entry.orderItemId || null);
  req.input('movementType', sql.NVarChar, entry.movementType);
  req.input('sealedBefore', sql.Int, entry.sealedBefore);
  req.input('sealedAfter', sql.Int, entry.sealedAfter);
  req.input('openedBefore', sql.Int, entry.openedBefore);
  req.input('openedAfter', sql.Int, entry.openedAfter);
  req.input('quantityMl', sql.Int, entry.quantityMl || null);
  req.input('quantityBottles', sql.Int, entry.quantityBottles || null);
  req.input('reference', sql.NVarChar, entry.reference || null);

  await req.query(
    `INSERT INTO inventory_movements
       (product_id, order_id, order_item_id, movement_type,
        sealed_bottles_before, sealed_bottles_after,
        opened_ml_before, opened_ml_after,
        quantity_ml, quantity_bottles, reference)
     VALUES (@productId, @orderId, @orderItemId, @movementType,
             @sealedBefore, @sealedAfter, @openedBefore, @openedAfter,
             @quantityMl, @quantityBottles, @reference)`
  );
}

// ── CORE: decrement for decant sale ──────────────────────
// Auto-opens sealed bottles when opened_ml is insufficient.
export async function decrementDecantInventory(transaction, {
  productId, neededMl, orderId = null, orderItemId = null,
}) {
  await ensureProductInventory(transaction, productId);

  const req = new sql.Request(transaction);
  req.input('productId', sql.Int, productId);
  req.input('neededMl', sql.Int, neededMl);

  // Lock and read current state
  const current = await req.query(
    `SELECT sealed_bottles, opened_ml, bottle_volume_ml
     FROM product_inventory WITH (UPDLOCK, ROWLOCK)
     WHERE product_id = @productId`
  );
  const row = current.recordset?.[0];
  if (!row) throw Object.assign(new Error('Không tìm thấy tồn kho sản phẩm'), { code: 400 });

  let sealed = toInt(row.sealed_bottles);
  let opened = toInt(row.opened_ml);
  const bottleVol = toInt(row.bottle_volume_ml) || 100;
  const totalAvailable = opened + sealed * bottleVol;

  if (totalAvailable < neededMl) {
    throw Object.assign(new Error('Không đủ dung tích để chiết'), { code: 400 });
  }

  let bottlesOpened = 0;
  const sealedBefore = sealed;
  const openedBefore = opened;

  // Open bottles if needed
  if (opened < neededMl) {
    const deficit = neededMl - opened;
    bottlesOpened = Math.ceil(deficit / bottleVol);
    if (sealed < bottlesOpened) {
      throw Object.assign(new Error('Không đủ chai nguyên seal để mở'), { code: 400 });
    }
    sealed -= bottlesOpened;
    opened += bottlesOpened * bottleVol;

    // Record BOTTLE_OPEN movement
    await insertMovement(transaction, {
      productId, orderId, orderItemId,
      movementType: 'BOTTLE_OPEN',
      sealedBefore: sealedBefore,
      sealedAfter: sealed,
      openedBefore: openedBefore,
      openedAfter: opened,
      quantityBottles: bottlesOpened,
      reference: `Mở ${bottlesOpened} chai để chiết`,
    });
  }

  // Subtract the decant amount
  const openedBeforeSale = opened;
  opened -= neededMl;

  // Record DECANT_SALE movement
  await insertMovement(transaction, {
    productId, orderId, orderItemId,
    movementType: 'DECANT_SALE',
    sealedBefore: sealed,
    sealedAfter: sealed,
    openedBefore: openedBeforeSale,
    openedAfter: opened,
    quantityMl: neededMl,
    reference: `Bán ${neededMl}ml chiết`,
  });

  // Persist
  const update = new sql.Request(transaction);
  update.input('productId', sql.Int, productId);
  update.input('sealed', sql.Int, sealed);
  update.input('opened', sql.Int, opened);
  await update.query(
    `UPDATE product_inventory
     SET sealed_bottles = @sealed, opened_ml = @opened, updated_at = SYSUTCDATETIME()
     WHERE product_id = @productId`
  );

  return { sealedBottlesAfter: sealed, openedMlAfter: opened, bottlesOpened };
}

// ── decrement for full bottle sale ───────────────────────
export async function decrementFullBottleInventory(transaction, {
  productId, quantity = 1, orderId = null,
}) {
  await ensureProductInventory(transaction, productId);

  const req = new sql.Request(transaction);
  req.input('productId', sql.Int, productId);
  req.input('quantity', sql.Int, quantity);

  const current = await req.query(
    `SELECT sealed_bottles, opened_ml, bottle_volume_ml
     FROM product_inventory WITH (UPDLOCK, ROWLOCK)
     WHERE product_id = @productId`
  );
  const row = current.recordset?.[0];
  if (!row) throw Object.assign(new Error('Không tìm thấy tồn kho sản phẩm'), { code: 400 });

  const sealed = toInt(row.sealed_bottles);
  if (sealed < quantity) {
    throw Object.assign(new Error('Không đủ chai nguyên seal'), { code: 400 });
  }

  const sealedBefore = sealed;
  const sealedAfter = sealed - quantity;
  const openedMl = toInt(row.opened_ml);

  await insertMovement(transaction, {
    productId, orderId,
    movementType: 'BOTTLE_SALE',
    sealedBefore,
    sealedAfter,
    openedBefore: openedMl,
    openedAfter: openedMl,
    quantityBottles: quantity,
    reference: `Bán ${quantity} chai full`,
  });

  const update = new sql.Request(transaction);
  update.input('productId', sql.Int, productId);
  update.input('sealed', sql.Int, sealedAfter);
  await update.query(
    `UPDATE product_inventory
     SET sealed_bottles = @sealed, updated_at = SYSUTCDATETIME()
     WHERE product_id = @productId`
  );

  return { sealedBottlesAfter: sealedAfter, openedMlAfter: openedMl };
}

// ── restore inventory on order cancel ────────────────────
export async function restoreDecantInventory(transaction, {
  productId, neededMl = 0, isFullBottle = false, orderId = null,
}) {
  await ensureProductInventory(transaction, productId);

  const req = new sql.Request(transaction);
  req.input('productId', sql.Int, productId);
  const current = await req.query(
    `SELECT sealed_bottles, opened_ml, bottle_volume_ml
     FROM product_inventory WITH (UPDLOCK, ROWLOCK)
     WHERE product_id = @productId`
  );
  const row = current.recordset?.[0];
  if (!row) return { sealedBottles: 0, openedMl: 0 };

  let sealed = toInt(row.sealed_bottles);
  let opened = toInt(row.opened_ml);
  const sealedBefore = sealed;
  const openedBefore = opened;

  if (isFullBottle) {
    sealed += 1;
    await insertMovement(transaction, {
      productId, orderId,
      movementType: 'CANCEL',
      sealedBefore, sealedAfter: sealed,
      openedBefore: opened, openedAfter: opened,
      quantityBottles: 1,
      reference: 'Hoàn chai full khi hủy đơn',
    });
  } else if (neededMl > 0) {
    opened += neededMl;
    await insertMovement(transaction, {
      productId, orderId,
      movementType: 'CANCEL',
      sealedBefore, sealedAfter: sealed,
      openedBefore, openedAfter: opened,
      quantityMl: neededMl,
      reference: 'Hoàn ml chiết khi hủy đơn',
    });
  }

  const update = new sql.Request(transaction);
  update.input('productId', sql.Int, productId);
  update.input('sealed', sql.Int, sealed);
  update.input('opened', sql.Int, opened);
  await update.query(
    `UPDATE product_inventory
     SET sealed_bottles = @sealed, opened_ml = @opened, updated_at = SYSUTCDATETIME()
     WHERE product_id = @productId`
  );

  return { sealedBottles: sealed, openedMl: opened };
}

// ── sync variant stock_quantity from product_inventory ───
// FULL variants -> stock_quantity = sealed_bottles
// DECANT variants -> stock_quantity = floor(total_ml / variant.volume_ml)
export async function syncVariantStock(productId) {
  const inventory = await getProductInventory(productId);
  const variants = await query(
    `SELECT id, variant_type, volume_ml FROM product_variants
     WHERE product_id = ? AND ISNULL(status, 1) = 1`,
    [productId]
  );

  for (const variant of variants) {
    const type = String(variant.variant_type || '').toUpperCase();
    let newStock = 0;

    if (type === 'DECANT') {
      const decantVolume = toInt(variant.volume_ml) || 1;
      const totalMl = inventory.openedMl + inventory.sealedBottles * inventory.bottleVolumeMl;
      newStock = Math.floor(totalMl / decantVolume);
    } else {
      newStock = inventory.sealedBottles;
    }

    await query(
      `UPDATE product_variants SET stock_quantity = ?, updated_at = GETDATE() WHERE id = ?`,
      [newStock, variant.id]
    );
  }
}

// ── admin: open sealed bottles ───────────────────────────
export async function adminOpenBottles({ productId, quantity, reason = '', userId = null }) {
  const inv = await getProductInventory(productId);
  if (inv.sealedBottles < quantity) {
    return { error: { status: 400, message: 'Không đủ chai nguyên seal để mở' } };
  }

  const sealedAfter = inv.sealedBottles - quantity;
  const openedAfter = inv.openedMl + quantity * inv.bottleVolumeMl;

  await query(
    `UPDATE product_inventory SET sealed_bottles = ?, opened_ml = ?, updated_at = GETDATE()
     WHERE product_id = ?`,
    [sealedAfter, openedAfter, productId]
  );

  await query(
    `INSERT INTO inventory_movements
       (product_id, movement_type, sealed_bottles_before, sealed_bottles_after,
        opened_ml_before, opened_ml_after, quantity_bottles, reference)
     VALUES (?, N'BOTTLE_OPEN', ?, ?, ?, ?, ?, ?)`,
    [productId, inv.sealedBottles, sealedAfter, inv.openedMl, openedAfter, quantity, reason || 'Admin mở chai']
  );

  await syncVariantStock(productId);
  return { sealedBottles: sealedAfter, openedMl: openedAfter };
}

// ── admin: restock sealed bottles ────────────────────────
export async function adminRestockBottles({ productId, quantity, reason = '', userId = null }) {
  const inv = await getProductInventory(productId);

  const sealedAfter = inv.sealedBottles + quantity;

  await query(
    `UPDATE product_inventory SET sealed_bottles = ?, updated_at = GETDATE()
     WHERE product_id = ?`,
    [sealedAfter, productId]
  );

  await query(
    `INSERT INTO inventory_movements
       (product_id, movement_type, sealed_bottles_before, sealed_bottles_after,
        opened_ml_before, opened_ml_after, quantity_bottles, reference)
     VALUES (?, N'BOTTLE_RESTOCK', ?, ?, ?, ?, ?, ?)`,
    [productId, inv.sealedBottles, sealedAfter, inv.openedMl, inv.openedMl, quantity, reason || 'Admin nhập chai']
  );

  await syncVariantStock(productId);
  return { sealedBottles: sealedAfter, openedMl: inv.openedMl };
}

// ── admin: direct inventory adjustment ───────────────────
export async function adminAdjustDecant({ productId, sealedBottlesDelta = 0, openedMlDelta = 0, reason = '', userId = null }) {
  const inv = await getProductInventory(productId);

  const sealedAfter = inv.sealedBottles + sealedBottlesDelta;
  const openedAfter = inv.openedMl + openedMlDelta;

  if (sealedAfter < 0 || openedAfter < 0) {
    return { error: { status: 400, message: 'Số tồn kho không thể âm' } };
  }

  await query(
    `UPDATE product_inventory SET sealed_bottles = ?, opened_ml = ?, updated_at = GETDATE()
     WHERE product_id = ?`,
    [sealedAfter, openedAfter, productId]
  );

  await query(
    `INSERT INTO inventory_movements
       (product_id, movement_type, sealed_bottles_before, sealed_bottles_after,
        opened_ml_before, opened_ml_after, quantity_bottles, quantity_ml, reference)
     VALUES (?, N'ADJUSTMENT', ?, ?, ?, ?, ?, ?, ?)`,
    [productId, inv.sealedBottles, sealedAfter, inv.openedMl, openedAfter, sealedBottlesDelta, openedMlDelta, reason || 'Admin điều chỉnh']
  );

  await syncVariantStock(productId);
  return { sealedBottles: sealedAfter, openedMl: openedAfter };
}

// ── admin: movement history ──────────────────────────────
export async function getDecantMovements({ productId = null, page = 1, pageSize = 20 }) {
  const params = [];
  let where = '';

  if (productId) {
    where = 'WHERE m.product_id = ?';
    params.push(productId);
  }

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM inventory_movements m ${where}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const rows = await query(
    `SELECT m.*, p.name AS product_name
     FROM inventory_movements m
     LEFT JOIN products p ON p.id = m.product_id
     ${where}
     ORDER BY m.created_at DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, (page - 1) * pageSize, pageSize]
  );

  return {
    content: rows,
    page: Number(page),
    size: Number(pageSize),
    totalElements: total,
    totalPages: Math.ceil(total / pageSize),
    first: page == 1,
    last: page * pageSize >= total,
  };
}
