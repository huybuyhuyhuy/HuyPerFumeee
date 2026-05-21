import sql from 'mssql';
import { getDbPool, query } from '../config/database.js';
import { clearCart, getCart } from './cartModel.js';
import { getProductById } from './productModel.js';

function toOrderItem(row) {
  return {
    id: row.item_id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image || '',
    quantity: Number(row.quantity || 0),
    price: Number(row.price || 0),
    priceAtPurchase: Number(row.price_at_purchase || row.price || 0),
    selectedBatchCode: row.selected_batch_code || '',
  };
}

function toOrder(row, items = []) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '',
    total: Number(row.total || 0),
    shippingAddress: row.shipping_address || '',
    phone: row.phone || '',
    paymentMethod: row.payment_method || '',
    momoOrderId: row.momo_order_id || '',
    momoTransId: row.momo_trans_id || '',
    zalopayAppTransId: row.zalopay_app_trans_id || '',
    status: row.status || '',
    createdAt: row.created_at,
    items,
  };
}

function validatePaymentMethod(paymentMethod) {
  const allowed = ['COD', 'VNPAY', 'BANKING', 'MOMO', 'ZALOPAY'];
  return allowed.includes(String(paymentMethod || '').toUpperCase());
}

export async function checkoutOrder({ userId, shippingAddress, phone, paymentMethod, cartToken }) {
  if (!userId) {
    return { code: 401, message: 'Vui lòng đăng nhập để thanh toán' };
  }
  if (!String(shippingAddress || '').trim()) {
    return { code: 400, message: 'Địa chỉ giao hàng không được để trống' };
  }
  if (!/^\d{10}$/.test(String(phone || ''))) {
    return { code: 400, message: 'Số điện thoại phải có 10 chữ số' };
  }
  if (!validatePaymentMethod(paymentMethod)) {
    return { code: 400, message: 'Phương thức thanh toán không hợp lệ' };
  }

  const cart = await getCart({ type: 'user', key: userId });
  if (!cart.items.length) {
    return { code: 400, message: 'Giỏ hàng đang trống' };
  }

  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    let total = 0;
    const preparedItems = [];

    for (const item of cart.items) {
      const product = await getProductById(item.product.id);
      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm ${item.product.id}`);
      }
      if (item.quantity > product.stock) {
        await transaction.rollback();
        return { code: 400, message: `Sản phẩm ${product.name} không đủ tồn kho` };
      }

      const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      total += unitPrice * item.quantity;
      preparedItems.push({
        product,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const request = new sql.Request(transaction);
    request.input('userId', sql.Int, userId);
    request.input('total', sql.Float, total);
    request.input('shippingAddress', sql.NVarChar, String(shippingAddress).trim());
    request.input('phone', sql.NVarChar, String(phone).trim());
    request.input('paymentMethod', sql.NVarChar, String(paymentMethod).trim().toUpperCase());
    request.input('status', sql.NVarChar, 'Waiting');

    const orderResult = await request.query(
      `INSERT INTO orders (user_id, total, shipping_address, phone, payment_method, status)
       OUTPUT INSERTED.id AS id
       VALUES (@userId, @total, @shippingAddress, @phone, @paymentMethod, @status)`
    );

    const orderId = orderResult.recordset?.[0]?.id;
    if (!orderId) {
      throw new Error('Không tạo được đơn hàng');
    }

    for (const item of preparedItems) {
      const itemRequest = new sql.Request(transaction);
      itemRequest.input('orderId', sql.Int, orderId);
      itemRequest.input('productId', sql.Int, item.product.id);
      itemRequest.input('quantity', sql.Int, item.quantity);
      itemRequest.input('price', sql.Float, item.unitPrice);
      itemRequest.input('selectedBatchCode', sql.NVarChar, item.product.batchCode || '');
      itemRequest.input('priceAtPurchase', sql.Float, item.unitPrice);

      await itemRequest.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, selected_batch_code, price_at_purchase, status)
         VALUES (@orderId, @productId, @quantity, @price, @selectedBatchCode, @priceAtPurchase, 'Normal')`
      );

      const stockRequest = new sql.Request(transaction);
      stockRequest.input('productId', sql.Int, item.product.id);
      stockRequest.input('quantity', sql.Int, item.quantity);
      await stockRequest.query('UPDATE products SET stock = stock - @quantity WHERE id = @productId');
    }

    await transaction.commit();
    await clearCart({ type: 'user', key: userId });

    const createdOrder = await getOrderByIdForUser(orderId, userId);
    return { order: createdOrder };
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    throw error;
  }
}

export async function getOrderByIdForUser(orderId, userId) {
  const orderRows = await query(
    `SELECT TOP 1 o.id, o.user_id, u.name AS user_name, o.total, o.shipping_address, o.phone,
            o.payment_method, o.momo_order_id, o.momo_trans_id, o.zalopay_app_trans_id,
            o.status, o.created_at
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     WHERE o.id = ? AND o.user_id = ?`,
    [orderId, userId]
  );
  const order = orderRows[0];
  if (!order) return null;

  const itemRows = await query(
    `SELECT oi.id AS item_id, oi.product_id, p.name AS product_name, p.image AS product_image,
            oi.quantity, oi.price, oi.price_at_purchase, oi.selected_batch_code
     FROM order_items oi
     INNER JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );

  return toOrder(order, itemRows.map(toOrderItem));
}

export async function listOrderHistory(userId) {
  const orderRows = await query(
    `SELECT o.id, o.user_id, u.name AS user_name, o.total, o.shipping_address, o.phone,
            o.payment_method, o.momo_order_id, o.momo_trans_id, o.zalopay_app_trans_id,
            o.status, o.created_at
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     WHERE o.user_id = ?
     ORDER BY o.id DESC`,
    [userId]
  );

  const orders = [];
  for (const orderRow of orderRows) {
    const itemRows = await query(
      `SELECT oi.id AS item_id, oi.product_id, p.name AS product_name, p.image AS product_image,
              oi.quantity, oi.price, oi.price_at_purchase, oi.selected_batch_code
       FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [orderRow.id]
    );
    orders.push(toOrder(orderRow, itemRows.map(toOrderItem)));
  }
  return orders;
}

export async function cancelOrder(userId, orderId) {
  const orderRows = await query(
    'SELECT TOP 1 id, user_id, status, created_at FROM orders WHERE id = ? AND user_id = ?',
    [orderId, userId]
  );
  const order = orderRows[0];
  if (!order) return { code: 404, message: 'Không tìm thấy đơn hàng' };
  if (/cancelled|đã hủy/i.test(String(order.status || ''))) {
    return { code: 400, message: 'Đơn hàng đã bị hủy' };
  }

  const createdAt = new Date(order.created_at);
  const diffMinutes = (Date.now() - createdAt.getTime()) / (1000 * 60);
  if (diffMinutes > 5) {
    return { code: 400, message: 'Chỉ có thể hủy đơn trong 5 phút đầu' };
  }

  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const request = new sql.Request(transaction);
    request.input('orderId', sql.Int, orderId);
    await request.query("UPDATE orders SET status = N'Đã hủy' WHERE id = @orderId");

    const items = await query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of items) {
      const stockRequest = new sql.Request(transaction);
      stockRequest.input('productId', sql.Int, item.product_id);
      stockRequest.input('quantity', sql.Int, item.quantity);
      await stockRequest.query('UPDATE products SET stock = stock + @quantity WHERE id = @productId');
    }

    await transaction.commit();
    return { ok: true };
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    throw error;
  }
}
