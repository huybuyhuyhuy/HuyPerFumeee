import { createClient } from 'redis';
import { randomUUID } from 'crypto';
import { env } from '../../config/env.js';

let redisClientPromise = null;
let redisDisabled = false;
const memoryLocks = new Map();
const memoryReservations = new Map();

async function getRedisClient() {
  if (!env.redisUrl || redisDisabled) return null;
  if (!redisClientPromise) {
    const client = createClient({ url: env.redisUrl });
    client.on('error', (error) => {
      redisDisabled = true;
      console.warn('Đặt chỗ Redis thanh toán đã tắt:', error.message);
    });
    redisClientPromise = client.connect().then(() => client).catch((error) => {
      redisDisabled = true;
      console.warn('Redis không khả dụng, dùng bộ nhớ cục bộ:', error.message);
      return null;
    });
  }
  return redisClientPromise;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stockKey(item) {
  return item.variantId
    ? `variant:${item.variantId}`
    : `product:${item.productId}`;
}

function lockKey(item) {
  return `huyperfume:inventory:lock:${stockKey(item)}`;
}

function reservationKey(owner, item, index) {
  return `huyperfume:inventory:reservation:${owner}:${stockKey(item)}:${Date.now()}:${index}`;
}

async function acquireRedisLock(redis, key, token, ttlMs) {
  const result = await redis.set(key, token, { NX: true, PX: ttlMs });
  return result === 'OK';
}

async function releaseRedisLock(redis, key, token) {
  await redis.eval(
    `if redis.call("GET", KEYS[1]) == ARGV[1] then
       return redis.call("DEL", KEYS[1])
     end
     return 0`,
    { keys: [key], arguments: [token] }
  );
}

async function acquireMemoryLock(key, token, ttlMs) {
  const now = Date.now();
  const existing = memoryLocks.get(key);
  if (existing && existing.expiresAt > now) return false;
  memoryLocks.set(key, { token, expiresAt: now + ttlMs });
  return true;
}

function releaseMemoryLock(key, token) {
  const existing = memoryLocks.get(key);
  if (existing?.token === token) memoryLocks.delete(key);
}

export async function withInventoryReservationLocks(items, callback) {
  const lockItems = [...items]
    .map((item) => ({ key: lockKey(item), token: randomUUID() }))
    .sort((a, b) => a.key.localeCompare(b.key));
  const redis = await getRedisClient();
  const ttlMs = Math.max(1000, Number(env.checkoutLockTtlMs || 10000));
  const acquired = [];

  try {
    for (const item of lockItems) {
      let locked = false;
      for (let attempt = 0; attempt < 25 && !locked; attempt += 1) {
        locked = redis
          ? await acquireRedisLock(redis, item.key, item.token, ttlMs)
          : await acquireMemoryLock(item.key, item.token, ttlMs);
        if (!locked) await sleep(80);
      }

      if (!locked) {
        return { code: 409, message: 'Hệ thống đang bận, vui lòng thử lại sau' };
      }
      acquired.push(item);
    }

    return await callback();
  } finally {
    for (const item of acquired.reverse()) {
      try {
        if (redis) await releaseRedisLock(redis, item.key, item.token);
        else releaseMemoryLock(item.key, item.token);
      } catch (error) {
        console.warn('Không thể giải phóng khóa tồn kho:', error.message);
      }
    }
  }
}

export async function createRedisReservations(items, { owner, ttlSeconds }) {
  const redis = await getRedisClient();
  const ttl = Math.max(30, Number(ttlSeconds || env.checkoutReservationTtlSeconds || 900));
  const keys = [];

  try {
    for (const [index, item] of items.entries()) {
      const key = reservationKey(owner, item, index);
      const value = JSON.stringify({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        owner,
        createdAt: new Date().toISOString(),
      });

      if (redis) {
        await redis.set(key, value, { EX: ttl });
      } else {
        memoryReservations.set(key, {
          value,
          expiresAt: Date.now() + ttl * 1000,
        });
      }
      keys.push(key);
    }
  } catch (error) {
    await releaseRedisReservations(keys);
    throw error;
  }

  return keys;
}

export async function releaseRedisReservations(keys = []) {
  const redis = await getRedisClient();
  if (redis && keys.length > 0) {
    await redis.del(keys);
    return;
  }

  for (const key of keys) {
    memoryReservations.delete(key);
  }
}
