import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';

/**
 * Same key derivation as Spring JwtTokenProvider:
 * Keys.hmacShaKeyFor(Base64.getDecoder().decode(Base64.getEncoder().encodeToString(secret.getBytes())))
 */
export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'huyperfume-jwt-secret-key-change-in-production-must-be-at-least-256-bits';
  const b64 = Buffer.from(secret, 'utf8').toString('base64');
  return Buffer.from(b64, 'base64');
}

export function signAccessToken(user, permissions = []) {
  const key = getJwtSecretKey();
  const expMs = Number(env.jwtExpirationMs || 86400000);
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      permissions,
      tokenType: 'access',
      jti: crypto.randomUUID(),
    },
    key,
    {
      subject: String(user.id),
      algorithm: 'HS256',
      expiresIn: Math.floor(expMs / 1000),
    }
  );
}

export function verifyToken(token) {
  const key = getJwtSecretKey();
  return jwt.verify(token, key, { algorithms: ['HS256'] });
}

export function signToken(userId, email, role) {
  return signAccessToken({ id: userId, email, role });
}

export function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

export function generateSecureToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url');
}
