import { query, sql } from '../config/database.js';

let capabilitiesPromise = null;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPositiveInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeStatus(value, fallback = 'ACTIVE') {
  const normalized = String(value || fallback).trim().toUpperCase();
  return normalized || fallback;
}

async function getDecantCapabilities() {
  if (!capabilitiesPromise) {
    capabilitiesPromise = (async () => {
      const rows = await query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'dbo'
          AND TABLE_NAME IN ('product_batches', 'decant_options')
      `);
      const tables = new Set(rows.map((row) => String(row.TABLE_NAME || '').toLowerCase()));
      return {
        hasProductBatches: tables.has('product_batches'),
        hasDecantOptions: tables.has('decant_options'),
      };
    })();
  }
  return capabilitiesPromise;
}

export function resetDecantCapabilitiesForTests() {
  capabilitiesPromise = null;
}

function mapBatch(row) {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    batchCode: row.batch_code || '',
    totalVolumeMl: Number(row.total_volume_ml || 0),
    remainingVolumeMl: Number(row.remaining_volume_ml || 0),
    importPrice: row.import_price === null || row.import_price === undefined ? null : Number(row.import_price),
    status: row.status || 'ACTIVE',
    createdAt: row.created_at,
  };
}

function mapDecantOption(row) {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    volumeMl: Number(row.volume_ml || 0),
    price: Number(row.price || 0),
    status: row.status !== false && row.status !== 0,
  };
}

export async function listProductBatches(productId, { activeOnly = false } = {}) {
  const capabilities = await getDecantCapabilities();
  if (!capabilities.hasProductBatches) return [];

  const conditions = ['product_id = ?'];
  const params = [Number(productId)];
  if (activeOnly) conditions.push("status = N'ACTIVE'");

  const rows = await query(
    `SELECT id, product_id, batch_code, total_volume_ml, remaining_volume_ml, import_price, status, created_at
     FROM product_batches
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at ASC, id ASC`,
    params
  );
  return rows.map(mapBatch);
}

export async function listDecantOptions(productId, { activeOnly = false } = {}) {
  const capabilities = await getDecantCapabilities();
  if (!capabilities.hasDecantOptions) return [];

  const conditions = ['product_id = ?'];
  const params = [Number(productId)];
  if (activeOnly) conditions.push('status = 1');

  const rows = await query(
    `SELECT id, product_id, volume_ml, price, status
     FROM decant_options
     WHERE ${conditions.join(' AND ')}
     ORDER BY volume_ml ASC, id ASC`,
    params
  );
  return rows.map(mapDecantOption);
}

export async function getAvailableVolumeMl(productId) {
  const capabilities = await getDecantCapabilities();
  if (!capabilities.hasProductBatches) return 0;

  const rows = await query(
    `SELECT COALESCE(SUM(remaining_volume_ml), 0) AS total
     FROM product_batches
     WHERE product_id = ? AND status = N'ACTIVE'`,
    [Number(productId)]
  );
  return Number(rows[0]?.total || 0);
}

export async function getProductDecantData(productId, { includeBatches = false } = {}) {
  const [decantOptions, availableVolumeMl, batches] = await Promise.all([
    listDecantOptions(productId, { activeOnly: true }),
    getAvailableVolumeMl(productId),
    includeBatches ? listProductBatches(productId) : Promise.resolve(undefined),
  ]);

  return {
    decantOptions,
    availableVolumeMl,
    ...(includeBatches ? { batches } : {}),
  };
}

export async function findActiveDecantOption(productId, volumeMl) {
  const capabilities = await getDecantCapabilities();
  if (!capabilities.hasDecantOptions) return null;

  const rows = await query(
    `SELECT TOP 1 id, product_id, volume_ml, price, status
     FROM decant_options
     WHERE product_id = ? AND volume_ml = ? AND status = 1`,
    [Number(productId), Number(volumeMl)]
  );
  return rows[0] ? mapDecantOption(rows[0]) : null;
}

export async function createProductBatch(productId, payload = {}) {
  const safeProductId = toPositiveInt(productId);
  const totalVolumeMl = toPositiveInt(payload.totalVolumeMl ?? payload.total_volume_ml);
  const remainingVolumeMl = payload.remainingVolumeMl ?? payload.remaining_volume_ml;
  const safeRemaining = remainingVolumeMl === undefined || remainingVolumeMl === null || remainingVolumeMl === ''
    ? totalVolumeMl
    : toPositiveInt(remainingVolumeMl);
  if (!safeProductId || !totalVolumeMl || safeRemaining === null || safeRemaining > totalVolumeMl) {
    return { code: 400, message: 'Du lieu batch khong hop le' };
  }

  const rows = await query(
    `INSERT INTO product_batches (product_id, batch_code, total_volume_ml, remaining_volume_ml, import_price, status)
     OUTPUT INSERTED.id, INSERTED.product_id, INSERTED.batch_code, INSERTED.total_volume_ml,
            INSERTED.remaining_volume_ml, INSERTED.import_price, INSERTED.status, INSERTED.created_at
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      safeProductId,
      String(payload.batchCode ?? payload.batch_code ?? '').trim() || null,
      totalVolumeMl,
      safeRemaining,
      payload.importPrice ?? payload.import_price ?? null,
      normalizeStatus(payload.status),
    ]
  );
  return mapBatch(rows[0]);
}

export async function updateProductBatch(batchId, payload = {}) {
  const safeBatchId = toPositiveInt(batchId);
  if (!safeBatchId) return { code: 400, message: 'ID batch khong hop le' };

  const current = (await query(
    `SELECT TOP 1 id, product_id, batch_code, total_volume_ml, remaining_volume_ml, import_price, status, created_at
     FROM product_batches WHERE id = ?`,
    [safeBatchId]
  ))[0];
  if (!current) return { code: 404, message: 'Khong tim thay batch' };

  const totalVolumeMl = payload.totalVolumeMl ?? payload.total_volume_ml;
  const remainingVolumeMl = payload.remainingVolumeMl ?? payload.remaining_volume_ml;
  const nextTotal = totalVolumeMl === undefined ? Number(current.total_volume_ml) : toPositiveInt(totalVolumeMl);
  const nextRemaining = remainingVolumeMl === undefined ? Number(current.remaining_volume_ml) : toNumber(remainingVolumeMl, -1);
  if (!nextTotal || nextRemaining < 0 || nextRemaining > nextTotal) {
    return { code: 400, message: 'Dung tich batch khong hop le' };
  }

  const rows = await query(
    `UPDATE product_batches
     SET batch_code = ?, total_volume_ml = ?, remaining_volume_ml = ?, import_price = ?, status = ?
     OUTPUT INSERTED.id, INSERTED.product_id, INSERTED.batch_code, INSERTED.total_volume_ml,
            INSERTED.remaining_volume_ml, INSERTED.import_price, INSERTED.status, INSERTED.created_at
     WHERE id = ?`,
    [
      payload.batchCode !== undefined || payload.batch_code !== undefined
        ? String(payload.batchCode ?? payload.batch_code ?? '').trim() || null
        : current.batch_code,
      nextTotal,
      nextRemaining,
      payload.importPrice !== undefined || payload.import_price !== undefined
        ? payload.importPrice ?? payload.import_price ?? null
        : current.import_price,
      payload.status !== undefined ? normalizeStatus(payload.status) : current.status,
      safeBatchId,
    ]
  );
  return rows[0] ? mapBatch(rows[0]) : { code: 404, message: 'Khong tim thay batch' };
}

export async function createDecantOption(productId, payload = {}) {
  const safeProductId = toPositiveInt(productId);
  const volumeMl = toPositiveInt(payload.volumeMl ?? payload.volume_ml);
  const price = toNumber(payload.price, -1);
  if (!safeProductId || !volumeMl || price < 0) {
    return { code: 400, message: 'Du lieu tuy chon chiet khong hop le' };
  }

  const status = payload.status === undefined ? 1 : (Boolean(payload.status) ? 1 : 0);
  const rows = await query(
    `MERGE decant_options WITH (HOLDLOCK) AS target
     USING (SELECT CAST(? AS INT) AS product_id, CAST(? AS INT) AS volume_ml) AS source
     ON target.product_id = source.product_id AND target.volume_ml = source.volume_ml
     WHEN MATCHED THEN
       UPDATE SET price = ?, status = ?
     WHEN NOT MATCHED THEN
       INSERT (product_id, volume_ml, price, status)
       VALUES (source.product_id, source.volume_ml, ?, ?)
     OUTPUT INSERTED.id, INSERTED.product_id, INSERTED.volume_ml, INSERTED.price, INSERTED.status;`,
    [safeProductId, volumeMl, price, status, price, status]
  );

  const option = mapDecantOption(rows[0]);
  await ensureDecantVariantForOption(safeProductId, option);
  return option;
}

async function ensureDecantVariantForOption(productId, option) {
  if (!option?.volumeMl) return null;
  const existing = await query(
    `SELECT TOP 1 id
     FROM product_variants
     WHERE product_id = ? AND variant_type = N'DECANT' AND volume_ml = ?`,
    [Number(productId), Number(option.volumeMl)]
  );
  if (existing[0]?.id) {
    await query(
      `UPDATE product_variants
       SET price = ?, sale_price = NULL, stock_quantity = stock_quantity, status = ?
       WHERE id = ?`,
      [Number(option.price || 0), option.status ? 1 : 0, existing[0].id]
    );
    return existing[0].id;
  }

  const skuBaseRows = await query(
    `SELECT TOP 1 sku, name, volume_ml
     FROM products WHERE id = ?`,
    [Number(productId)]
  );
  const skuBase = String(skuBaseRows[0]?.sku || `PRD-${productId}`).trim();
  const variantSku = `${skuBase}-DECANT-${option.volumeMl}`;
  const volumeLabel = `${option.volumeMl}ml`;
  const variantRows = await query(
    `INSERT INTO product_variants
      (product_id, sku, variant_type, volume_ml, volume_label, price, sale_price, stock_quantity, sort_order, status)
     OUTPUT INSERTED.id
     VALUES (?, ?, N'DECANT', ?, ?, ?, NULL, 0, 999, ?)`,
    [Number(productId), variantSku, Number(option.volumeMl), volumeLabel, Number(option.price || 0), option.status ? 1 : 0]
  );
  return variantRows[0]?.id || null;
}

export async function updateDecantOption(optionId, payload = {}) {
  const safeOptionId = toPositiveInt(optionId);
  if (!safeOptionId) return { code: 400, message: 'ID tuy chon chiet khong hop le' };

  const current = (await query(
    `SELECT TOP 1 id, product_id, volume_ml, price, status
     FROM decant_options WHERE id = ?`,
    [safeOptionId]
  ))[0];
  if (!current) return { code: 404, message: 'Khong tim thay tuy chon chiet' };

  const volumeMl = payload.volumeMl ?? payload.volume_ml;
  const nextVolume = volumeMl === undefined ? Number(current.volume_ml) : toPositiveInt(volumeMl);
  const nextPrice = payload.price === undefined ? Number(current.price) : toNumber(payload.price, -1);
  if (!nextVolume || nextPrice < 0) {
    return { code: 400, message: 'Du lieu tuy chon chiet khong hop le' };
  }

  const rows = await query(
    `UPDATE decant_options
     SET volume_ml = ?, price = ?, status = ?
     OUTPUT INSERTED.id, INSERTED.product_id, INSERTED.volume_ml, INSERTED.price, INSERTED.status
     WHERE id = ?`,
    [
      nextVolume,
      nextPrice,
      payload.status === undefined ? (Boolean(current.status) ? 1 : 0) : (Boolean(payload.status) ? 1 : 0),
      safeOptionId,
    ]
  );
  return mapDecantOption(rows[0]);
}

export async function selectDecantBatchForUpdate(transaction, productId, neededMl) {
  const request = new sql.Request(transaction);
  request.input('productId', sql.Int, Number(productId));
  request.input('neededMl', sql.Int, Number(neededMl));
  const result = await request.query(
    `SELECT TOP 1 id, product_id, batch_code, total_volume_ml, remaining_volume_ml, import_price, status, created_at
     FROM product_batches WITH (UPDLOCK, ROWLOCK)
     WHERE product_id = @productId
       AND status = N'ACTIVE'
       AND remaining_volume_ml >= @neededMl
     ORDER BY created_at ASC, id ASC`
  );
  return result.recordset?.[0] ? mapBatch(result.recordset[0]) : null;
}

export async function decrementBatchVolume(transaction, { batchId, neededMl }) {
  const request = new sql.Request(transaction);
  request.input('batchId', sql.Int, Number(batchId));
  request.input('neededMl', sql.Int, Number(neededMl));
  const result = await request.query(
    `UPDATE product_batches
     SET remaining_volume_ml = remaining_volume_ml - @neededMl
     OUTPUT deleted.remaining_volume_ml AS stock_before, inserted.remaining_volume_ml AS stock_after
     WHERE id = @batchId AND remaining_volume_ml >= @neededMl`
  );
  return result.recordset?.[0] || null;
}

export async function restoreBatchVolume(transaction, { batchId, volumeMl }) {
  if (!batchId || !volumeMl) return null;
  const request = new sql.Request(transaction);
  request.input('batchId', sql.Int, Number(batchId));
  request.input('volumeMl', sql.Int, Number(volumeMl));
  const result = await request.query(
    `UPDATE product_batches
     SET remaining_volume_ml = CASE
       WHEN remaining_volume_ml + @volumeMl > total_volume_ml THEN total_volume_ml
       ELSE remaining_volume_ml + @volumeMl
     END
     OUTPUT deleted.remaining_volume_ml AS stock_before, inserted.remaining_volume_ml AS stock_after
     WHERE id = @batchId`
  );
  return result.recordset?.[0] || null;
}
