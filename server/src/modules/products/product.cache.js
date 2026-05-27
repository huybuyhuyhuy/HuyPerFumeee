import { createClient } from 'redis';
import { env } from '../../config/env.js';

const memoryCache = new Map();
let redisClientPromise = null;
let redisDisabled = false;

export const productCacheKeys = {
  detail: (id) => `huyperfume:product:detail:${id}`,
  list: (fingerprint) => `huyperfume:product:list:${fingerprint}`,
  recommendations: (kind, fingerprint) => `huyperfume:product:recommendations:${kind}:${fingerprint}`,
  reviewList: (productId, fingerprint = '*') => `huyperfume:product:reviews:${productId}:${fingerprint}`,
};

function getTtlSeconds() {
  return Math.max(30, Number(env.productCacheTtlSeconds || 300));
}

function getMemoryValue(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function setMemoryValue(key, value, ttlSeconds = getTtlSeconds()) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

async function getRedisClient() {
  if (!env.redisUrl || redisDisabled) return null;
  if (!redisClientPromise) {
    const client = createClient({ url: env.redisUrl });
    client.on('error', (error) => {
      redisDisabled = true;
      console.warn('Bộ nhớ đệm Redis đã tắt:', error.message);
    });
    redisClientPromise = client.connect().then(() => client).catch((error) => {
      redisDisabled = true;
      console.warn('Redis không khả dụng, dùng bộ nhớ tạm:', error.message);
      return null;
    });
  }
  return redisClientPromise;
}

export async function getCache(key) {
  const redis = await getRedisClient();
  if (redis) {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  return getMemoryValue(key);
}

export async function setCache(key, value, ttlSeconds = getTtlSeconds()) {
  const redis = await getRedisClient();
  if (redis) {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return;
  }
  setMemoryValue(key, value, ttlSeconds);
}

function patternToRegex(pattern) {
  return new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
}

export async function deleteCacheByPattern(pattern) {
  const redis = await getRedisClient();
  if (redis) {
    const keys = [];
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length > 0) await redis.del(keys);
    return;
  }

  const regex = patternToRegex(pattern);
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) memoryCache.delete(key);
  }
}

export async function invalidateProductCache(productId = null) {
  if (productId) {
    await deleteCacheByPattern(productCacheKeys.detail(productId));
    await deleteCacheByPattern(productCacheKeys.reviewList(productId));
    await deleteCacheByPattern(`huyperfume:product:recommendations:related:${productId}:*`);
  }
  await deleteCacheByPattern('huyperfume:product:list:*');
  await deleteCacheByPattern('huyperfume:product:recommendations:*');
}
