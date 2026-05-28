import * as repo from './dashboard.repository.js';
import * as mapper from './dashboard.mapper.js';
import { getLowStockAlerts } from '../../models/adminInventoryModel.js';
import { normalizeOrderStatus } from '../../constants/orderStatus.js';

// ────────────────────────────────────────────────────────────
//  Date helpers
// ────────────────────────────────────────────────────────────

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

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMonthStartString(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function buildRecentMonthStarts(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return toMonthStartString(date);
  });
}

function normalizeMonthlySeries(rows = [], valueField, outputField) {
  const values = new Map(
    rows.map((row) => [toMonthStartString(row.monthStart), Number(row[valueField] || 0)])
  );
  return buildRecentMonthStarts(6).map((monthStart) => ({
    monthStart,
    [outputField]: values.get(monthStart) || 0,
  }));
}

/**
 * Resolve { range, from, to } into four SQL-date boundaries:
 * currentStart, currentEnd, previousStart, previousEnd.
 *
 * Rules:
 *  - If `from` is given, use it as currentStart; `to` defaults to tomorrow.
 *  - Otherwise use `range` (7d / 30d / 90d / 12m) anchored to today.
 *  - The previous window has the same duration as the current window,
 *    ending exactly where the current window begins.
 */
function resolveDateWindows({ range, from, to }) {
  const now = new Date();
  let currentStart, currentEnd;

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
    switch (range || '30d') {
      case '7d':
        currentStart = startOfDay(subtractDays(tomorrow, 7));
        break;
      case '90d':
        currentStart = startOfDay(subtractDays(tomorrow, 90));
        break;
      case '12m':
        currentStart = startOfDay(subtractMonths(now, 12));
        break;
      case '30d':
      default:
        currentStart = startOfDay(subtractDays(tomorrow, 30));
        break;
    }
    currentEnd = tomorrow;
  }

  const periodMs = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime());
  const previousStart = new Date(previousEnd.getTime() - periodMs);

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

function calcTrendGrowth(rows = []) {
  const midpoint = Math.floor(rows.length / 2);
  const previous = rows.slice(0, midpoint).reduce((sum, row) => sum + Number(row.orders || 0), 0);
  const current = rows.slice(midpoint).reduce((sum, row) => sum + Number(row.orders || 0), 0);
  return calcGrowth(current, previous);
}

// ────────────────────────────────────────────────────────────
//  Chart helpers (group-by & zero-fill)
// ────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────
//  Public API
// ────────────────────────────────────────────────────────────

/**
 * Quick overview stats — revenue, orders, users, products, low-stock,
 * plus 6-month sparkline data and top 10 products.
 */
export async function getStats() {
  const [
    orderStats,
    totalProducts,
    totalUsers,
    newUsersThisMonth,
    chartSeries,
    orderTrendRows,
    topProductRows,
    lowStockProducts,
    recentOrderRows,
  ] = await Promise.all([
    repo.fetchOrderStats(),
    repo.fetchTotalProducts(),
    repo.fetchTotalUsers(),
    repo.fetchNewUsersThisMonth(),
    repo.fetchStatsChartSeries(),
    repo.fetchRecentOrderTrend(14),
    repo.fetchTopProducts(10, null),
    repo.fetchLowStockProductCount(),
    repo.fetchRecentOrders(8),
  ]);

  const stats = mapper.toOrderStats(orderStats);
  return {
    ...stats,
    totalProducts,
    totalUsers,
    newUsersThisMonth,
    lowStockProducts,
    lowStockCount: lowStockProducts,
    charts: {
      revenue: normalizeMonthlySeries(chartSeries.revenue, 'revenue', 'revenue'),
      orders: normalizeMonthlySeries(chartSeries.orders, 'orders', 'orders'),
      users: normalizeMonthlySeries(chartSeries.users, 'users', 'users'),
    },
    orderGrowth: calcTrendGrowth(orderTrendRows),
    orderTrend: orderTrendRows.map((row) => ({
      date: toDateString(row.date),
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
    })),
    topProducts: topProductRows.map(mapper.toTopProduct),
    recentOrders: recentOrderRows.map((row) => ({
      id: row.id,
      userName: row.customer_name || 'Khách vãng lai',
      total: Number(row.total || 0),
      status: normalizeOrderStatus(row.status),
      createdAt: row.created_at,
    })),
  };
}

/**
 * Detailed summary within a configurable date window.
 * Includes growth percentages (current vs previous period).
 */
export async function getSummary(params = {}) {
  const { currentStart, currentEnd, previousStart, previousEnd } = resolveDateWindows(params);

  const [
    revenueCurr,
    revenuePrev,
    ordersCurr,
    ordersPrev,
    customersCurr,
    customersPrev,
    totalProducts,
    newProductsCurr,
    newProductsPrev,
    statusBreakdown,
    lowStockCount,
    topProductRows,
    topCategoryRows,
    recentOrderRows,
    alerts,
  ] = await Promise.all([
    repo.fetchRevenueInPeriod(currentStart, currentEnd),
    repo.fetchRevenueInPeriod(previousStart, previousEnd),
    repo.fetchOrderCountInPeriod(currentStart, currentEnd),
    repo.fetchOrderCountInPeriod(previousStart, previousEnd),
    repo.fetchCustomerCountInPeriod(currentStart, currentEnd),
    repo.fetchCustomerCountInPeriod(previousStart, previousEnd),
    repo.fetchTotalProducts(),
    repo.fetchNewProductsInPeriod(currentStart, currentEnd),
    repo.fetchNewProductsInPeriod(previousStart, previousEnd),
    repo.fetchOrderStatusBreakdown(),
    repo.fetchLowStockCount(),
    repo.fetchTopProducts(5, { start: currentStart, end: currentEnd }),
    repo.fetchTopCategories(5, currentStart, currentEnd),
    repo.fetchRecentOrders(5),
    getLowStockAlerts(),
  ]);

  return {
    summary: {
      totalRevenue: revenueCurr,
      totalOrders: ordersCurr,
      totalCustomers: customersCurr,
      totalProducts,
      lowStockCount,
      pendingOrders: Number(statusBreakdown.pendingOrders || 0),
      completedOrders: Number(statusBreakdown.completedOrders || 0),
      cancelledOrders: Number(statusBreakdown.cancelledOrders || 0),
      refundedOrders: Number(statusBreakdown.refundedOrders || 0),
    },
    trend: {
      revenueGrowth: calcGrowth(revenueCurr, revenuePrev),
      orderGrowth: calcGrowth(ordersCurr, ordersPrev),
      customerGrowth: calcGrowth(customersCurr, customersPrev),
      productGrowth: calcGrowth(newProductsCurr, newProductsPrev),
    },
    topProducts: topProductRows.map(mapper.toTopProduct),
    topCategories: topCategoryRows.map(mapper.toTopCategory),
    recentOrders: recentOrderRows.map(mapper.toRecentOrder),
    alerts: mapper.transformAlerts(alerts),
  };
}

/**
 * Time-series chart data (revenue, orders, customers) grouped by day/week/month.
 * Missing periods are zero-filled so the frontend always gets a contiguous array.
 */
export async function getCharts(params = {}) {
  const { currentStart, currentEnd } = resolveDateWindows(params);

  const resolvedGroupBy = params.groupBy || (params.range === '90d' ? 'month' : 'day');
  const resolvedRange = params.range || (params.from ? 'custom' : '30d');

  const groupExpr = groupByExpr('o.created_at', resolvedGroupBy);

  const [revenueRows, orderRows, customerRows] = await Promise.all([
    repo.fetchChartRevenue(groupExpr, currentStart, currentEnd),
    repo.fetchChartOrders(groupExpr, currentStart, currentEnd),
    repo.fetchChartCustomers(groupExpr, currentStart, currentEnd),
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
