import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Same key derivation as Spring JwtTokenProvider:
 * Keys.hmacShaKeyFor(Base64.getDecoder().decode(Base64.getEncoder().encodeToString(secret.getBytes())))
 */
export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'huyperfume-jwt-secret-key-change-in-production-must-be-at-least-256-bits';
  const b64 = Buffer.from(secret, 'utf8').toString('base64');
  return Buffer.from(b64, 'base64');
}

export function signToken(userId, email, role) {
  const key = getJwtSecretKey();
  const expMs = Number(process.env.JWT_EXPIRATION_MS || 86400000);
  return jwt.sign(
    { email, role },
    key,
    {
      subject: String(userId),
      algorithm: 'HS256',
      expiresIn: Math.floor(expMs / 1000),
    }
  );
}

export function verifyToken(token) {
  const key = getJwtSecretKey();
  return jwt.verify(token, key, { algorithms: ['HS256'] });
}
