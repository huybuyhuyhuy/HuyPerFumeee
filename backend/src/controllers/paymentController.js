import crypto from 'crypto';
import { errorResponse, successResponse } from '../utils/response.js';
import { query } from '../config/database.js';
import { getCheckoutStorageCapabilities, hasColumn as hasCheckoutColumn } from '../modules/checkout/checkout.storage.js';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus.js';
import { updateOrderStatusWithHistory } from '../models/orderModel.js';

function envValue(name, fallback = '') {
  return String(process.env[name] || fallback).trim();
}

function apiBaseUrl(req) {
  return envValue('APP_BASE_URL', `${req.protocol}://${req.get('host')}`);
}

function frontendBaseUrl(req) {
  return envValue('FRONTEND_BASE_URL', req.get('origin') || 'http://localhost:5177');
}

function hmacSha256Hex(data, secret) {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
}

function signaturesMatch(received, computed) {
  const receivedBuffer = Buffer.from(String(received || ''), 'hex');
  const computedBuffer = Buffer.from(String(computed || ''), 'hex');
  return receivedBuffer.length === computedBuffer.length && crypto.timingSafeEqual(receivedBuffer, computedBuffer);
}

function validateOrderId(value) {
  const orderId = Number(value);
  return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
}

function parseOrderIdFromGatewayId(value) {
  const match = String(value || '').match(/^(\d+)/);
  return match ? validateOrderId(match[1]) : null;
}

function isConfigured(value) {
  return Boolean(value && !/^YOUR_/i.test(value));
}

function requireMomoConfig() {
  const config = {
    partnerCode: envValue('MOMO_PARTNER_CODE'),
    accessKey: envValue('MOMO_ACCESS_KEY'),
    secretKey: envValue('MOMO_SECRET_KEY'),
    partnerName: envValue('MOMO_PARTNER_NAME'),
    storeId: envValue('MOMO_STORE_ID'),
    payUrl: envValue('MOMO_PAY_URL'),
    redirectUrl: envValue('MOMO_REDIRECT_URL'),
    ipnUrl: envValue('MOMO_IPN_URL'),
  };

  const missing = Object.entries(config).filter(([, value]) => !isConfigured(value)).map(([key]) => key);
  if (missing.length) {
    return { code: 500, message: `Thiếu cấu hình MoMo trong .env: ${missing.join(', ')}` };
  }
  return config;
}

function requireZaloPayConfig() {
  const config = {
    appId: envValue('ZALOPAY_APP_ID'),
    key1: envValue('ZALOPAY_KEY1'),
    key2: envValue('ZALOPAY_KEY2'),
    createUrl: envValue('ZALOPAY_CREATE_URL'),
    redirectUrl: envValue('APP_BASE_URL') ? `${envValue('APP_BASE_URL')}/api/payment/zalopay/return` : '',
  };
  const missing = ['appId', 'key1', 'key2', 'createUrl'].filter((key) => !isConfigured(config[key]));
  if (missing.length) {
    return { code: 500, message: `Thiếu cấu hình ZaloPay trong .env: ${missing.join(', ')}` };
  }
  return config;
}

function paymentRedirectResponse(req, payment, status, orderId = null, extra = {}) {
  const url = new URL('/orders', frontendBaseUrl(req));
  url.searchParams.set('payment', payment);
  url.searchParams.set('status', status);
  if (orderId) url.searchParams.set('orderId', String(orderId));
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function redirectToFrontend(res, url) {
  return res.redirect(url);
}

async function getOrderForPayment(orderId, userId = null) {
  const { orderColumns } = await getCheckoutStorageCapabilities();
  const momoOrderSelect = hasCheckoutColumn(orderColumns, 'momo_order_id') ? 'momo_order_id' : 'NULL AS momo_order_id';
  const momoTransSelect = hasCheckoutColumn(orderColumns, 'momo_trans_id') ? 'momo_trans_id' : 'NULL AS momo_trans_id';
  const zaloPaySelect = hasCheckoutColumn(orderColumns, 'zalopay_app_trans_id') ? 'zalopay_app_trans_id' : 'NULL AS zalopay_app_trans_id';
  const rows = await query(
    `SELECT TOP 1 id, user_id, total, status, payment_method, ${momoOrderSelect}, ${momoTransSelect}, ${zaloPaySelect}
     FROM orders
     WHERE id = ?${userId ? ' AND user_id = ?' : ''}`,
    userId ? [orderId, userId] : [orderId]
  );
  return rows[0] || null;
}

async function getOrderByMomoOrderId(momoOrderId) {
  const { orderColumns } = await getCheckoutStorageCapabilities();
  if (hasCheckoutColumn(orderColumns, 'momo_order_id')) {
    const rows = await query(
      `SELECT TOP 1 id, user_id, total, status, payment_method, momo_order_id,
              ${hasCheckoutColumn(orderColumns, 'momo_trans_id') ? 'momo_trans_id' : 'NULL AS momo_trans_id'},
              ${hasCheckoutColumn(orderColumns, 'zalopay_app_trans_id') ? 'zalopay_app_trans_id' : 'NULL AS zalopay_app_trans_id'}
       FROM orders
       WHERE momo_order_id = ?`,
      [momoOrderId]
    );
    if (rows[0]) return rows[0];
  }

  const orderId = parseOrderIdFromGatewayId(momoOrderId);
  return orderId ? getOrderForPayment(orderId) : null;
}

async function updatePaidOrder({ orderId, userId = null, expectedPaymentMethod = null, momoOrderId = null, momoTransId = null, zalopayAppTransId = null }) {
  const order = await getOrderForPayment(orderId, userId);
  if (!order) return { code: 404, message: 'Khong tim thay don hang' };
  if (expectedPaymentMethod && String(order.payment_method || '').toUpperCase() !== expectedPaymentMethod) {
    return { code: 400, message: 'Phuong thuc thanh toan cua don hang khong khop' };
  }
  const currentStatus = normalizeOrderStatus(order.status);
  if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(currentStatus)) {
    return { code: 400, message: 'Don hang da bi huy hoac hoan tien' };
  }

  const { orderColumns } = await getCheckoutStorageCapabilities();
  const assignments = [];
  const params = [];

  if (hasCheckoutColumn(orderColumns, 'momo_order_id')) { assignments.push('momo_order_id = COALESCE(?, momo_order_id)'); params.push(momoOrderId); }
  if (hasCheckoutColumn(orderColumns, 'momo_trans_id')) { assignments.push('momo_trans_id = COALESCE(?, momo_trans_id)'); params.push(momoTransId); }
  if (hasCheckoutColumn(orderColumns, 'zalopay_app_trans_id')) { assignments.push('zalopay_app_trans_id = COALESCE(?, zalopay_app_trans_id)'); params.push(zalopayAppTransId); }

  if (assignments.length) {
    params.push(orderId);
    await query(`UPDATE orders SET ${assignments.join(', ')} WHERE id = ?`, params);
  }
  if (currentStatus === ORDER_STATUS.PENDING) {
    return updateOrderStatusWithHistory({
      orderId,
      newStatus: ORDER_STATUS.CONFIRMED,
      note: `${String(order.payment_method || 'ONLINE').toUpperCase()} thanh toán thành công`,
    });
  }
  return { ok: true, status: currentStatus };
}

async function rememberGatewayReference({ orderId, momoOrderId = null, zalopayAppTransId = null }) {
  const { orderColumns } = await getCheckoutStorageCapabilities();
  const assignments = [];
  const params = [];
  if (momoOrderId && hasCheckoutColumn(orderColumns, 'momo_order_id')) { assignments.push('momo_order_id = ?'); params.push(momoOrderId); }
  if (zalopayAppTransId && hasCheckoutColumn(orderColumns, 'zalopay_app_trans_id')) { assignments.push('zalopay_app_trans_id = ?'); params.push(zalopayAppTransId); }
  if (!assignments.length) return;
  params.push(orderId);
  await query(`UPDATE orders SET ${assignments.join(', ')} WHERE id = ?`, params);
}

function momoReturnStatus(resultCode) {
  if (Number(resultCode) === 0) return 'success';
  if ([7000, 7002, 7004, 7009].includes(Number(resultCode))) return 'cancel';
  return 'failed';
}

function momoResultSignaturePayload(data, accessKey) {
  return [
    `accessKey=${accessKey}`,
    `amount=${data.amount || ''}`,
    `extraData=${data.extraData || ''}`,
    `message=${data.message || ''}`,
    `orderId=${data.orderId || ''}`,
    `orderInfo=${data.orderInfo || ''}`,
    `orderType=${data.orderType || ''}`,
    `partnerCode=${data.partnerCode || ''}`,
    `payType=${data.payType || ''}`,
    `requestId=${data.requestId || ''}`,
    `responseTime=${data.responseTime || ''}`,
    `resultCode=${data.resultCode || ''}`,
    `transId=${data.transId || ''}`,
  ].join('&');
}

function expectedMomoAmount(order) {
  return Math.max(Math.round(Number(order.total || 0)), 10000);
}

function validateMomoResultPayload(data, credentials, order) {
  if (String(data.partnerCode || '') !== credentials.partnerCode) {
    return { ok: false, message: 'MoMo partnerCode khong hop le' };
  }

  const receivedSignature = String(data.signature || '');
  const computedSignature = hmacSha256Hex(momoResultSignaturePayload(data, credentials.accessKey), credentials.secretKey);
  if (!receivedSignature || !signaturesMatch(receivedSignature, computedSignature)) {
    return { ok: false, message: 'Chu ky MoMo khong hop le' };
  }

  if (order.momo_order_id && String(data.orderId || '') !== String(order.momo_order_id)) {
    return { ok: false, message: 'MoMo orderId khong khop don hang' };
  }

  if (Number(data.amount || 0) !== expectedMomoAmount(order)) {
    return { ok: false, message: 'So tien MoMo khong khop don hang' };
  }

  if (Number(data.resultCode || -1) === 0 && !String(data.transId || '').trim()) {
    return { ok: false, message: 'MoMo transId khong hop le' };
  }

  return { ok: true };
}

export async function createMomo(req, res) {
  try {
    const orderId = validateOrderId(req.body?.orderId);
    if (!orderId) return errorResponse(res, 400, 'orderId khong hop le');

    const order = await getOrderForPayment(orderId, req.user?.id || null);
    if (!order) return errorResponse(res, 404, 'Khong tim thay don hang');

    const credentials = requireMomoConfig();
    if (credentials.code) return errorResponse(res, credentials.code, credentials.message);

    const requestId = `momo_${Date.now()}_${orderId}`;
    const momoOrderId = `${orderId}_${Date.now()}`;
    const orderInfo = `Thanh toan don hang #${orderId}`;
    const amountNumber = Math.max(Math.round(Number(order.total || 0)), 10000);
    const amount = String(amountNumber);

    const rawSignature = [
      `accessKey=${credentials.accessKey}`,
      `amount=${amount}`,
      `extraData=`,
      `ipnUrl=${credentials.ipnUrl}`,
      `orderId=${momoOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${credentials.partnerCode}`,
      `redirectUrl=${credentials.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=payWithMethod`,
    ].join('&');

    const payload = {
      partnerCode: credentials.partnerCode,
      partnerName: credentials.partnerName,
      storeId: credentials.storeId,
      requestId,
      amount: amountNumber,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl: credentials.redirectUrl,
      ipnUrl: credentials.ipnUrl,
      lang: 'vi',
      requestType: 'payWithMethod',
      autoCapture: true,
      extraData: '',
      orderGroupId: '',
      signature: hmacSha256Hex(rawSignature, credentials.secretKey),
    };

    await rememberGatewayReference({ orderId, momoOrderId });
    const momoResponse = await fetch(credentials.payUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const momoBody = await momoResponse.json().catch(() => ({}));
    const payUrl = momoBody.payUrl || momoBody.deeplink || '';
    if (!momoResponse.ok || !payUrl) return errorResponse(res, 502, 'MoMo khong tra ve link thanh toan', momoBody);

    return successResponse(res, 'Tao thanh toan MoMo thanh cong', { orderId, momoOrderId, payUrl, paymentUrl: payUrl, momoResponse: momoBody });
  } catch (error) {
    console.error('[MOMO_CREATE_ERROR]', error);
    return errorResponse(res, 500, 'Loi tao thanh toan MoMo', { detail: error.message });
  }
}

export async function momoIpn(req, res) {
  try {
    const body = req.body || {};
    const credentials = requireMomoConfig();
    if (credentials.code) return errorResponse(res, credentials.code, credentials.message);
    const receivedSignature = String(body.signature || '');
    const raw = [
      `accessKey=${credentials.accessKey}`,
      `amount=${body.amount || ''}`,
      `extraData=${body.extraData || ''}`,
      `message=${body.message || ''}`,
      `orderId=${body.orderId || ''}`,
      `orderInfo=${body.orderInfo || ''}`,
      `orderType=${body.orderType || ''}`,
      `partnerCode=${body.partnerCode || ''}`,
      `payType=${body.payType || ''}`,
      `requestId=${body.requestId || ''}`,
      `responseTime=${body.responseTime || ''}`,
      `resultCode=${body.resultCode || ''}`,
      `transId=${body.transId || ''}`,
    ].join('&');
    const computed = hmacSha256Hex(raw, credentials.secretKey);
    if (!receivedSignature || receivedSignature !== computed) return errorResponse(res, 400, 'Chữ ký MoMo không hợp lệ');

    const order = await getOrderByMomoOrderId(String(body.orderId || ''));
    if (!order) return errorResponse(res, 400, 'orderId khong hop le');

    const validation = validateMomoResultPayload(body, credentials, order);
    if (!validation.ok) return errorResponse(res, 400, validation.message);

    if (Number(body.resultCode || -1) === 0) {
      const result = await updatePaidOrder({
        orderId: order.id,
        expectedPaymentMethod: 'MOMO',
        momoOrderId: String(body.orderId || ''),
        momoTransId: String(body.transId || ''),
      });
      if (result.code) return errorResponse(res, result.code, result.message);
    }
    return res.status(204).send();
  } catch (error) {
    console.error('[MOMO_IPN_ERROR]', error);
    return errorResponse(res, 400, 'Dữ liệu IPN không đúng định dạng');
  }
}

export async function momoReturn(req, res) {
  try {
    const resultCode = Number(req.query.resultCode || -1);
    const momoOrderId = String(req.query.orderId || '');
    const order = await getOrderByMomoOrderId(momoOrderId);
    if (!order) return redirectToFrontend(res, paymentRedirectResponse(req, 'momo', 'failed'));

    let status = momoReturnStatus(resultCode);
    if (status === 'success') {
      const refreshedOrder = await getOrderForPayment(order.id);
      status = normalizeOrderStatus(refreshedOrder?.status) === ORDER_STATUS.CONFIRMED ? 'success' : 'pending';
    }
    return redirectToFrontend(res, paymentRedirectResponse(req, 'momo', status, order.id, { resultCode }));
  } catch (error) {
    console.error('[MOMO_RETURN_ERROR]', error);
    return redirectToFrontend(res, paymentRedirectResponse(req, 'momo', 'error'));
  }
}

export async function createZaloPay(req, res) {
  try {
    const orderId = validateOrderId(req.body?.orderId);
    if (!orderId) return errorResponse(res, 400, 'orderId khong hop le');

    const order = await getOrderForPayment(orderId, req.user?.id || null);
    if (!order) return errorResponse(res, 404, 'Khong tim thay don hang');

    const config = requireZaloPayConfig();
    if (config.code) return errorResponse(res, config.code, config.message);

    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const appTransId = `${yymmdd}_${orderId}_${Date.now()}`;
    const appUser = String(req.user?.email || `user_${req.user?.id || 'guest'}`);
    const appTime = Date.now();
    const amount = Math.round(Number(order.total || 0));
    const embedData = JSON.stringify({ redirecturl: config.redirectUrl });
    const item = '[]';
    const description = `Thanh toan don hang #${orderId}`;
    const macData = [config.appId, appTransId, appUser, amount, appTime, embedData, item].join('|');

    const form = new URLSearchParams({
      app_id: String(config.appId),
      app_user: appUser,
      app_time: String(appTime),
      amount: String(amount),
      app_trans_id: appTransId,
      embed_data: embedData,
      item,
      description,
      bank_code: '',
      mac: hmacSha256Hex(macData, config.key1),
    });

    await rememberGatewayReference({ orderId, zalopayAppTransId: appTransId });
    const response = await fetch(config.createUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    const zaloPayResponse = await response.json().catch(() => ({}));
    if (!response.ok || Number(zaloPayResponse.return_code || 0) !== 1 || !zaloPayResponse.order_url) {
      return errorResponse(res, 502, 'ZaloPay khong tra ve link thanh toan', zaloPayResponse);
    }

    return successResponse(res, 'Tao thanh toan ZaloPay thanh cong', { orderId, appTransId, orderUrl: zaloPayResponse.order_url, paymentUrl: zaloPayResponse.order_url, zaloPayResponse });
  } catch (error) {
    console.error('[ZALOPAY_CREATE_ERROR]', error);
    return errorResponse(res, 500, 'Loi tao thanh toan ZaloPay', { detail: error.message });
  }
}

export async function zaloPayReturn(req, res) {
  try {
    const appTransId = String(req.query.apptransid || req.query.app_trans_id || '');
    const orderId = Number(appTransId.split('_')[1]);
    if (!orderId) return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'failed'));

    const resultCode = Number(req.query.resultcode || req.query.resultCode || 0);
    if (resultCode === 1 || resultCode === 0) {
      await updatePaidOrder({ orderId, zalopayAppTransId: appTransId });
      return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'success', orderId));
    }

    const status = [2, 4, 6, 7, 8, 9].includes(resultCode) ? 'cancel' : 'failed';
    return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', status, orderId, { resultCode }));
  } catch (error) {
    console.error('[ZALOPAY_RETURN_ERROR]', error);
    return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'error'));
  }
}
