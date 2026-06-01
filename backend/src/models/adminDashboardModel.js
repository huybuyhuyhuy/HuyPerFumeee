import { query } from '../config/database.js';
import { env } from '../config/env.js';
import { STATUS_GROUPS, sqlInClause } from '../modules/admin/order-status.js';
import { getLowStockAlerts } from './adminInventoryModel.js';

const LOW_STOCK_THRESHOLD = env.lowStockThreshold;

function buildMonthStartExpr(column) {
  return `DATEFROMPARTS(YEAR(${column}), MONTH(${column}), 1)`;
}

export async function getDashboardStats() {
  const sixMonthsAgo = `DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))`;

  const revenueIn = sqlInClause(STATUS_GROUPS.REVENUE);
  const completedIn = sqlInClause(STATUS_GROUPS.COMPLETED_MAPPING);
  const pendingIn = sqlInClause(STATUS_GROUPS.PENDING);
  const cancelledFailedIn = sqlInClause(STATUS_GROUPS.CANCELLED_OR_FAILED);
  const refundedIn = sqlInClause(STATUS_GROUPS.REFUNDED);
  const validOrdersIn = sqlInClause(STATUS_GROUPS.VALID_ORDERS);

  const [
    revenueRows,
    orderRows,
    productRows,
    userRows,
    completedRows,
    avgOrderRows,
    newUsersRows,
    revenueChartRows,
    orderChartRows,
    userChartRows,
    topProductRows,
    pendingCountRows,
    cancelledCountRows,
    refundedCountRows,
    lowStockRows,
    variantLowStockRows,
  ] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM orders WHERE status IN (${revenueIn})`,
      STATUS_GROUPS.REVENUE
    ),
    query(
      `SELECT COUNT(*) AS totalOrders FROM orders WHERE status IN (${validOrdersIn})`,
      STATUS_GROUPS.VALID_ORDERS
    ),
    query(
      'SELECT COUNT(*) AS totalProducts FROM products WHERE status = 1 AND deleted_at IS NULL'
    ),
    query(
      `SELECT COUNT(*) AS totalUsers FROM users
       WHERE role NOT IN ('ADMIN', 'STAFF')
         AND (status IS NULL OR status NOT IN ('DISABLED', 'LOCKED'))
         AND deleted_at IS NULL`
    ),
    query(
      `SELECT COUNT(*) AS completedOrders FROM orders WHERE status IN (${completedIn})`,
      STATUS_GROUPS.COMPLETED_MAPPING
    ),
    query(
      `SELECT COALESCE(AVG(total), 0) AS averageOrderValue FROM orders WHERE status IN (${revenueIn})`,
      STATUS_GROUPS.REVENUE
    ),
    query(
      `SELECT COUNT(*) AS newUsersThisMonth FROM users
       WHERE created_at >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
         AND role NOT IN ('ADMIN', 'STAFF')
         AND (status IS NULL OR status NOT IN ('DISABLED', 'LOCKED'))
         AND deleted_at IS NULL`
    ),
    query(
      `SELECT ${buildMonthStartExpr('o.created_at')} AS monthStart, COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status IN (${revenueIn})
         AND o.created_at >= ${sixMonthsAgo}
       GROUP BY ${buildMonthStartExpr('o.created_at')}
       ORDER BY monthStart ASC`,
      STATUS_GROUPS.REVENUE
    ),
    query(
      `SELECT ${buildMonthStartExpr('o.created_at')} AS monthStart, COUNT(*) AS orders
       FROM orders o
       WHERE o.status IN (${validOrdersIn})
         AND o.created_at >= ${sixMonthsAgo}
       GROUP BY ${buildMonthStartExpr('o.created_at')}
       ORDER BY monthStart ASC`,
      STATUS_GROUPS.VALID_ORDERS
    ),
    query(
      `SELECT ${buildMonthStartExpr('u.created_at')} AS monthStart, COUNT(*) AS users
       FROM users u
       WHERE u.created_at >= ${sixMonthsAgo}
         AND u.role NOT IN ('ADMIN', 'STAFF')
         AND (u.status IS NULL OR u.status NOT IN ('DISABLED', 'LOCKED'))
         AND u.deleted_at IS NULL
       GROUP BY ${buildMonthStartExpr('u.created_at')}
       ORDER BY monthStart ASC`
    ),
    query(
      `SELECT TOP 10 p.id, p.name, p.image, p.stock, p.price, p.discount_price,
              COALESCE(SUM(oi.quantity), 0) AS totalSold,
              COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status IN (${revenueIn})
         AND p.status = 1
         AND p.deleted_at IS NULL
       GROUP BY p.id, p.name, p.image, p.stock, p.price, p.discount_price
       ORDER BY totalSold DESC`,
      STATUS_GROUPS.REVENUE
    ),
    query(
      `SELECT COUNT(*) AS total FROM orders WHERE status IN (${pendingIn})`,
      STATUS_GROUPS.PENDING
    ),
    query(
      `SELECT COUNT(*) AS total FROM orders WHERE status IN (${cancelledFailedIn})`,
      STATUS_GROUPS.CANCELLED_OR_FAILED
    ),
    query(
      `SELECT COUNT(*) AS total FROM orders WHERE status IN (${refundedIn})`,
      STATUS_GROUPS.REFUNDED
    ),
    query(
      `SELECT COUNT(*) AS total FROM products p
       WHERE p.deleted_at IS NULL AND p.status = 1 AND p.stock < ?
         AND NOT EXISTS (
           SELECT 1 FROM product_variants pv
           WHERE pv.product_id = p.id AND pv.deleted_at IS NULL AND ISNULL(pv.status, 1) = 1
         )`,
      [LOW_STOCK_THRESHOLD]
    ),
    query(
      `SELECT COUNT(*) AS total FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE p.deleted_at IS NULL AND p.status = 1
         AND pv.deleted_at IS NULL AND ISNULL(pv.status, 1) = 1
         AND pv.stock_quantity < ?`,
      [LOW_STOCK_THRESHOLD]
    ),
  ]);

  return {
    totalRevenue: Number(revenueRows[0]?.totalRevenue || 0),
    totalOrders: Number(orderRows[0]?.totalOrders || 0),
    totalProducts: Number(productRows[0]?.totalProducts || 0),
    totalUsers: Number(userRows[0]?.totalUsers || 0),
    completedOrders: Number(completedRows[0]?.completedOrders || 0),
    averageOrderValue: Math.round(Number(avgOrderRows[0]?.averageOrderValue || 0)),
    newUsersThisMonth: Number(newUsersRows[0]?.newUsersThisMonth || 0),
    pendingOrders: Number(pendingCountRows[0]?.total || 0),
    cancelledOrders: Number(cancelledCountRows[0]?.total || 0),
    refundedOrders: Number(refundedCountRows[0]?.total || 0),
    lowStockCount: Number(lowStockRows[0]?.total || 0) + Number(variantLowStockRows[0]?.total || 0),
    charts: {
      revenue: revenueChartRows,
      orders: orderChartRows,
      users: userChartRows,
    },
    topProducts: topProductRows.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.image || '',
      soldQuantity: Number(row.totalSold || 0),
      revenue: Number(row.revenue || 0),
      stock: Number(row.stock || 0),
    })),
  };
}

// --- Date window helpers ---

function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function subtractMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

function toSqlDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function resolveDateWindows({ range, from, to }) {
  const now = new Date();
  let currentStart, currentEnd, previousStart, previousEnd;

  if (from) {
    currentStart = startOfDay(new Date(from + 'T00:00:00'));
    if (to) {
      const toDate = startOfDay(new Date(to + 'T00:00:00'));
      toDate.setDate(toDate.getDate() + 1);
      currentEnd = toDate;
    } else {
      currentEnd = startOfDay(new Date(now.getTime() + 86400000));
    }
  } else {
    const tomorrow = startOfDay(new Date(now.getTime() + 86400000));
    let days;
    switch (range || '30d') {
      case '7d':
        days = 7;
        break;
      case '90d':
        days = 90;
        break;
      case '12m':
        days = 365;
        break;
      case '30d':
      default:
        days = 30;
        break;
    }
    if (range === '12m') {
      currentStart = startOfDay(subtractMonths(now, 12));
    } else {
      currentStart = startOfDay(subtractDays(tomorrow, days));
    }
    currentEnd = tomorrow;
  }

  const periodMs = currentEnd.getTime() - currentStart.getTime();
  previousEnd = new Date(currentStart.getTime());
  previousStart = new Date(previousEnd.getTime() - periodMs);

  return {
    currentStart: toSqlDate(currentStart),
    currentEnd: toSqlDate(currentEnd),
    previousStart: toSqlDate(previousStart),
    previousEnd: toSqlDate(previousEnd),
  };
}

function calcGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatOrderCode(id) {
  return `ORD-${String(id).padStart(6, '0')}`;
}

function derivePaymentStatus(status) {
  if (STATUS_GROUPS.REVENUE.includes(status)) return 'paid';
  if (STATUS_GROUPS.CANCELLED_OR_FAILED.includes(status)) return 'failed';
  if (STATUS_GROUPS.REFUNDED.includes(status)) return 'refunded';
  return 'pending';
}

function transformAlerts(alertsData) {
  const items = [];
  if (!alertsData) return items;
  const now = new Date().toISOString();
  for (const p of (alertsData.products || [])) {
    items.push({
      type: 'low_stock',
      severity: p.stock === 0 ? 'critical' : 'warning',
      message: `${p.name} chỉ còn ${p.stock} sản phẩm`,
      productId: p.id,
      createdAt: now,
    });
  }
  for (const v of (alertsData.variants || [])) {
    items.push({
      type: 'low_stock',
      severity: v.stockQuantity === 0 ? 'critical' : 'warning',
      message: `${v.productName} - ${v.volumeLabel || 'N/A'} chỉ còn ${v.stockQuantity} sản phẩm`,
      productId: v.productId,
      createdAt: now,
    });
  }
  return items;
}

// --- Summary endpoint ---

export async function getDashboardSummary(params = {}) {
  const { currentStart, currentEnd, previousStart, previousEnd } = resolveDateWindows(params);

  const revenueIn = sqlInClause(STATUS_GROUPS.REVENUE);
  const pendingIn = sqlInClause(STATUS_GROUPS.PENDING);
  const completedIn = sqlInClause(STATUS_GROUPS.COMPLETED_MAPPING);
  const cancelledFailedIn = sqlInClause(STATUS_GROUPS.CANCELLED_OR_FAILED);
  const refundedIn = sqlInClause(STATUS_GROUPS.REFUNDED);
  const validOrdersIn = sqlInClause(STATUS_GROUPS.VALID_ORDERS);

  const [
    // Revenue current + previous
    revCurr, revPrev,
    // Orders current + previous
    ordCurr, ordPrev,
    // Customers current + previous
    custCurr, custPrev,
    // Products (absolute + new in current + new in previous)
    prodTotal, prodNewCurr, prodNewPrev,
    // Order status breakdown
    pendingRows, completedRows, cancelledRows, refundedRows,
    // Low stock
    lowStockRows,
    variantLowStockSummaryRows,
    // Top products
    topProductRows,
    // Top categories
    topCategoryRows,
    // Recent orders
    recentOrderRows,
    // Alerts from inventory model
    alerts,
  ] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total), 0) AS value FROM orders
       WHERE status IN (${revenueIn}) AND created_at >= ? AND created_at < ?`,
      [...STATUS_GROUPS.REVENUE, currentStart, currentEnd]
    ),
    query(
      `SELECT COALESCE(SUM(total), 0) AS value FROM orders
       WHERE status IN (${revenueIn}) AND created_at >= ? AND created_at < ?`,
      [...STATUS_GROUPS.REVENUE, previousStart, previousEnd]
    ),
    query(
      `SELECT COUNT(*) AS value FROM orders
       WHERE status IN (${validOrdersIn}) AND created_at >= ? AND created_at < ?`,
      [...STATUS_GROUPS.VALID_ORDERS, currentStart, currentEnd]
    ),
    query(
      `SELECT COUNT(*) AS value FROM orders
       WHERE status IN (${validOrdersIn}) AND created_at >= ? AND created_at < ?`,
      [...STATUS_GROUPS.VALID_ORDERS, previousStart, previousEnd]
    ),
    query(
      `SELECT COUNT(DISTINCT user_id) AS value FROM orders
       WHERE status IN (${validOrdersIn}) AND user_id IS NOT NULL
         AND created_at >= ? AND created_at < ?`,
      [...STATUS_GROUPS.VALID_ORDERS, currentStart, currentEnd]
    ),
    query(
      `SELECT COUNT(DISTINCT user_id) AS value FROM orders
       WHERE status IN (${validOrdersIn}) AND user_id IS NOT NULL
         AND created_at >= ? AND created_at < ?`,
      [...STATUS_GROUPS.VALID_ORDERS, previousStart, previousEnd]
    ),
    query(
      'SELECT COUNT(*) AS value FROM products WHERE status = 1 AND deleted_at IS NULL'
    ),
    query(
      `SELECT COUNT(*) AS value FROM products
       WHERE status = 1 AND deleted_at IS NULL
         AND created_at >= ? AND created_at < ?`,
      [currentStart, currentEnd]
    ),
    query(
      `SELECT COUNT(*) AS value FROM products
       WHERE status = 1 AND deleted_at IS NULL
         AND created_at >= ? AND created_at < ?`,
      [previousStart, previousEnd]
    ),
    query(
      `SELECT COUNT(*) AS value FROM orders WHERE status IN (${pendingIn})`,
      STATUS_GROUPS.PENDING
    ),
    query(
      `SELECT COUNT(*) AS value FROM orders WHERE status IN (${completedIn})`,
      STATUS_GROUPS.COMPLETED_MAPPING
    ),
    query(
      `SELECT COUNT(*) AS value FROM orders WHERE status IN (${cancelledFailedIn})`,
      STATUS_GROUPS.CANCELLED_OR_FAILED
    ),
    query(
      `SELECT COUNT(*) AS value FROM orders WHERE status IN (${refundedIn})`,
      STATUS_GROUPS.REFUNDED
    ),
    query(
      `SELECT COUNT(*) AS value FROM products p
       WHERE p.deleted_at IS NULL AND p.status = 1 AND p.stock < ?
         AND NOT EXISTS (
           SELECT 1 FROM product_variants pv
           WHERE pv.product_id = p.id AND pv.deleted_at IS NULL AND ISNULL(pv.status, 1) = 1
         )`,
      [LOW_STOCK_THRESHOLD]
    ),
    query(
      `SELECT COUNT(*) AS value FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE p.deleted_at IS NULL AND p.status = 1
         AND pv.deleted_at IS NULL AND ISNULL(pv.status, 1) = 1
         AND pv.stock_quantity < ?`,
      [LOW_STOCK_THRESHOLD]
    ),
    query(
      `SELECT TOP 5 p.id, p.name, p.image, p.stock, p.price, p.discount_price,
              COALESCE(SUM(oi.quantity), 0) AS totalSold,
              COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status IN (${revenueIn})
         AND o.created_at >= ? AND o.created_at < ?
         AND p.status = 1 AND p.deleted_at IS NULL
       GROUP BY p.id, p.name, p.image, p.stock, p.price, p.discount_price
       ORDER BY totalSold DESC`,
      [...STATUS_GROUPS.REVENUE, currentStart, currentEnd]
    ),
    query(
      `SELECT TOP 5 c.id, c.name,
              COALESCE(SUM(oi.quantity), 0) AS totalSold
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.id_category
       WHERE o.status IN (${revenueIn})
         AND o.created_at >= ? AND o.created_at < ?
         AND p.status = 1 AND p.deleted_at IS NULL
       GROUP BY c.id, c.name
       ORDER BY totalSold DESC`,
      [...STATUS_GROUPS.REVENUE, currentStart, currentEnd]
    ),
    query(
      `SELECT TOP 5 o.id, o.total, o.status, o.payment_method, o.created_at,
              COALESCE(u.name, N'Khách vãng lai') AS customer_name,
              COALESCE(u.email, '') AS customer_email
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.status IN (${validOrdersIn})
       ORDER BY o.created_at DESC`,
      STATUS_GROUPS.VALID_ORDERS
    ),
    getLowStockAlerts(),
  ]);

  const totalRevenue = Number(revCurr[0]?.value || 0);
  const totalRevenuePrev = Number(revPrev[0]?.value || 0);
  const totalOrders = Number(ordCurr[0]?.value || 0);
  const totalOrdersPrev = Number(ordPrev[0]?.value || 0);
  const totalCustomers = Number(custCurr[0]?.value || 0);
  const totalCustomersPrev = Number(custPrev[0]?.value || 0);
  const totalProducts = Number(prodTotal[0]?.value || 0);
  const newProductsCurr = Number(prodNewCurr[0]?.value || 0);
  const newProductsPrev = Number(prodNewPrev[0]?.value || 0);

  return {
    summary: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockCount: Number(lowStockRows[0]?.value || 0) + Number(variantLowStockSummaryRows[0]?.value || 0),
      pendingOrders: Number(pendingRows[0]?.value || 0),
      completedOrders: Number(completedRows[0]?.value || 0),
      cancelledOrders: Number(cancelledRows[0]?.value || 0),
      refundedOrders: Number(refundedRows[0]?.value || 0),
    },
    trend: {
      revenueGrowth: calcGrowth(totalRevenue, totalRevenuePrev),
      orderGrowth: calcGrowth(totalOrders, totalOrdersPrev),
      customerGrowth: calcGrowth(totalCustomers, totalCustomersPrev),
      productGrowth: calcGrowth(newProductsCurr, newProductsPrev),
    },
    topProducts: topProductRows.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.image || '',
      soldQuantity: Number(row.totalSold || 0),
      revenue: Number(row.revenue || 0),
      stock: Number(row.stock || 0),
    })),
    topCategories: topCategoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      totalSold: Number(row.totalSold || 0),
    })),
    recentOrders: recentOrderRows.map((row) => ({
      id: row.id,
      orderCode: formatOrderCode(row.id),
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      status: row.status,
      paymentStatus: derivePaymentStatus(row.status),
      totalAmount: Number(row.total || 0),
      createdAt: row.created_at,
    })),
    alerts: transformAlerts(alerts),
  };
}

// --- Chart helpers ---

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function groupByExpr(column, groupBy) {
  switch (groupBy) {
    case 'day':
      return `CONVERT(date, ${column})`;
    case 'week':
      return `DATEADD(DAY, 1 - DATEPART(WEEKDAY, ${column}), CONVERT(date, ${column}))`;
    case 'month':
      return `DATEFROMPARTS(YEAR(${column}), MONTH(${column}), 1)`;
    default:
      return `CONVERT(date, ${column})`;
  }
}

function buildSeriesMap(rows, keyField, valueField) {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyField];
    const d = key instanceof Date ? key : new Date(key);
    map.set(toDateString(d), Number(row[valueField] || 0));
  }
  return map;
}

function generatePeriods(startDate, endDate, groupBy) {
  const periods = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    switch (groupBy) {
      case 'day':
        periods.push(toDateString(current));
        current.setDate(current.getDate() + 1);
        break;
      case 'week': {
        const dayOfWeek = current.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const mon = new Date(current);
        mon.setDate(mon.getDate() - daysFromMonday);
        periods.push(toDateString(mon));
        current.setDate(current.getDate() + 7);
        break;
      }
      case 'month':
        periods.push(toDateString(new Date(current.getFullYear(), current.getMonth(), 1)));
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        periods.push(toDateString(current));
        current.setDate(current.getDate() + 1);
    }
  }
  return periods;
}

function mergeChartSeries(periods, revenueMap, ordersMap, customersMap) {
  return periods.map((period) => ({
    date: period,
    revenue: revenueMap.get(period) || 0,
    orders: ordersMap.get(period) || 0,
    customers: customersMap.get(period) || 0,
  }));
}

// --- Charts endpoint ---

export async function getDashboardCharts(params = {}) {
  const { currentStart, currentEnd } = resolveDateWindows(params);

  const resolvedGroupBy = params.groupBy || (params.range === '90d' ? 'month' : 'day');
  const resolvedRange = params.range || (params.from ? 'custom' : '30d');

  const groupExpr = groupByExpr('o.created_at', resolvedGroupBy);

  const revenueIn = sqlInClause(STATUS_GROUPS.REVENUE);
  const validOrdersIn = sqlInClause(STATUS_GROUPS.VALID_ORDERS);

  const [revenueRows, orderRows, customerRows] = await Promise.all([
    query(
      `SELECT ${groupExpr} AS period, COALESCE(SUM(total), 0) AS revenue
       FROM orders o
       WHERE o.status IN (${revenueIn})
         AND o.created_at >= ? AND o.created_at < ?
       GROUP BY ${groupExpr}
       ORDER BY period`,
      [...STATUS_GROUPS.REVENUE, currentStart, currentEnd]
    ),
    query(
      `SELECT ${groupExpr} AS period, COUNT(*) AS orders
       FROM orders o
       WHERE o.status IN (${validOrdersIn})
         AND o.created_at >= ? AND o.created_at < ?
       GROUP BY ${groupExpr}
       ORDER BY period`,
      [...STATUS_GROUPS.VALID_ORDERS, currentStart, currentEnd]
    ),
    query(
      `SELECT ${groupExpr} AS period, COUNT(DISTINCT user_id) AS customers
       FROM orders o
       WHERE o.status IN (${validOrdersIn}) AND o.user_id IS NOT NULL
         AND o.created_at >= ? AND o.created_at < ?
       GROUP BY ${groupExpr}
       ORDER BY period`,
      [...STATUS_GROUPS.VALID_ORDERS, currentStart, currentEnd]
    ),
  ]);

  const revenueMap = buildSeriesMap(revenueRows, 'period', 'revenue');
  const ordersMap = buildSeriesMap(orderRows, 'period', 'orders');
  const customersMap = buildSeriesMap(customerRows, 'period', 'customers');

  const periods = generatePeriods(new Date(currentStart), new Date(currentEnd), resolvedGroupBy);

  return {
    range: resolvedRange,
    groupBy: resolvedGroupBy,
    startDate: toDateString(new Date(currentStart)),
    endDate: toDateString(new Date(currentEnd)),
    data: mergeChartSeries(periods, revenueMap, ordersMap, customersMap),
  };
}
