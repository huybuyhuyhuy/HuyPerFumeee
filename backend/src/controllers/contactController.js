import { createContactMessage } from '../models/contactModel.js';
import { errorResponse, successResponse } from '../utils/response.js';

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidPhone(value) {
  return /^[0-9+\-\s().]{8,20}$/.test(value);
}

export async function createContact(req, res, next) {
  try {
    const payload = {
      name: cleanText(req.body?.name, 120),
      phone: cleanText(req.body?.phone, 30),
      email: cleanText(req.body?.email, 160),
      need: cleanText(req.body?.need, 120),
      message: cleanText(req.body?.message, 1000),
    };

    if (!payload.name) {
      return errorResponse(res, 400, 'Vui lòng nhập họ tên.');
    }

    if (!payload.phone || !isValidPhone(payload.phone)) {
      return errorResponse(res, 400, 'Số điện thoại không hợp lệ.');
    }

    const contact = await createContactMessage(payload);
    return successResponse(res, 'Đã nhận yêu cầu tư vấn. HuyPerfume sẽ liên hệ sớm.', {
      contact,
    }, 201);
  } catch (error) {
    return next(error);
  }
}
