import { query } from '../config/database.js';

export async function findUserByEmailOrPhone(identifier) {
  const rows = await query(
    'SELECT TOP 1 id, name, email, phone, password, role, address, dob FROM users WHERE email = ? OR phone = ?',
    [identifier, identifier]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const rows = await query(
    'SELECT TOP 1 id, name, email, phone, role, address, dob FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

export async function findUserByEmail(email) {
  const rows = await query('SELECT TOP 1 id FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function findUserByPhone(phone) {
  const rows = await query('SELECT TOP 1 id FROM users WHERE phone = ?', [phone]);
  return rows[0] || null;
}

export async function createUser({ name, email, phone, password, address }) {
  await query(
    `INSERT INTO users (name, email, phone, password, role, address)
     VALUES (?, ?, ?, ?, 'user', ?)`,
    [name, email, phone, password, address || '']
  );
  const rows = await query('SELECT TOP 1 id FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function updateUserProfile(id, { name, phone, address, dob }) {
  await query(
    'UPDATE users SET name = ?, phone = ?, address = ?, dob = ? WHERE id = ?',
    [name, phone, address, dob || null, id]
  );
}

export async function updateUserPasswordByEmail(email, password) {
  await query('UPDATE users SET password = ? WHERE email = ?', [password, email]);
}

export async function listUsers() {
  return query(
    `SELECT id, name, email, phone, role, address, dob, created_at
     FROM users
     ORDER BY id DESC`
  );
}
