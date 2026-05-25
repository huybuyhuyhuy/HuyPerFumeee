import { query } from '../../config/database.js';
import { getAuthStorageCapabilities } from './auth.storage.js';

const memoryAttempts = [];

export async function recordLoginAttempt({ identifier, userId = null, ipAddress = '', userAgent = '', success, failureReason = '' }) {
  const capabilities = await getAuthStorageCapabilities();
  const record = {
    identifier: String(identifier || '').toLowerCase(),
    userId,
    ipAddress,
    userAgent,
    success: Boolean(success),
    failureReason,
    createdAt: Date.now(),
  };

  if (!capabilities.hasLoginAttempts) {
    memoryAttempts.push(record);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    while (memoryAttempts.length && memoryAttempts[0].createdAt < cutoff) memoryAttempts.shift();
    return;
  }

  await query(
    `INSERT INTO login_attempts (identifier, user_id, ip_address, user_agent, success, failure_reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [record.identifier, userId, ipAddress, userAgent, success ? 1 : 0, failureReason || null]
  );
}

export async function countFailedLoginAttempts(identifier, windowMs) {
  const normalized = String(identifier || '').toLowerCase();
  const capabilities = await getAuthStorageCapabilities();

  if (!capabilities.hasLoginAttempts) {
    const cutoff = Date.now() - Number(windowMs);
    return memoryAttempts.filter((attempt) => (
      attempt.identifier === normalized &&
      !attempt.success &&
      attempt.createdAt >= cutoff
    )).length;
  }

  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM login_attempts
     WHERE identifier = ?
       AND success = 0
       AND created_at >= DATEADD(millisecond, ?, SYSUTCDATETIME())`,
    [normalized, -Math.abs(Number(windowMs))]
  );
  return Number(rows[0]?.total || 0);
}
