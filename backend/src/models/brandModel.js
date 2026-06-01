import { query } from '../config/database.js';

export async function getBrands() {
  const rows = await query('SELECT id, name, status FROM brand ORDER BY id ASC');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: !!row.status,
  }));
}
