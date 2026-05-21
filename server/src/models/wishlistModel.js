import { query } from '../config/database.js';
import { getProductById } from './productModel.js';

function toWishlistItem(row, product = null) {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    createdAt: row.created_at,
    product,
  };
}

export async function listWishlist(userId) {
  const rows = await query(
    `SELECT w.id, w.user_id, w.product_id, w.created_at
     FROM wishlist w
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC, w.id DESC`,
    [userId]
  );

  const items = [];
  for (const row of rows) {
    const product = await getProductById(row.product_id);
    if (product) {
      items.push(toWishlistItem(row, product));
    }
  }

  return items;
}

export async function addWishlistItem(userId, productId) {
  const existing = await query(
    'SELECT TOP 1 id FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  if (existing.length) {
    const items = await listWishlist(userId);
    return { alreadyExists: true, items };
  }

  const inserted = await query(
    `INSERT INTO wishlist (user_id, product_id)
     OUTPUT INSERTED.id AS id, INSERTED.user_id, INSERTED.product_id, INSERTED.created_at
     VALUES (?, ?)`,
    [userId, productId]
  );

  const row = inserted[0];
  const product = await getProductById(productId);
  const items = await listWishlist(userId);

  return {
    alreadyExists: false,
    item: row ? toWishlistItem(row, product) : null,
    items,
  };
}

export async function removeWishlistItem(userId, productId) {
  const deleted = await query(
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  return { deletedCount: deleted?.rowsAffected?.[0] || 0 };
}
