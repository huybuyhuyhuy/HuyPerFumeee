import { signToken } from '../jwt.js';
import {
  createUser,
  findUserByEmail,
  findUserByEmailOrPhone,
  findUserById,
  findUserByPhone,
  updateUserPasswordByEmail,
  updateUserProfile,
} from '../models/userModel.js';
import { hashPasswordBcrypt, verifyPassword } from '../password.js';

export async function registerUser(payload) {
  const { name, email, phone, password, address } = payload;

  if (await findUserByEmail(email)) {
    return { code: 400, message: 'Email đã được sử dụng' };
  }
  if (await findUserByPhone(phone)) {
    return { code: 400, message: 'Số điện thoại đã được sử dụng' };
  }

  const hashedPassword = await hashPasswordBcrypt(password);
  const inserted = await createUser({
    name,
    email,
    phone,
    password: hashedPassword,
    address,
  });

  const user = await findUserById(inserted.id);
  const token = signToken(user.id, user.email, user.role);

  return { user, token };
}

export async function loginUser(identifier, password) {
  const user = await findUserByEmailOrPhone(identifier);
  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return null;
  }

  const token = signToken(user.id, user.email, user.role);
  const safeUser = await findUserById(user.id);
  return { user: safeUser, token };
}

export async function getCurrentUser(userId) {
  return findUserById(userId);
}

export async function updateProfile(userId, payload) {
  const current = await findUserById(userId);
  if (!current) {
    return null;
  }

  const next = {
    name: payload.name ?? current.name,
    phone: payload.phone ?? current.phone,
    address: payload.address ?? current.address,
    dob: payload.dob ?? current.dob,
  };

  await updateUserProfile(userId, next);
  return findUserById(userId);
}

export async function forgotPassword({ email, newPassword }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPasswordBcrypt(newPassword);
  await updateUserPasswordByEmail(email, hashedPassword);
  return true;
}
