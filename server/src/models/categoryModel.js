import { query } from '../config/database.js';

export async function getCategories() {
  const rows = await query(
    `SELECT
      c.id,
      c.name,
      COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.id_category = c.id AND p.status = 1
     GROUP BY c.id, c.name
     ORDER BY c.id ASC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    productCount: Number(row.product_count || 0),
  }));
}
