import { query } from '../config/database.js';

export async function getDashboardStats() {
  const revenueRows = await query(
    "SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM orders WHERE status IN ('Paid', 'Delivered', 'Completed', 'Giao hàng thành công', 'Đã xác nhận', 'Đang giao')"
  );
  const orderRows = await query(
    "SELECT COUNT(*) AS totalOrders FROM orders WHERE status NOT IN ('Cart', 'Đã hủy', 'Cancelled')"
  );
  const productRows = await query('SELECT COUNT(*) AS totalProducts FROM products');
  const userRows = await query('SELECT COUNT(*) AS totalUsers FROM users');

  return {
    totalRevenue: Number(revenueRows[0]?.totalRevenue || 0),
    totalOrders: Number(orderRows[0]?.totalOrders || 0),
    totalProducts: Number(productRows[0]?.totalProducts || 0),
    totalUsers: Number(userRows[0]?.totalUsers || 0),
  };
}
