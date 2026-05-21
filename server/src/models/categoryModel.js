import { query } from '../config/database.js';

export async function getCategories() {
  const rows = await query('SELECT id, name FROM categories ORDER BY id ASC');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}
