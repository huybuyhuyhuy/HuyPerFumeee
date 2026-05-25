import { query } from '../config/database.js';
import { cancelOrderForAdmin } from './orderModel.js';
import { getCheckoutStorageCapabilities, hasColumn } from '../modules/checkout/checkout.storage.js';

function isCancelledStatus(status) {
  return /cancelled|da huy|đã hủy/i.test(String(status || ''));
}

function isRefundedStatus(status) {
  return /refunded|hoàn tiền|hoan tien/i.test(String(status || ''));
}

export async function listAdminOrders({
  page = 1,
  pageSize = 10,
  userId = null,
  status = null,
  paymentMethod = null,
  dateFrom = null,
  dateTo = null,
  search = null,
} = {}) {
  const safePage = Math.max(1, Number(page));
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (safePage - 1) * safePageSize;

  const conditions = [];
  const params = [];

  if (userId) {
    conditions.push('o.user_id = ?');
    params.push(Number(userId));
  }
  if (status) {
    conditions.push('o.status = ?');
    params.push(String(status));
  }
  if (paymentMethod) {
    conditions.push('o.payment_method = ?');
    params.push(String(paymentMethod));
  }
  if (dateFrom) {
    conditions.push('o.created_at >= ?');
    params.push(String(dateFrom));
  }
  if (dateTo) {
    conditions.push('o.created_at < DATEADD(day, 1, CAST(? AS date))');
    params.push(String(dateTo));
  }
  if (search) {
    const searchNum = Number(search);
    if (!Number.isNaN(searchNum)) {
      conditions.push('(o.id = ? OR u.name LIKE ?)');
      params.push(searchNum, `%${search}%`);
    } else {
      conditions.push('u.name LIKE ?');
      params.push(`%${search}%`);
    }
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRows = await query(`SELECT COUNT(*) AS total FROM orders o LEFT JOIN users u ON u.id = o.user_id ${whereSql}`, params);
  const totalOrders = Number(totalRows[0]?.total || 0);
  const summaryRows = await query(
    `SELECT COUNT(*) AS total,
            SUM(ISNULL(o.total, 0)) AS value,
            SUM(CASE WHEN LOWER(o.status) IN ('waiting', 'pending', N'đã xác nhận') THEN 1 ELSE 0 END) AS awaiting,
            SUM(CASE WHEN LOWER(o.status) IN ('processing', 'shipped', N'đang giao') THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN LOWER(o.status) IN ('paid', 'delivered', 'completed', N'giao hàng thành công') THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN LOWER(o.status) IN ('cancelled', 'failed', 'refunded', N'đã hủy') THEN 1 ELSE 0 END) AS cancelled
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ${whereSql}`,
    params
  );
  const summary = summaryRows[0] || {};

  const rows = await query(
    `SELECT o.id, o.user_id, o.total, o.payment_method, o.status, o.created_at,
            COALESCE(u.name, N'Khách vãng lai') AS user_name
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ${whereSql}
     ORDER BY o.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, safePageSize]
  );

  return {
    listOrders: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      total: Number(r.total || 0),
      paymentMethod: r.payment_method,
      status: r.status,
      createdAt: r.created_at,
    })),
    currentOrderPage: safePage,
    totalOrderPages: Math.max(1, Math.ceil(totalOrders / safePageSize)),
    totalOrders,
    summary: {
      total: Number(summary.total || 0),
      value: Number(summary.value || 0),
      awaiting: Number(summary.awaiting || 0),
      processing: Number(summary.processing || 0),
      completed: Number(summary.completed || 0),
      cancelled: Number(summary.cancelled || 0),
    },
  };
}

export async function getAdminOrderById(orderId) {
  const capabilities = await getCheckoutStorageCapabilities();
  const rows = await query(
    `SELECT o.id, o.user_id, o.total, o.payment_method, o.status, o.created_at,
            COALESCE(u.name, N'Khách vãng lai') AS user_name,
            COALESCE(u.email, '') AS user_email,
            o.shipping_address, o.phone
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId]
  );

  const order = rows[0];
  if (!order) return null;

  const orderItemColumns = capabilities.orderItemColumns;
  const variantColumn = hasColumn(orderItemColumns, 'product_variant_id')
    ? 'oi.product_variant_id'
    : 'NULL AS product_variant_id';
  const batchColumn = hasColumn(orderItemColumns, 'selected_batch_code')
    ? 'oi.selected_batch_code'
    : "'' AS selected_batch_code";
  const purchasePriceColumn = hasColumn(orderItemColumns, 'price_at_purchase')
    ? 'oi.price_at_purchase'
    : 'oi.price AS price_at_purchase';
  const itemStatusColumn = hasColumn(orderItemColumns, 'status')
    ? 'oi.status'
    : 'NULL AS status';
  const items = await query(
    `SELECT oi.id AS item_id, oi.product_id, ${variantColumn}, oi.quantity,
            oi.price, ${itemStatusColumn}, ${batchColumn}, ${purchasePriceColumn},
            p.name, p.image
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );

  return {
    id: order.id,
    userId: order.user_id,
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
      variantId: row.product_variant_id || null,
      name: row.name,
      image: row.image,
      quantity: Number(row.quantity || 0),
      price: Number(row.price || 0),
      status: row.status,
      selectedBatchCode: row.selected_batch_code || '',
      priceAtPurchase: Number(row.price_at_purchase || 0),
    })),
  };
}

export async function updateAdminOrderStatus(orderId, status) {
  const normalizedStatus = String(status || '').trim();

  if (isCancelledStatus(normalizedStatus)) {
    const result = await cancelOrderForAdmin(orderId);
    if (result.code) return result;
    return { success: true, orderId, status: 'Cancelled', inventoryReleased: true };
  }

  if (isRefundedStatus(normalizedStatus)) {
    const result = await cancelOrderForAdmin(orderId);
    if (result.code) return result;
    await query('UPDATE orders SET status = ? WHERE id = ?', ['refunded', orderId]);
    return { success: true, orderId, status: 'refunded', inventoryReleased: true };
  }

  const currentRows = await query('SELECT TOP 1 status FROM orders WHERE id = ?', [orderId]);
  const current = currentRows[0];
  if (!current) return { code: 404, message: 'Không tìm thấy đơn hàng' };
  if (isCancelledStatus(current.status) || isRefundedStatus(current.status)) {
    return { code: 409, message: 'Đơn hàng đã hủy hoặc hoàn tiền không thể cập nhật sang trạng thái khác' };
  }

  await query('UPDATE orders SET status = ? WHERE id = ?', [normalizedStatus, orderId]);
  return { success: true, orderId, status: normalizedStatus };
}
