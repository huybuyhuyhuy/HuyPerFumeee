import { query } from '../../config/database.js';
import { getAuthStorageCapabilities } from './auth.storage.js';

function normalizeAddress(row) {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label || '',
    recipientName: row.recipient_name || '',
    phone: row.phone || '',
    line1: row.line1 || '',
    line2: row.line2 || '',
    ward: row.ward || '',
    district: row.district || '',
    city: row.city || '',
    country: row.country || 'VN',
    postalCode: row.postal_code || '',
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export async function hasAddressStorage() {
  const capabilities = await getAuthStorageCapabilities();
  return capabilities.hasUserAddresses;
}

export async function listUserAddresses(userId) {
  if (!(await hasAddressStorage())) return [];
  const rows = await query(
    `SELECT id, user_id, label, recipient_name, phone, line1, line2, ward, district,
            city, country, postal_code, is_default, created_at, updated_at
     FROM user_addresses
     WHERE user_id = ? AND deleted_at IS NULL
     ORDER BY is_default DESC, id DESC`,
    [userId]
  );
  return rows.map(normalizeAddress);
}

export async function createUserAddress(userId, payload) {
  if (!(await hasAddressStorage())) return null;
  if (payload.isDefault) {
    await query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND deleted_at IS NULL', [userId]);
  }

  const rows = await query(
    `INSERT INTO user_addresses
       (user_id, label, recipient_name, phone, line1, line2, ward, district, city, country, postal_code, is_default)
     OUTPUT INSERTED.id AS id
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      payload.label || '',
      payload.recipientName,
      payload.phone,
      payload.line1,
      payload.line2 || '',
      payload.ward || '',
      payload.district || '',
      payload.city || '',
      payload.country || 'VN',
      payload.postalCode || '',
      payload.isDefault ? 1 : 0,
    ]
  );

  return getUserAddressById(userId, rows[0]?.id);
}

export async function getUserAddressById(userId, addressId) {
  if (!(await hasAddressStorage())) return null;
  const rows = await query(
    `SELECT id, user_id, label, recipient_name, phone, line1, line2, ward, district,
            city, country, postal_code, is_default, created_at, updated_at
     FROM user_addresses
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [addressId, userId]
  );
  return rows[0] ? normalizeAddress(rows[0]) : null;
}

export async function updateUserAddress(userId, addressId, payload) {
  if (!(await hasAddressStorage())) return null;
  if (payload.isDefault) {
    await query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND deleted_at IS NULL', [userId]);
  }

  await query(
    `UPDATE user_addresses
     SET label = ?, recipient_name = ?, phone = ?, line1 = ?, line2 = ?, ward = ?,
         district = ?, city = ?, country = ?, postal_code = ?, is_default = ?,
         updated_at = SYSUTCDATETIME()
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [
      payload.label || '',
      payload.recipientName,
      payload.phone,
      payload.line1,
      payload.line2 || '',
      payload.ward || '',
      payload.district || '',
      payload.city || '',
      payload.country || 'VN',
      payload.postalCode || '',
      payload.isDefault ? 1 : 0,
      addressId,
      userId,
    ]
  );

  return getUserAddressById(userId, addressId);
}

export async function deleteUserAddress(userId, addressId) {
  if (!(await hasAddressStorage())) return false;
  await query(
    `UPDATE user_addresses
     SET deleted_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [addressId, userId]
  );
  return true;
}

export async function setDefaultUserAddress(userId, addressId) {
  if (!(await hasAddressStorage())) return null;
  const address = await getUserAddressById(userId, addressId);
  if (!address) return null;
  await query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND deleted_at IS NULL', [userId]);
  await query(
    'UPDATE user_addresses SET is_default = 1, updated_at = SYSUTCDATETIME() WHERE id = ? AND user_id = ?',
    [addressId, userId]
  );
  return getUserAddressById(userId, addressId);
}
