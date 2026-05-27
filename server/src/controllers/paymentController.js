import crypto from 'crypto';
import { errorResponse, successResponse } from '../utils/response.js';
import { query } from '../config/database.js';
import { getCheckoutStorageCapabilities, hasColumn as hasCheckoutColumn } from '../modules/checkout/checkout.storage.js';

const MOMO_SANDBOX = {
  partnerCode: 'MOMO',
  accessKey: 'F8BBA842ECF85',
  secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerName: 'Huy',
  storeId: 'MomoTestStore',
  requestType: 'payWithMethod',
  endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
};

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

function momoCredentials() {
  return {
    partnerCode: envValue('MOMO_PARTNER_CODE', MOMO_SANDBOX.partnerCode),
    accessKey: envValue('MOMO_ACCESS_KEY', MOMO_SANDBOX.accessKey),
    secretKey: envValue('MOMO_SECRET_KEY', MOMO_SANDBOX.secretKey),
    partnerName: envValue('MOMO_PARTNER_NAME', MOMO_SANDBOX.partnerName),
    storeId: envValue('MOMO_STORE_ID', MOMO_SANDBOX.storeId),
    requestType: envValue('MOMO_REQUEST_TYPE', MOMO_SANDBOX.requestType),
    endpoint: envValue('MOMO_PAY_URL', MOMO_SANDBOX.endpoint),
  };
}

function buildMomoIpnSignature(body, credentials) {
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
  return hmacSha256Hex(raw, credentials.secretKey);
}

async function postJson(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return body;
}

async function postForm(endpoint, form) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return body;
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

async function updatePaidOrder({ orderId, userId = null, status, momoOrderId = null, momoTransId = null, zalopayAppTransId = null }) {
  const order = await getOrderForPayment(orderId, userId);
  if (!order) return { code: 404, message: 'Khong tim thay don hang' };
  if (/cancel/i.test(String(order.status || ''))) return { code: 400, message: 'Don hang da bi huy' };

  const { orderColumns } = await getCheckoutStorageCapabilities();
  const assignments = ['status = ?'];
  const params = [status];

  if (hasCheckoutColumn(orderColumns, 'momo_order_id')) {
    assignments.push('momo_order_id = COALESCE(?, momo_order_id)');
    params.push(momoOrderId);
  }
  if (hasCheckoutColumn(orderColumns, 'momo_trans_id')) {
    assignments.push('momo_trans_id = COALESCE(?, momo_trans_id)');
    params.push(momoTransId);
  }
  if (hasCheckoutColumn(orderColumns, 'zalopay_app_trans_id')) {
    assignments.push('zalopay_app_trans_id = COALESCE(?, zalopay_app_trans_id)');
    params.push(zalopayAppTransId);
  }

  params.push(orderId);
  await query(`UPDATE orders SET ${assignments.join(', ')} WHERE id = ?`, params);
  return { ok: true };
}

async function rememberGatewayReference({ orderId, momoOrderId = null, zalopayAppTransId = null }) {
  const { orderColumns } = await getCheckoutStorageCapabilities();
  const assignments = [];
  const params = [];

  if (momoOrderId && hasCheckoutColumn(orderColumns, 'momo_order_id')) {
    assignments.push('momo_order_id = ?');
    params.push(momoOrderId);
  }
  if (zalopayAppTransId && hasCheckoutColumn(orderColumns, 'zalopay_app_trans_id')) {
    assignments.push('zalopay_app_trans_id = ?');
    params.push(zalopayAppTransId);
  }
  if (!assignments.length) return;

  params.push(orderId);
  await query(`UPDATE orders SET ${assignments.join(', ')} WHERE id = ?`, params);
}

function redirectToOrders(req, res, params) {
  const url = new URL('/orders', frontendBaseUrl(req));
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return res.redirect(url.toString());
}

export async function createMomo(req, res) {
  try {
    const orderId = validateOrderId(req.body?.orderId);
    if (!orderId) return errorResponse(res, 400, 'orderId khong hop le');

    const order = await getOrderForPayment(orderId, req.user?.id || null);
    if (!order) return errorResponse(res, 404, 'Khong tim thay don hang');

    const credentials = momoCredentials();
    const redirectUrl = envValue('MOMO_REDIRECT_URL', `${apiBaseUrl(req)}/api/payment/momo/return`);
    const ipnUrl = envValue('MOMO_IPN_URL', `${apiBaseUrl(req)}/api/payment/momo/ipn`);
    const requestId = `momo_${Date.now()}_${orderId}`;
    const momoOrderId = `${orderId}_${Date.now()}`;
    const orderInfo = `Thanh toan don hang #${orderId}`;
    const amountNumber = Math.max(Math.round(Number(order.total || 0)), Number(envValue('MOMO_MIN_AMOUNT_VND', '10000')));
    const amount = String(amountNumber);

    const rawSignature = [
      `accessKey=${credentials.accessKey}`,
      `amount=${amount}`,
      `extraData=`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${momoOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${credentials.partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${credentials.requestType}`,
    ].join('&');

    const payload = {
      partnerCode: credentials.partnerCode,
      partnerName: credentials.partnerName,
      storeId: credentials.storeId,
      requestId,
      amount: amountNumber,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType: credentials.requestType,
      autoCapture: true,
      extraData: '',
      orderGroupId: '',
      signature: hmacSha256Hex(rawSignature, credentials.secretKey),
    };

    await rememberGatewayReference({ orderId, momoOrderId });
    const momoResponse = await postJson(credentials.endpoint, payload);
    const payUrl = momoResponse.payUrl || momoResponse.deeplink || '';

    if (!payUrl) {
      return errorResponse(res, 502, 'MoMo khong tra ve link thanh toan', momoResponse);
    }

    return successResponse(res, 'Tao thanh toan MoMo thanh cong', {
      orderId,
      momoOrderId,
      payUrl,
      paymentUrl: payUrl,
      momoResponse,
    });
  } catch (error) {
    console.error('[MOMO_CREATE_ERROR]', error);
    return errorResponse(res, 500, 'Loi tao thanh toan MoMo', { detail: error.message });
  }
}

export async function momoIpn(req, res) {
  try {
    const body = req.body || {};
    const credentials = momoCredentials();
    const receivedSignature = String(body.signature || '');
    const computed = buildMomoIpnSignature(body, credentials);

    if (!receivedSignature || receivedSignature !== computed) {
      console.error('[MOMO_IPN_INVALID_SIGNATURE]', { receivedSignature, computed, body });
      return errorResponse(res, 400, 'Chữ ký MoMo không hợp lệ');
    }

    const order = await getOrderByMomoOrderId(String(body.orderId || ''));
    const resultCode = Number(body.resultCode || -1);
    if (!order) return errorResponse(res, 400, 'orderId khong hop le');

    if (resultCode === 0) {
      await updatePaidOrder({
        orderId: order.id,
        status: 'Paid',
        momoOrderId: String(body.orderId || ''),
        momoTransId: String(body.transId || ''),
      });
      console.log('[MOMO_IPN_OK]', { orderId: order.id, body });
    } else {
      console.log('[MOMO_IPN_FAILED]', { orderId: order.id, resultCode, body });
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
    const transId = String(req.query.transId || '');
    const order = await getOrderByMomoOrderId(momoOrderId);

    if (!order) {
      return redirectToOrders(req, res, { payment: 'momo', status: 'invalid' });
    }

    if (resultCode === 0) {
      await updatePaidOrder({ orderId: order.id, status: 'Paid', momoOrderId, momoTransId: transId });
      return redirectToOrders(req, res, { payment: 'momo', status: 'success', orderId: order.id });
    }

    return redirectToOrders(req, res, { payment: 'momo', status: 'failed', orderId: order.id, resultCode });
  } catch (error) {
    console.error('[MOMO_RETURN_ERROR]', error);
    return redirectToOrders(req, res, { payment: 'momo', status: 'error' });
  }
}

export async function createZaloPay(req, res) {
  try {
    const orderId = validateOrderId(req.body?.orderId);
    if (!orderId) return errorResponse(res, 400, 'orderId khong hop le');

    const order = await getOrderForPayment(orderId, req.user?.id || null);
    if (!order) return errorResponse(res, 404, 'Khong tim thay don hang');

    const appId = envValue('ZALOPAY_APP_ID', '2553');
    const key1 = envValue('ZALOPAY_KEY1');
    const redirectUrl = envValue('ZALOPAY_REDIRECT_URL', `${apiBaseUrl(req)}/api/payment/zalopay/return`);
    const createUrl = envValue('ZALOPAY_CREATE_URL', 'https://sb-openapi.zalopay.vn/v2/create');

    if (!isConfigured(key1)) {
      return errorResponse(res, 500, 'Thieu cau hinh ZaloPay trong .env');
    }

    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const appTransId = `${yymmdd}_${orderId}_${Date.now()}`;
    const appUser = String(req.user?.email || `user_${req.user?.id || 'guest'}`);
    const appTime = Date.now();
    const amount = Math.round(Number(order.total || 0));
    const embedData = JSON.stringify({ redirecturl: redirectUrl });
    const item = '[]';
    const description = `Thanh toan don hang #${orderId}`;
    const macData = [appId, appTransId, appUser, amount, appTime, embedData, item].join('|');

    const form = new URLSearchParams({
      app_id: String(appId),
      app_user: appUser,
      app_time: String(appTime),
      amount: String(amount),
      app_trans_id: appTransId,
      embed_data: embedData,
      item,
      description,
      bank_code: '',
      mac: hmacSha256Hex(macData, key1),
    });

    await rememberGatewayReference({ orderId, zalopayAppTransId: appTransId });
    const zaloPayResponse = await postForm(createUrl, form);

    if (Number(zaloPayResponse.return_code || 0) !== 1 || !zaloPayResponse.order_url) {
      return errorResponse(res, 502, 'ZaloPay khong tra ve link thanh toan', zaloPayResponse);
    }

    return successResponse(res, 'Tao thanh toan ZaloPay thanh cong', {
      orderId,
      appTransId,
      orderUrl: zaloPayResponse.order_url,
      paymentUrl: zaloPayResponse.order_url,
      zaloPayResponse,
    });
  } catch (error) {
    console.error('[ZALOPAY_CREATE_ERROR]', error);
    return errorResponse(res, 500, 'Loi tao thanh toan ZaloPay', { detail: error.message });
  }
}

export async function zaloPayReturn(req, res) {
  try {
    const appTransId = String(req.query.apptransid || req.query.app_trans_id || '');
    const orderId = Number(appTransId.split('_')[1]);
    if (!orderId) {
      return redirectToOrders(req, res, { payment: 'zalopay', status: 'invalid' });
    }

    const resultCode = Number(req.query.resultcode || req.query.resultCode || 0);
    if (resultCode === 1 || resultCode === 0) {
      await updatePaidOrder({ orderId, status: 'Paid', zalopayAppTransId: appTransId });
      return redirectToOrders(req, res, { payment: 'zalopay', status: 'success', orderId });
    }

    return redirectToOrders(req, res, { payment: 'zalopay', status: 'failed', orderId, resultCode });
  } catch (error) {
    console.error('[ZALOPAY_RETURN_ERROR]', error);
    return redirectToOrders(req, res, { payment: 'zalopay', status: 'error' });
  }
}
