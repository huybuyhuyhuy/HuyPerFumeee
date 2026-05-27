import { errorResponse, successResponse } from '../utils/response.js';
import { getCharts, getStats, getSummary } from '../modules/admin/dashboard.service.js';

const ALLOWED_RANGES = new Set(['7d', '30d', '90d', '12m']);

function normalizeRange(value) {
  const range = String(value || '').trim();
  return ALLOWED_RANGES.has(range) ? range : '30d';
}

function percent(part, total) {
  const base = Number(total || 0);
  if (!base) return 0;
  return Math.round((Number(part || 0) / base) * 100);
}

export async function report(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(res, 401, 'Vui lòng đăng nhập với tài khoản admin');
    }

    const range = normalizeRange(req.query.range);
    const groupBy = range === '7d' || range === '30d' ? 'day' : 'month';
    const [statsData, summaryData, chartData] = await Promise.all([
      getStats(),
      getSummary({ range }),
      getCharts({ range, groupBy }),
    ]);

    const summary = summaryData.summary || {};
    const totalOrders = Number(summary.totalOrders ?? statsData.totalOrders ?? 0);
    const completedOrders = Number(summary.completedOrders ?? statsData.completedOrders ?? 0);
    const refundedOrders = Number(summary.refundedOrders ?? statsData.refundedOrders ?? 0);
    const totalRevenue = Number(summary.totalRevenue ?? statsData.totalRevenue ?? 0);

    return successResponse(res, 'Lấy báo cáo admin thành công', {
      range,
      groupBy,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers: Number(summary.totalCustomers ?? statsData.totalUsers ?? 0),
        totalProducts: Number(summary.totalProducts ?? statsData.totalProducts ?? 0),
        lowStockCount: Number(summary.lowStockCount ?? statsData.lowStockCount ?? 0),
        pendingOrders: Number(summary.pendingOrders ?? statsData.pendingOrders ?? 0),
        completedOrders,
        cancelledOrders: Number(summary.cancelledOrders ?? statsData.cancelledOrders ?? 0),
        refundedOrders,
        averageOrderValue: Math.round(totalRevenue / Math.max(totalOrders, 1)),
        completionRate: percent(completedOrders, totalOrders),
        refundRate: percent(refundedOrders, totalOrders),
      },
      trend: summaryData.trend || {},
      revenueSeries: chartData.data || [],
      topProducts: summaryData.topProducts || statsData.topProducts || [],
      topCategories: summaryData.topCategories || [],
      recentOrders: summaryData.recentOrders || [],
      alerts: summaryData.alerts || [],
    });
  } catch (err) {
    return errorResponse(res, 500, 'Lỗi khi lấy báo cáo admin', { message: err.message });
  }
}
