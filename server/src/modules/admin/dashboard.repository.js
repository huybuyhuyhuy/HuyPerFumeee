import { query } from '../../config/database.js';
import { STATUS_GROUPS } from './order-status.js';
import { env } from '../../config/env.js';
import { getProductStorageCapabilities } from '../products/product.repository.js';
import { getAuthStorageCapabilities, hasColumn } from '../auth/auth.storage.js';

const LOW_STOCK_THRESHOLD = env.lowStockThreshold;

async function getDashboardCapabilities() {
  const [product, auth] = await Promise.all([
    getProductStorageCapabilities(),
    getAuthStorageCapabilities(),
  ]);
  return { product, userColumns: auth.userColumns };
}

function activeProductCondition(capabilities, alias = 'p') {
  const conditions = [];
  if (hasColumn(capabilities.productColumns, 'status')) conditions.push(`${alias}.status = 1`);
  if (hasColumn(capabilities.productColumns, 'deleted_at')) conditions.push(`${alias}.deleted_at IS NULL`);
  return conditions.length ? conditions.join(' AND ') : '1 = 1';
}

function customerCondition(userColumns, alias = '') {
  const prefix = alias ? `${alias}.` : '';
  const conditions = [];
  if (hasColumn(userColumns, 'role')) conditions.push(`UPPER(${prefix}role) NOT IN ('ADMIN', 'STAFF')`);
  if (hasColumn(userColumns, 'status')) {
    conditions.push(`(${prefix}status IS NULL OR ${prefix}status NOT IN ('DISABLED', 'LOCKED'))`);
  }
  if (hasColumn(userColumns, 'deleted_at')) conditions.push(`${prefix}deleted_at IS NULL`);
  return conditions.length ? conditions.join(' AND ') : '1 = 1';
}

function activeVariantCondition(capabilities, alias = 'pv') {
  const conditions = [];
  if (hasColumn(capabilities.variantColumns, 'deleted_at')) conditions.push(`${alias}.deleted_at IS NULL`);
  if (hasColumn(capabilities.variantColumns, 'status')) conditions.push(`ISNULL(${alias}.status, 1) = 1`);
  return conditions.length ? conditions.join(' AND ') : '1 = 1';
}

/**
 * Build a SQL `IN (?, ?, ...)` clause while pushing the actual values into `collector`.
 * This keeps parameter ordering consistent with placeholder positions — the caller
 * doesn't need to remember which status array maps to which set of ? markers.
 */
function collectInClause(statuses, collector) {
  collector.push(...statuses);
  return statuses.map(() => '?').join(', ');
}

function monthStart(column) {
  return `DATEFROMPARTS(YEAR(${column}), MONTH(${column}), 1)`;
}

// ────────────────────────────────────────────────────────────
//  Stats
// ────────────────────────────────────────────────────────────

/** Single-query order overview: revenue, counts by status, AOV. */
export async function fetchOrderStats() {
  const p = [];
  // Each collectInClause call must match exactly one occurrence in the SQL.
  // Re-using the same placeholder string (e.g. for REVENUE in both SUM and AVG)
  // would create ? markers with no corresponding param values → SQL error.
  const revSum = collectInClause(STATUS_GROUPS.REVENUE, p);
  const valid = collectInClause(STATUS_GROUPS.VALID_ORDERS, p);
  const completed = collectInClause(STATUS_GROUPS.COMPLETED_MAPPING, p);
  const pending = collectInClause(STATUS_GROUPS.PENDING, p);
  const cancelled = collectInClause(STATUS_GROUPS.CANCELLED_OR_FAILED, p);
  const refunded = collectInClause(STATUS_GROUPS.REFUNDED, p);
  const revAvg = collectInClause(STATUS_GROUPS.REVENUE, p);

  const [row] = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN o.status IN (${revSum}) THEN o.total ELSE 0 END), 0)   AS totalRevenue,
       COUNT(CASE WHEN o.status IN (${valid}) THEN 1 END)                             AS totalOrders,
       COUNT(CASE WHEN o.status IN (${completed}) THEN 1 END)                         AS completedOrders,
       COUNT(CASE WHEN o.status IN (${pending}) THEN 1 END)                           AS pendingOrders,
       COUNT(CASE WHEN o.status IN (${cancelled}) THEN 1 END)                         AS cancelledOrders,
       COUNT(CASE WHEN o.status IN (${refunded}) THEN 1 END)                          AS refundedOrders,
       COALESCE(AVG(CASE WHEN o.status IN (${revAvg}) THEN o.total END), 0)           AS averageOrderValue
     FROM orders o`,
    p,
  );
  return row || {};
}

export async function fetchTotalProducts() {
  const { product } = await getDashboardCapabilities();
  const [row] = await query(
    `SELECT COUNT(*) AS total FROM products p WHERE ${activeProductCondition(product)}`,
  );
  return Number(row?.total || 0);
}

export async function fetchTotalUsers() {
  const { userColumns } = await getDashboardCapabilities();
  const [row] = await query(
    `SELECT COUNT(*) AS total FROM users u
     WHERE ${customerCondition(userColumns, 'u')}`,
  );
  return Number(row?.total || 0);
}

export async function fetchNewUsersThisMonth() {
  const { userColumns } = await getDashboardCapabilities();
  const [row] = await query(
    `SELECT COUNT(*) AS total FROM users u
     WHERE u.created_at >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
       AND ${customerCondition(userColumns, 'u')}`,
  );
  return Number(row?.total || 0);
}

/** 6-month chart series for the stats overview. */
export async function fetchStatsChartSeries() {
  const { userColumns } = await getDashboardCapabilities();
  const sixMonthsAgo = `DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))`;
  const p1 = [];
  const rev = collectInClause(STATUS_GROUPS.REVENUE, p1);
  const p2 = [];
  const valid = collectInClause(STATUS_GROUPS.VALID_ORDERS, p2);

  const [revenue, orders, users] = await Promise.all([
    query(
      `SELECT ${monthStart('o.created_at')} AS monthStart, COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o WHERE o.status IN (${rev}) AND o.created_at >= ${sixMonthsAgo}
       GROUP BY ${monthStart('o.created_at')} ORDER BY monthStart ASC`,
      p1,
    ),
    query(
      `SELECT ${monthStart('o.created_at')} AS monthStart, COUNT(*) AS orders
       FROM orders o WHERE o.status IN (${valid}) AND o.created_at >= ${sixMonthsAgo}
       GROUP BY ${monthStart('o.created_at')} ORDER BY monthStart ASC`,
      p2,
    ),
    query(
      `SELECT ${monthStart('u.created_at')} AS monthStart, COUNT(*) AS users
       FROM users u
       WHERE u.created_at >= ${sixMonthsAgo}
         AND ${customerCondition(userColumns, 'u')}
       GROUP BY ${monthStart('u.created_at')} ORDER BY monthStart ASC`,
    ),
  ]);
  return { revenue, orders, users };
}

/** Top N products by sold quantity, optionally filtered by date range. */
export async function fetchTopProducts(limit, dateFilter) {
  const { product } = await getDashboardCapabilities();
  const p = [];
  const rev = collectInClause(STATUS_GROUPS.REVENUE, p);
  const itemRevenue = hasColumn(product.orderItemColumns, 'price_at_purchase')
    ? 'oi.price_at_purchase'
    : 'oi.price';
  let dateCondition = '';
  if (dateFilter) {
    p.push(dateFilter.start, dateFilter.end);
    dateCondition = 'AND o.created_at >= ? AND o.created_at < ?';
  }

  return query(
    `SELECT TOP ${Number(limit)} p.id, p.name, p.image, p.stock, p.price, p.discount_price,
            COALESCE(SUM(oi.quantity), 0) AS totalSold,
            COALESCE(SUM(oi.quantity * ${itemRevenue}), 0) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.status IN (${rev}) ${dateCondition}
       AND ${activeProductCondition(product)}
     GROUP BY p.id, p.name, p.image, p.stock, p.price, p.discount_price
     ORDER BY totalSold DESC`,
    p,
  );
}

/** Combined low-stock count: simple products + variants below threshold. */
export async function fetchLowStockCount() {
  const { product } = await getDashboardCapabilities();
  const variantFilter = product.hasVariants
    ? `AND NOT EXISTS (
         SELECT 1 FROM product_variants pv
         WHERE pv.product_id = p.id AND ${activeVariantCondition(product)}
       )`
    : '';
  const products = await query(
    `SELECT COUNT(*) AS total FROM products p
     WHERE ${activeProductCondition(product)} AND p.stock < ?
       ${variantFilter}`,
    [LOW_STOCK_THRESHOLD],
  );
  const variants = product.hasVariants && hasColumn(product.variantColumns, 'stock_quantity')
    ? await query(
        `SELECT COUNT(*) AS total FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE ${activeProductCondition(product)}
           AND ${activeVariantCondition(product)}
           AND pv.stock_quantity < ?`,
        [LOW_STOCK_THRESHOLD],
      )
    : [];
  return Number(products[0]?.total || 0) + Number(variants[0]?.total || 0);
}

// ────────────────────────────────────────────────────────────
//  Summary (date-window aware)
// ────────────────────────────────────────────────────────────

export async function fetchRevenueInPeriod(start, end) {
  const p = [];
  const rev = collectInClause(STATUS_GROUPS.REVENUE, p);
  p.push(start, end);
  const [row] = await query(
    `SELECT COALESCE(SUM(total), 0) AS value FROM orders
     WHERE status IN (${rev}) AND created_at >= ? AND created_at < ?`,
    p,
  );
  return Number(row?.value || 0);
}

export async function fetchOrderCountInPeriod(start, end) {
  const p = [];
  const valid = collectInClause(STATUS_GROUPS.VALID_ORDERS, p);
  p.push(start, end);
  const [row] = await query(
    `SELECT COUNT(*) AS value FROM orders
     WHERE status IN (${valid}) AND created_at >= ? AND created_at < ?`,
    p,
  );
  return Number(row?.value || 0);
}

export async function fetchCustomerCountInPeriod(start, end) {
  const p = [];
  const valid = collectInClause(STATUS_GROUPS.VALID_ORDERS, p);
  p.push(start, end);
  const [row] = await query(
    `SELECT COUNT(DISTINCT user_id) AS value FROM orders
     WHERE status IN (${valid}) AND user_id IS NOT NULL
       AND created_at >= ? AND created_at < ?`,
    p,
  );
  return Number(row?.value || 0);
}

export async function fetchNewProductsInPeriod(start, end) {
  const { product } = await getDashboardCapabilities();
  const [row] = await query(
    `SELECT COUNT(*) AS value FROM products p
     WHERE ${activeProductCondition(product)} AND p.created_at >= ? AND p.created_at < ?`,
    [start, end],
  );
  return Number(row?.value || 0);
}

/** All four order status counts in one query. */
export async function fetchOrderStatusBreakdown() {
  const p = [];
  const pending = collectInClause(STATUS_GROUPS.PENDING, p);
  const completed = collectInClause(STATUS_GROUPS.COMPLETED_MAPPING, p);
  const cancelled = collectInClause(STATUS_GROUPS.CANCELLED_OR_FAILED, p);
  const refunded = collectInClause(STATUS_GROUPS.REFUNDED, p);

  const [row] = await query(
    `SELECT
       COUNT(CASE WHEN o.status IN (${pending}) THEN 1 END)   AS pendingOrders,
       COUNT(CASE WHEN o.status IN (${completed}) THEN 1 END) AS completedOrders,
       COUNT(CASE WHEN o.status IN (${cancelled}) THEN 1 END) AS cancelledOrders,
       COUNT(CASE WHEN o.status IN (${refunded}) THEN 1 END)  AS refundedOrders
     FROM orders o`,
    p,
  );
  return row || {};
}

export async function fetchTopCategories(limit, start, end) {
  const { product } = await getDashboardCapabilities();
  const p = [];
  const rev = collectInClause(STATUS_GROUPS.REVENUE, p);
  p.push(start, end);
  return query(
    `SELECT TOP ${Number(limit)} c.id, c.name,
            COALESCE(SUM(oi.quantity), 0) AS totalSold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     JOIN categories c ON c.id = p.id_category
     WHERE o.status IN (${rev})
       AND o.created_at >= ? AND o.created_at < ?
       AND ${activeProductCondition(product)}
     GROUP BY c.id, c.name
     ORDER BY totalSold DESC`,
    p,
  );
}

export async function fetchRecentOrders(limit) {
  const p = [];
  const valid = collectInClause(STATUS_GROUPS.VALID_ORDERS, p);
  return query(
    `SELECT TOP ${Number(limit)} o.id, o.total, o.status, o.payment_method, o.created_at,
            COALESCE(u.name, N'Khách vãng lai') AS customer_name,
            COALESCE(u.email, '') AS customer_email
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.status IN (${valid})
     ORDER BY o.created_at DESC`,
    p,
  );
}

// ────────────────────────────────────────────────────────────
//  Charts
// ────────────────────────────────────────────────────────────

export async function fetchChartRevenue(groupExpr, start, end) {
  const p = [];
  const rev = collectInClause(STATUS_GROUPS.REVENUE, p);
  p.push(start, end);
  return query(
    `SELECT ${groupExpr} AS period, COALESCE(SUM(total), 0) AS revenue
     FROM orders o
     WHERE o.status IN (${rev}) AND o.created_at >= ? AND o.created_at < ?
     GROUP BY ${groupExpr} ORDER BY period`,
    p,
  );
}

export async function fetchChartOrders(groupExpr, start, end) {
  const p = [];
  const valid = collectInClause(STATUS_GROUPS.VALID_ORDERS, p);
  p.push(start, end);
  return query(
    `SELECT ${groupExpr} AS period, COUNT(*) AS orders
     FROM orders o
     WHERE o.status IN (${valid}) AND o.created_at >= ? AND o.created_at < ?
     GROUP BY ${groupExpr} ORDER BY period`,
    p,
  );
}

export async function fetchChartCustomers(groupExpr, start, end) {
  const p = [];
  const valid = collectInClause(STATUS_GROUPS.VALID_ORDERS, p);
  p.push(start, end);
  return query(
    `SELECT ${groupExpr} AS period, COUNT(DISTINCT user_id) AS customers
     FROM orders o
     WHERE o.status IN (${valid}) AND o.user_id IS NOT NULL
       AND o.created_at >= ? AND o.created_at < ?
     GROUP BY ${groupExpr} ORDER BY period`,
    p,
  );
}
