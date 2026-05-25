import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

const buckets = new Map();

function keyFor(req, scope) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  return `${scope}:${ip}`;
}

export function rateLimit({ scope = 'global', windowMs = env.authRateLimitWindowMs, max = env.authRateLimitMax } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const key = keyFor(req, scope);
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + Number(windowMs) };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + Number(windowMs);
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > Number(max)) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return errorResponse(res, 429, 'Qua nhieu yeu cau, vui long thu lai sau');
    }

    return next();
  };
}
