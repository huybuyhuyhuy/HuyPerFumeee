import { query, getDbPool } from '../config/database.js';

let redisClient = null;
try {
  const redisMod = await import('redis');
  redisClient = redisMod.createClient;
} catch {
  // Redis not available
}

let redis = null;
async function getRedisClient() {
  if (!redisClient) return null;
  if (redis) return redis;
  try {
    const { REDIS_URL } = await import('../config/env.js');
    const url = process.env.REDIS_URL || REDIS_URL?.env?.REDIS_URL;
    if (!url) return null;
    redis = redisClient({ url });
    redis.on('error', () => {});
    await redis.connect();
    return redis;
  } catch {
    return null;
  }
}

async function checkDatabase() {
  const start = Date.now();
  try {
    await query('SELECT 1 AS ok');
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { status: 'error', message: err.message, latencyMs: Date.now() - start };
  }
}

async function checkRedis() {
  const start = Date.now();
  try {
    const client = await getRedisClient();
    if (!client) return { status: 'unavailable', message: 'Redis chưa được cấu hình' };
    const result = await client.ping();
    return { status: result === 'PONG' ? 'ok' : 'error', latencyMs: Date.now() - start };
  } catch (err) {
    return { status: 'error', message: err.message, latencyMs: Date.now() - start };
  }
}

export async function healthCheck(_req, res) {
  const [db, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);
  const allOk = db.status === 'ok';

  res.status(allOk ? 200 : 503).json({
    ok: allOk,
    service: 'huyperfume-server',
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: db,
      redis: redisCheck,
    },
    timestamp: new Date().toISOString(),
  });
}

export function liveness(_req, res) {
  res.status(200).json({ ok: true, service: 'huyperfume-server', uptime: process.uptime() });
}

export async function readiness(_req, res) {
  const [db, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);
  const ready = db.status === 'ok';
  res.status(ready ? 200 : 503).json({
    ok: ready,
    service: 'huyperfume-server',
    checks: { database: db, redis: redisCheck },
    timestamp: new Date().toISOString(),
  });
}
