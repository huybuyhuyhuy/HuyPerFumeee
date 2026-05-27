import { env } from '../config/env.js';
import { signAccessToken } from '../jwt.js';
import {
  createUser,
  findFullUserByEmail,
  findUserByEmail,
  findUserByEmailOrPhone,
  findUserById,
  findUserByPhone,
  incrementFailedLogin,
  lockUserUntil,
  markEmailVerified,
  toSafeUser,
  updateSuccessfulLogin,
  updateUserPasswordById,
  updateUserProfile,
} from '../models/userModel.js';
import { hashPasswordBcrypt, isBCryptHash, verifyPassword } from '../password.js';
import { countFailedLoginAttempts, recordLoginAttempt } from '../modules/auth/login-attempt.repository.js';
import {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  createRefreshToken,
  findRefreshToken,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../modules/auth/token.repository.js';
import { getPermissionsForRole, normalizeRole } from '../modules/auth/rbac.js';

function tokenPayloadForUser(user) {
  const safe = toSafeUser(user);
  return {
    ...safe,
    role: normalizeRole(safe.role),
  };
}

async function issueAuthTokens(user, context = {}) {
  const safeUser = tokenPayloadForUser(user);
  const permissions = getPermissionsForRole(safeUser.role);
  const accessToken = signAccessToken(safeUser, permissions);
  const refresh = await createRefreshToken(safeUser, {
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
  });

  return {
    user: safeUser,
    token: accessToken,
    accessToken,
    refreshToken: refresh.token,
    tokenType: 'Bearer',
    expiresIn: Math.floor(Number(env.jwtExpirationMs || 86400000) / 1000),
    refreshExpiresAt: refresh.expiresAt,
    permissions,
  };
}

function isLocked(user) {
  if (!user?.locked_until) return false;
  return new Date(user.locked_until).getTime() > Date.now();
}

function isDisabled(user) {
  return ['DISABLED', 'LOCKED'].includes(String(user?.status || '').toUpperCase());
}

function maybeExposeToken(tokenField, token) {
  return env.authExposeDevTokens ? { [tokenField]: token } : {};
}

export async function registerUser(payload, context = {}) {
  const { name, email, phone, password, address } = payload;

  if (await findUserByEmail(email)) {
    return { code: 400, message: 'Email da duoc su dung' };
  }
  if (await findUserByPhone(phone)) {
    return { code: 400, message: 'So dien thoai da duoc su dung' };
  }

  const hashedPassword = await hashPasswordBcrypt(password);
  const inserted = await createUser({
    name,
    email,
    phone,
    password: hashedPassword,
    address,
    role: 'USER',
  });

  const user = await findUserById(inserted.id);
  const session = await issueAuthTokens(user, context);
  const verification = await createEmailVerificationToken(user.id);

  return {
    ...session,
    emailVerification: {
      required: true,
      delivery: 'email',
      expiresAt: verification.expiresAt,
      ...maybeExposeToken('token', verification.token),
    },
  };
}

export async function loginUser(identifier, password, context = {}) {
  const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
  const user = await findUserByEmailOrPhone(identifier);

  if (!user) {
    await recordLoginAttempt({
      identifier: normalizedIdentifier,
      success: false,
      failureReason: 'USER_NOT_FOUND',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return null;
  }

  if (isDisabled(user) || isLocked(user)) {
    await recordLoginAttempt({
      identifier: normalizedIdentifier,
      userId: user.id,
      success: false,
      failureReason: 'ACCOUNT_LOCKED',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return { code: 423, message: 'Tai khoan dang bi khoa tam thoi' };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    await recordLoginAttempt({
      identifier: normalizedIdentifier,
      userId: user.id,
      success: false,
      failureReason: 'BAD_PASSWORD',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    await incrementFailedLogin(user.id);

    const failures = await countFailedLoginAttempts(normalizedIdentifier, env.loginFailureWindowMs);
    if (failures >= Number(env.loginFailureLimit || 5)) {
      await lockUserUntil(user.id, new Date(Date.now() + Number(env.loginLockMs || 900000)).toISOString());
    }
    return null;
  }

  if (!isBCryptHash(user.password)) {
    await updateUserPasswordById(user.id, await hashPasswordBcrypt(password));
  }

  await recordLoginAttempt({
    identifier: normalizedIdentifier,
    userId: user.id,
    success: true,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
  await updateSuccessfulLogin(user.id);

  const safeUser = await findUserById(user.id);
  return issueAuthTokens(safeUser, context);
}

export async function isLoginCaptchaRequired(identifier) {
  const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
  if (!normalizedIdentifier) return false;
  const failures = await countFailedLoginAttempts(normalizedIdentifier, env.loginFailureWindowMs);
  return failures >= Number(env.captchaLoginFailureThreshold || 3);
}

export async function refreshAuthSession(refreshToken, context = {}) {
  if (!refreshToken) return { code: 400, message: 'Thieu refreshToken' };

  const existing = await findRefreshToken(refreshToken);
  if (!existing) return { code: 401, message: 'Refresh token khong hop le' };

  const user = await findUserById(existing.user_id);
  if (!user || isDisabled(user)) return { code: 401, message: 'Tai khoan khong hop le' };

  const rotated = await rotateRefreshToken(refreshToken, user, context);
  if (rotated.code) return rotated;

  const safeUser = tokenPayloadForUser(user);
  const permissions = getPermissionsForRole(safeUser.role);
  const accessToken = signAccessToken(safeUser, permissions);
  return {
    user: safeUser,
    token: accessToken,
    accessToken,
    refreshToken: rotated.token,
    tokenType: 'Bearer',
    expiresIn: Math.floor(Number(env.jwtExpirationMs || 86400000) / 1000),
    refreshExpiresAt: rotated.expiresAt,
    permissions,
  };
}

export async function logoutUser({ refreshToken, userId, allDevices = false }) {
  if (allDevices && userId) {
    await revokeAllUserRefreshTokens(userId);
    return true;
  }
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return true;
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  return toSafeUser(user);
}

export async function updateProfile(userId, payload) {
  const current = await findUserById(userId);
  if (!current) return null;

  const next = {
    name: payload.name ?? current.name,
    phone: payload.phone ?? current.phone,
    address: payload.address ?? current.address,
    dob: payload.dob ?? current.dob,
  };

  if (next.phone !== current.phone) {
    const existing = await findUserByPhone(next.phone);
    if (existing && Number(existing.id) !== Number(userId)) {
      return { code: 400, message: 'So dien thoai da duoc su dung' };
    }
  }

  await updateUserProfile(userId, next);
  return toSafeUser(await findUserById(userId));
}

export async function forgotPassword({ email }) {
  const user = await findFullUserByEmail(email);
  if (!user) return null;

  const reset = await createPasswordResetToken(user.id);
  return {
    email,
    delivery: 'email',
    expiresAt: reset.expiresAt,
    ...maybeExposeToken('resetToken', reset.token),
  };
}

export async function resetPassword({ token, newPassword }) {
  const consumed = await consumePasswordResetToken(token);
  if (!consumed) return null;

  const hashedPassword = await hashPasswordBcrypt(newPassword);
  await updateUserPasswordById(consumed.userId, hashedPassword);
  await revokeAllUserRefreshTokens(consumed.userId);
  return true;
}

export async function requestEmailVerification(email) {
  const user = await findFullUserByEmail(email);
  if (!user) return null;
  const verification = await createEmailVerificationToken(user.id);
  return {
    email,
    delivery: 'email',
    expiresAt: verification.expiresAt,
    ...maybeExposeToken('verificationToken', verification.token),
  };
}

export async function verifyEmail(token) {
  const consumed = await consumeEmailVerificationToken(token);
  if (!consumed) return null;
  await markEmailVerified(consumed.userId);
  return toSafeUser(await findUserById(consumed.userId));
}

export async function socialLoginReady() {
  return {
    code: 501,
    message: 'Đăng nhập mạng xã hội chưa được cấu hình',
  };
}
