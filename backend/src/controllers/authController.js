import { authMiddleware } from '../middlewares/authMiddleware.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { isStrongPassword, isValidEmail, isValidPhone, trimText } from '../utils/validators.js';
import {
  forgotPassword as requestPasswordReset,
  getCurrentUser,
  isLoginCaptchaRequired,
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser,
  requestEmailVerification,
  resetPassword,
  socialLoginReady,
  updateProfile,
  verifyEmail,
} from '../services/authService.js';
import { createCaptchaChallenge, verifyCaptchaChallenge } from '../modules/auth/captcha.service.js';
import {
  createUserAddress,
  deleteUserAddress,
  getUserAddressById,
  listUserAddresses,
  setDefaultUserAddress,
  updateUserAddress,
} from '../modules/auth/address.repository.js';

function requestContext(req) {
  return {
    ipAddress: String(req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''),
    userAgent: String(req.headers['user-agent'] || ''),
  };
}

function validateRegister(body) {
  const errors = {};
  const name = trimText(body.name);
  const email = trimText(body.email).toLowerCase();
  const phone = trimText(body.phone);
  const password = body.password || '';
  const repassword = body.repassword || '';
  const address = trimText(body.address);

  if (!name) errors.name = 'Vui long nhap ho ten';
  if (!email || !isValidEmail(email)) errors.email = 'Email khong hop le';
  if (!phone || !isValidPhone(phone)) errors.phone = 'So dien thoai phai co 10 chu so';
  if (!isStrongPassword(password)) errors.password = 'Mat khau toi thieu 6 ky tu';
  if (password !== repassword) errors.repassword = 'Mat khau nhap lai khong khop';

  return { errors, data: { name, email, phone, password, address } };
}

function validateLogin(body) {
  const identifier = trimText(body.emailPhone || body.identifier);
  const password = body.password || '';
  const errors = {};
  if (!identifier) errors.emailPhone = 'Email hoac so dien thoai khong duoc de trong';
  if (!password) errors.password = 'Mat khau khong duoc de trong';
  return { errors, data: { identifier, password } };
}

function validateProfile(body) {
  const data = {
    name: body.name !== undefined ? trimText(body.name) : undefined,
    phone: body.phone !== undefined ? trimText(body.phone) : undefined,
    address: body.address !== undefined ? trimText(body.address) : undefined,
    dob: body.dob !== undefined ? body.dob : undefined,
  };
  const errors = {};

  if (data.phone !== undefined && data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'So dien thoai phai co 10 chu so';
  }

  return { errors, data };
}

function validateAddress(body) {
  const data = {
    label: trimText(body.label),
    recipientName: trimText(body.recipientName || body.recipient_name || body.name),
    phone: trimText(body.phone),
    line1: trimText(body.line1 || body.address),
    line2: trimText(body.line2),
    ward: trimText(body.ward),
    district: trimText(body.district),
    city: trimText(body.city),
    country: trimText(body.country) || 'VN',
    postalCode: trimText(body.postalCode || body.postal_code),
    isDefault: Boolean(body.isDefault ?? body.is_default),
  };
  const errors = {};
  if (!data.recipientName) errors.recipientName = 'Ten nguoi nhan khong duoc de trong';
  if (!data.phone || !isValidPhone(data.phone)) errors.phone = 'So dien thoai phai co 10 chu so';
  if (!data.line1) errors.line1 = 'Dia chi khong duoc de trong';
  return { errors, data };
}

export async function register(req, res) {
  const { errors, data } = validateRegister(req.body || {});
  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Du lieu khong hop le', errors);
  }

  const captchaResult = verifyCaptchaChallenge({
    captchaToken: req.body?.captchaToken,
    captchaAnswer: req.body?.captchaAnswer,
    purpose: 'register',
  });
  if (!captchaResult.valid) {
    return errorResponse(res, 400, captchaResult.message, {
      captchaRequired: true,
      captchaPurpose: 'register',
    });
  }

  const result = await registerUser(data, requestContext(req));
  if (result.code === 400) {
    return errorResponse(res, 400, result.message, {
      captchaRequired: true,
      captchaPurpose: 'register',
    });
  }

  return successResponse(res, 'Dang ky thanh cong', result);
}

export async function login(req, res) {
  const { errors, data } = validateLogin(req.body || {});
  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Du lieu khong hop le', errors);
  }

  const captchaRequired = await isLoginCaptchaRequired(data.identifier);
  if (captchaRequired) {
    const captchaResult = verifyCaptchaChallenge({
      captchaToken: req.body?.captchaToken,
      captchaAnswer: req.body?.captchaAnswer,
      purpose: 'login',
    });
    if (!captchaResult.valid) {
      return errorResponse(res, 400, captchaResult.message, {
        captchaRequired: true,
        captchaPurpose: 'login',
      });
    }
  }

  const result = await loginUser(data.identifier, data.password, requestContext(req));
  if (!result) {
    return errorResponse(res, 400, 'Email/so dien thoai hoac mat khau khong dung', {
      captchaRequired: await isLoginCaptchaRequired(data.identifier),
      captchaPurpose: 'login',
    });
  }
  if (result.code) {
    return errorResponse(res, result.code, result.message);
  }

  return successResponse(res, 'Dang nhap thanh cong', result);
}

export function captchaChallenge(req, res) {
  const purpose = trimText(req.query?.purpose).toLowerCase();
  const challenge = createCaptchaChallenge(purpose);
  if (!challenge) {
    return errorResponse(res, 400, 'Muc dich CAPTCHA khong hop le');
  }
  return successResponse(res, 'Tao ma xac nhan thanh cong', challenge);
}

export async function refresh(req, res) {
  const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
  const result = await refreshAuthSession(refreshToken, requestContext(req));
  if (result.code) return errorResponse(res, result.code, result.message);
  return successResponse(res, 'Lam moi token thanh cong', result);
}

export async function logout(req, res) {
  await logoutUser({
    refreshToken: req.body?.refreshToken || req.headers['x-refresh-token'],
    userId: req.user?.id,
    allDevices: Boolean(req.body?.allDevices),
  });
  return successResponse(res, 'Dang xuat thanh cong', {});
}

export async function me(req, res) {
  const user = await getCurrentUser(req.user.id);
  if (!user) {
    return errorResponse(res, 404, 'Khong tim thay nguoi dung');
  }
  return successResponse(res, 'Lay thong tin tai khoan thanh cong', { user });
}

export async function profile(req, res) {
  const { errors, data } = validateProfile(req.body || {});
  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Du lieu khong hop le', errors);
  }

  const user = await updateProfile(req.user.id, data);
  if (!user) return errorResponse(res, 404, 'Khong tim thay nguoi dung');
  if (user.code) return errorResponse(res, user.code, user.message);

  return successResponse(res, 'Cap nhat ho so thanh cong', { user });
}

export async function forgotPassword(req, res) {
  const email = trimText(req.body?.email).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return errorResponse(res, 400, 'Email khong hop le');
  }

  const result = await requestPasswordReset({ email });
  if (!result) {
    return successResponse(res, 'Neu email ton tai, huong dan dat lai mat khau se duoc gui', {});
  }

  return successResponse(res, 'Tao yeu cau dat lai mat khau thanh cong', result);
}

export async function resetPasswordController(req, res) {
  const token = trimText(req.body?.token);
  const newPassword = req.body?.newPassword || '';
  const repassword = req.body?.repassword || '';
  const errors = {};
  if (!token) errors.token = 'Token khong duoc de trong';
  if (!isStrongPassword(newPassword)) errors.newPassword = 'Mat khau moi toi thieu 6 ky tu';
  if (newPassword !== repassword) errors.repassword = 'Mat khau nhap lai khong khop';
  if (Object.keys(errors).length) return errorResponse(res, 400, 'Du lieu khong hop le', errors);

  const ok = await resetPassword({ token, newPassword });
  if (!ok) return errorResponse(res, 400, 'Token dat lai mat khau khong hop le hoac da het han');
  return successResponse(res, 'Dat lai mat khau thanh cong', {});
}

export async function requestVerification(req, res) {
  const email = trimText(req.body?.email).toLowerCase();
  if (!email || !isValidEmail(email)) return errorResponse(res, 400, 'Email khong hop le');
  const result = await requestEmailVerification(email);
  if (!result) return successResponse(res, 'Neu email ton tai, token xac thuc se duoc gui', {});
  return successResponse(res, 'Tao token xac thuc email thanh cong', result);
}

export async function verifyEmailController(req, res) {
  const token = trimText(req.body?.token || req.query?.token);
  if (!token) return errorResponse(res, 400, 'Token khong duoc de trong');
  const user = await verifyEmail(token);
  if (!user) return errorResponse(res, 400, 'Token xac thuc email khong hop le hoac da het han');
  return successResponse(res, 'Xac thuc email thanh cong', { user });
}

export async function socialLogin(req, res) {
  const result = await socialLoginReady(req.body || {});
  return errorResponse(res, result.code, result.message);
}

export async function addresses(req, res) {
  const list = await listUserAddresses(req.user.id);
  return successResponse(res, 'Lay danh sach dia chi thanh cong', list);
}

export async function createAddress(req, res) {
  const { errors, data } = validateAddress(req.body || {});
  if (Object.keys(errors).length) return errorResponse(res, 400, 'Du lieu khong hop le', errors);
  const address = await createUserAddress(req.user.id, data);
  if (!address) return errorResponse(res, 501, 'Address storage chua duoc migrate');
  return successResponse(res, 'Tao dia chi thanh cong', address, 201);
}

export async function updateAddress(req, res) {
  const addressId = Number(req.params.id);
  if (!addressId) return errorResponse(res, 400, 'ID dia chi khong hop le');
  const { errors, data } = validateAddress(req.body || {});
  if (Object.keys(errors).length) return errorResponse(res, 400, 'Du lieu khong hop le', errors);
  const address = await updateUserAddress(req.user.id, addressId, data);
  if (!address) return errorResponse(res, 404, 'Khong tim thay dia chi');
  return successResponse(res, 'Cap nhat dia chi thanh cong', address);
}

export async function deleteAddress(req, res) {
  const addressId = Number(req.params.id);
  if (!addressId) return errorResponse(res, 400, 'ID dia chi khong hop le');
  const existing = await getUserAddressById(req.user.id, addressId);
  if (!existing) return errorResponse(res, 404, 'Khong tim thay dia chi');
  await deleteUserAddress(req.user.id, addressId);
  return successResponse(res, 'Xoa dia chi thanh cong', {});
}

export async function setDefaultAddress(req, res) {
  const addressId = Number(req.params.id);
  if (!addressId) return errorResponse(res, 400, 'ID dia chi khong hop le');
  const address = await setDefaultUserAddress(req.user.id, addressId);
  if (!address) return errorResponse(res, 404, 'Khong tim thay dia chi');
  return successResponse(res, 'Dat dia chi mac dinh thanh cong', address);
}

export { authMiddleware };
