import { query } from '../config/database.js';

export async function listAdminOrders({ page = 1, pageSize = 10, userId = null } = {}) {
  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (safePage - 1) * safePageSize;
  const safeUserId = Number(userId) || null;
  const whereSql = safeUserId ? 'WHERE o.user_id = ?' : '';
  const filterParams = safeUserId ? [safeUserId] : [];

  const totalRows = await query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, filterParams);
  const rows = await query(
    `SELECT o.id, o.user_id, o.total, o.payment_method, o.status, o.created_at,
            COALESCE(u.name, 'Khách vãng lai') AS user_name
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ${whereSql}
     ORDER BY o.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...filterParams, offset, safePageSize]
  );

  return {
    listOrders: rows,
    currentOrderPage: safePage,
    totalOrderPages: Math.max(1, Math.ceil(Number(totalRows[0]?.total || 0) / safePageSize)),
  };
}

export async function getAdminOrderById(orderId) {
  const rows = await query(
    `SELECT o.id, o.total, o.payment_method, o.status, o.created_at,
            COALESCE(u.name, 'Khách vãng lai') AS user_name,
            COALESCE(u.email, '') AS user_email,
            o.shipping_address, o.phone
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId]
  );

  const order = rows[0];
  if (!order) return null;

  const items = await query(
    `SELECT oi.id AS item_id, oi.product_id, oi.quantity, oi.price, oi.status,
            p.name, p.image
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );

  return {
    id: order.id,
    total: Number(order.total || 0),
    paymentMethod: order.payment_method,
    status: order.status,
    createdAt: order.created_at,
    userName: order.user_name,
    userEmail: order.user_email,
    shippingAddress: order.shipping_address,
    phone: order.phone,
    items: items.map((row) => ({
      itemId: row.item_id,
      productId: row.product_id,
      name: row.name,
      image: row.image,
      quantity: Number(row.quantity || 0),
      price: Number(row.price || 0),
      status: row.status,
    })),
  };
}

export async function updateAdminOrderStatus(orderId, status) {
  await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  return { success: true, orderId, status };
}
