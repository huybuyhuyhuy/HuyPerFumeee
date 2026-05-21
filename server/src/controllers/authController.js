import { authMiddleware } from '../middlewares/authMiddleware.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { isStrongPassword, isValidEmail, isValidPhone, trimText } from '../utils/validators.js';
import { forgotPassword as resetPassword, getCurrentUser, loginUser, registerUser, updateProfile } from '../services/authService.js';

function validateRegister(body) {
  const errors = {};
  const name = trimText(body.name);
  const email = trimText(body.email);
  const phone = trimText(body.phone);
  const password = body.password || '';
  const repassword = body.repassword || '';
  const address = trimText(body.address);

  if (!name) errors.name = 'Vui lòng nhập họ tên';
  if (!email || !isValidEmail(email)) errors.email = 'Email không hợp lệ';
  if (!phone || !isValidPhone(phone)) errors.phone = 'Số điện thoại phải có 10 chữ số';
  if (!isStrongPassword(password)) errors.password = 'Mật khẩu tối thiểu 6 ký tự';
  if (password !== repassword) errors.repassword = 'Mật khẩu nhập lại không khớp';

  return { errors, data: { name, email, phone, password, address } };
}

function validateLogin(body) {
  const identifier = trimText(body.emailPhone);
  const password = body.password || '';
  const errors = {};
  if (!identifier) errors.emailPhone = 'Email hoặc số điện thoại không được để trống';
  if (!password) errors.password = 'Mật khẩu không được để trống';
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
    errors.phone = 'Số điện thoại phải có 10 chữ số';
  }

  return { errors, data };
}

export async function register(req, res) {
  const { errors, data } = validateRegister(req.body || {});
  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Dữ liệu không hợp lệ', errors);
  }

  const result = await registerUser(data);
  if (result.code === 400) {
    return errorResponse(res, 400, result.message);
  }

  return successResponse(res, 'Đăng ký thành công', {
    token: result.token,
    user: result.user,
  });
}

export async function login(req, res) {
  const { errors, data } = validateLogin(req.body || {});
  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Dữ liệu không hợp lệ', errors);
  }

  const result = await loginUser(data.identifier, data.password);
  if (!result) {
    return errorResponse(res, 400, 'Email/số điện thoại hoặc mật khẩu không đúng');
  }

  return successResponse(res, 'Đăng nhập thành công', {
    token: result.token,
    user: result.user,
  });
}

export async function logout(_req, res) {
  return successResponse(res, 'Đăng xuất thành công', {});
}

export async function me(req, res) {
  const user = await getCurrentUser(req.user.id);
  if (!user) {
    return errorResponse(res, 404, 'Không tìm thấy người dùng');
  }
  return successResponse(res, 'Lấy thông tin tài khoản thành công', { user });
}

export async function profile(req, res) {
  const { errors, data } = validateProfile(req.body || {});
  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Dữ liệu không hợp lệ', errors);
  }

  const user = await updateProfile(req.user.id, data);
  if (!user) {
    return errorResponse(res, 404, 'Không tìm thấy người dùng');
  }

  return successResponse(res, 'Cập nhật hồ sơ thành công', { user });
}

export async function forgotPassword(req, res) {
  const email = trimText(req.body?.email);
  const newPassword = req.body?.newPassword || '';
  const repassword = req.body?.repassword || '';

  const errors = {};
  if (!email || !isValidEmail(email)) errors.email = 'Email không hợp lệ';
  if (!isStrongPassword(newPassword)) errors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự';
  if (newPassword !== repassword) errors.repassword = 'Mật khẩu nhập lại không khớp';

  if (Object.keys(errors).length) {
    return errorResponse(res, 400, 'Dữ liệu không hợp lệ', errors);
  }

  const ok = await resetPassword({ email, newPassword });
  if (!ok) {
    return errorResponse(res, 404, 'Email chưa được đăng ký');
  }

  return successResponse(res, 'Đặt lại mật khẩu thành công', {});
}

export { authMiddleware };
