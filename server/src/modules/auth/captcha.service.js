import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';

const CAPTCHA_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SUPPORTED_PURPOSES = new Set(['login', 'register']);
const consumedChallenges = new Map();

function normalizePurpose(value) {
  const purpose = String(value || '').trim().toLowerCase();
  return SUPPORTED_PURPOSES.has(purpose) ? purpose : null;
}

function createCode(length = 5) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => CAPTCHA_CHARACTERS[byte % CAPTCHA_CHARACTERS.length]).join('');
}

function normalizeAnswer(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function answerHash(answer, salt) {
  return createHash('sha256').update(`${salt}:${normalizeAnswer(answer)}`).digest('hex');
}

function tokenSignature(payload) {
  return createHmac('sha256', env.captchaSecret).update(payload).digest('base64url');
}

function matchesSignature(left, right) {
  const first = Buffer.from(String(left || ''));
  const second = Buffer.from(String(right || ''));
  return first.length === second.length && timingSafeEqual(first, second);
}

function cleanupConsumedChallenges() {
  const now = Date.now();
  for (const [token, expiresAt] of consumedChallenges.entries()) {
    if (expiresAt <= now) consumedChallenges.delete(token);
  }
}

function buildCaptchaSvg(code) {
  const lines = Array.from({ length: 6 }, (_, index) => {
    const bytes = randomBytes(4);
    const y1 = 12 + (bytes[0] % 45);
    const y2 = 12 + (bytes[1] % 45);
    const opacity = (0.12 + (bytes[2] % 10) / 100).toFixed(2);
    return `<path d="M ${index * 27 - 8} ${y1} L ${index * 27 + 50} ${y2}" stroke="#8f6a45" stroke-opacity="${opacity}" stroke-width="1.4"/>`;
  }).join('');
  const letters = [...code].map((letter, index) => {
    const bytes = randomBytes(2);
    const x = 22 + index * 27;
    const y = 42 + (bytes[0] % 9) - 4;
    const rotate = (bytes[1] % 15) - 7;
    return `<text x="${x}" y="${y}" transform="rotate(${rotate} ${x} ${y})">${letter}</text>`;
  }).join('');

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="168" height="64" viewBox="0 0 168 64">',
    '<rect width="168" height="64" rx="12" fill="#f5ecdf"/>',
    '<rect x="1" y="1" width="166" height="62" rx="11" fill="none" stroke="#dfccb0"/>',
    lines,
    '<g fill="#332219" font-family="Georgia, serif" font-size="28" font-weight="700" letter-spacing="2">',
    letters,
    '</g>',
    '</svg>',
  ].join('');
}

export function createCaptchaChallenge(purposeValue) {
  const purpose = normalizePurpose(purposeValue);
  if (!purpose) return null;

  cleanupConsumedChallenges();
  const code = createCode();
  const salt = randomBytes(12).toString('hex');
  const expiresAt = Date.now() + Number(env.captchaExpirationMs);
  const payload = Buffer.from(JSON.stringify({
    purpose,
    expiresAt,
    salt,
    expected: answerHash(code, salt),
    nonce: randomBytes(10).toString('hex'),
  })).toString('base64url');

  return {
    captchaToken: `${payload}.${tokenSignature(payload)}`,
    expiresAt: new Date(expiresAt).toISOString(),
    imageSvg: buildCaptchaSvg(code),
  };
}

export function verifyCaptchaChallenge({ captchaToken, captchaAnswer, purpose: purposeValue }) {
  const purpose = normalizePurpose(purposeValue);
  if (!purpose || !captchaToken || !normalizeAnswer(captchaAnswer)) {
    return { valid: false, message: 'Vui long nhap ma xac nhan.' };
  }

  cleanupConsumedChallenges();
  if (consumedChallenges.has(captchaToken)) {
    return { valid: false, message: 'Ma xac nhan da duoc su dung. Vui long tai ma moi.' };
  }

  try {
    const [payload, signature] = String(captchaToken).split('.');
    if (!payload || !signature || !matchesSignature(signature, tokenSignature(payload))) {
      return { valid: false, message: 'Ma xac nhan khong hop le.' };
    }

    const challenge = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (challenge.purpose !== purpose || Number(challenge.expiresAt) <= Date.now()) {
      return { valid: false, message: 'Ma xac nhan da het han. Vui long tai ma moi.' };
    }

    consumedChallenges.set(captchaToken, Number(challenge.expiresAt));
    if (challenge.expected !== answerHash(captchaAnswer, challenge.salt)) {
      return { valid: false, message: 'Ma xac nhan khong dung. Vui long thu ma moi.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, message: 'Ma xac nhan khong hop le.' };
  }
}
