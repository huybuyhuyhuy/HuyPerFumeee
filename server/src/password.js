import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function md5Hex(input) {
  return crypto.createHash('md5').update(input, 'utf8').digest('hex');
}

export function isBCryptHash(stored) {
  return stored && (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$'));
}

export async function verifyPassword(raw, stored) {
  if (isBCryptHash(stored)) {
    return bcrypt.compare(raw, stored);
  }
  return md5Hex(raw).toLowerCase() === String(stored).toLowerCase();
}

export function hashPasswordBcrypt(raw) {
  return bcrypt.hash(raw, 10);
}
