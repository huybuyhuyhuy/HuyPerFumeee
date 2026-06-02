import crypto from 'crypto';
import { errorResponse, successResponse } from '../utils/response.js';
import { query } from '../config/database.js';
import { getCheckoutStorageCapabilities, hasColumn as hasCheckoutColumn } from '../modules/checkout/checkout.storage.js';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus.js';
import { cancelOrderForAdmin, updateOrderStatusWithHistory } from '../models/orderModel.js';
import { markCartCheckedOut } from '../models/cartModel.js';

function envValue(name, fallback = '') {
  const value = process.env[name];
  if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();

  const aliasMap = {
    MOMO_PARTNER_CODE: ['MOMO_PARTNER_CODE', 'MOMO_PARTNERCODE', 'MOMO_PARTNER_ID'],
    MOMO_ACCESS_KEY: ['MOMO_ACCESS_KEY', 'MOMO_ACCESSKEY'],
    MOMO_SECRET_KEY: ['MOMO_SECRET_KEY', 'MOMO_SECRETKEY'],
    MOMO_PARTNER_NAME: ['MOMO_PARTNER_NAME'],
    MOMO_STORE_ID: ['MOMO_STORE_ID'],
    MOMO_PAY_URL: ['MOMO_PAY_URL', 'MOMO_ENDPOINT', 'MOMO_CREATE_URL'],
    MOMO_REDIRECT_URL: ['MOMO_REDIRECT_URL'],
    MOMO_IPN_URL: ['MOMO_IPN_URL'],
    ZALOPAY_APP_ID: ['ZALOPAY_APP_ID', 'ZALOPAY_APPID', 'appid'],
    ZALOPAY_KEY1: ['ZALOPAY_KEY1', 'key1'],
    ZALOPAY_KEY2: ['ZALOPAY_KEY2', 'key2'],
    ZALOPAY_CREATE_URL: ['ZALOPAY_CREATE_URL', 'ZALOPAY_ENDPOINT'],
    ZALOPAY_QUERY_URL: ['ZALOPAY_QUERY_URL'],
    ZALOPAY_REDIRECT_URL: ['ZALOPAY_REDIRECT_URL'],
    ZALOPAY_CALLBACK_URL: ['ZALOPAY_CALLBACK_URL'],
  };

  const aliases = aliasMap[name] || [];
  for (const alias of aliases) {
    const aliasValue = process.env[alias];
    if (aliasValue !== undefined && aliasValue !== null && String(aliasValue).trim() !== '') return String(aliasValue).trim();
  }

  return String(fallback || '').trim();
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

function parseOrderIdFromZaloPayAppTransId(value) {
  const [, orderId] = String(value || '').split('_');
  return validateOrderId(orderId);
}

function isConfigured(value) {
  return Boolean(value && !/^YOUR_/i.test(value));
}

function envFlag(name, fallback = false) {
  const value = envValue(name, fallback ? 'true' : 'false').toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(value);
}

function paymentMockEnabled() {
  return envFlag('PAYMENT_MOCK_ENABLED', process.env.NODE_ENV !== 'production');
}

function paymentReturnAutoConfirmEnabled() {
  return envFlag('PAYMENT_RETURN_AUTO_CONFIRM', process.env.NODE_ENV !== 'production');
}

function ensurePayableOrder(order, expectedPaymentMethod) {
  if (expectedPaymentMethod && String(order.payment_method || '').toUpperCase() !== expectedPaymentMethod) {
    return { code: 400, message: 'Phương thức thanh toán của đơn hàng không khớp' };
  }

  const status = normalizeOrderStatus(order.status);
  if ([ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PENDING].includes(status)) return null;
  if (status === ORDER_STATUS.CONFIRMED) {
    return { code: 409, message: 'Đơn hàng đã được thanh toán' };
  }
  return { code: 409, message: 'Đơn hàng không còn chờ thanh toán. Vui lòng tạo đơn mới từ giỏ hàng.' };
}

function createMockReturnUrl(req, payment, params = {}) {
  const path = payment === 'zalopay' ? '/api/payment/zalopay/return' : '/api/payment/momo/return';
  const url = new URL(path, apiBaseUrl(req));
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function createQrImageUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(text)}`;
}

function createMoMoQrPayload(req, paymentResponse, fallbackPaymentUrl) {
  const paymentUrl = paymentResponse?.payUrl || paymentResponse?.paymentUrl || paymentResponse?.orderUrl || paymentResponse?.deeplink || fallbackPaymentUrl || '';
  const qrUrl = paymentResponse?.qrCodeUrl || paymentResponse?.qrUrl || paymentResponse?.qrImageUrl || createQrImageUrl(paymentUrl);
  return {
    paymentUrl,
    qrUrl,
    qrCodeUrl: qrUrl,
    payUrl: paymentUrl,
    orderUrl: paymentResponse?.orderUrl || paymentUrl,
    deeplink: paymentResponse?.deeplink || '',
    rawResponse: paymentResponse,
  };
}

function requireMomoConfig() {
  const apiBase = envValue('APP_BASE_URL', 'http://localhost:4000');
  const config = {
    partnerCode: envValue('MOMO_PARTNER_CODE', envValue('MOMO_PARTNERCODE')),
    accessKey: envValue('MOMO_ACCESS_KEY', envValue('MOMO_ACCESSKEY')),
    secretKey: envValue('MOMO_SECRET_KEY', envValue('MOMO_SECRETKEY')),
    partnerName: envValue('MOMO_PARTNER_NAME', 'HuyPerfume'),
    storeId: envValue('MOMO_STORE_ID', 'HuyPerfume'),
    payUrl: envValue('MOMO_PAY_URL', envValue('MOMO_CREATE_URL', 'https://test-payment.momo.vn/v2/gateway/api/create')),
    redirectUrl: envValue('MOMO_REDIRECT_URL', `${apiBase}/api/payment/momo/return`),
    ipnUrl: envValue('MOMO_IPN_URL', `${apiBase}/api/payment/momo/ipn`),
  };

  const missing = Object.entries(config).filter(([, value]) => !isConfigured(value)).map(([key]) => key);
  if (missing.length) {
    const required = ['partnerCode', 'accessKey', 'secretKey'];
    const missingRequired = missing.filter((key) => required.includes(key));
    if (!missingRequired.length) return config;
    return { code: 500, message: `Thiếu cấu hình MoMo trong .env: ${missingRequired.join(', ')}` };
  }

  return config;
}

function requireZaloPayConfig(req = null) {
  const apiBase = req ? apiBaseUrl(req) : envValue('APP_BASE_URL', 'http://localhost:4000');
  const config = {
    appId: envValue('ZALOPAY_APP_ID'),
    key1: envValue('ZALOPAY_KEY1'),
    key2: envValue('ZALOPAY_KEY2'),
    createUrl: envValue('ZALOPAY_CREATE_URL', 'https://sb-openapi.zalopay.vn/v2/create'),
    queryUrl: envValue('ZALOPAY_QUERY_URL', 'https://sb-openapi.zalopay.vn/v2/query'),
    redirectUrl: envValue('ZALOPAY_REDIRECT_URL', `${apiBase}/api/payment/zalopay/return`),
    callbackUrl: envValue('ZALOPAY_CALLBACK_URL', `${apiBase}/api/payment/zalopay/callback`),
  };
  const missing = ['appId', 'key1', 'key2'].filter((key) => !isConfigured(config[key]));
  if (missing.length) {
    return { code: 500, message: `Thiếu cấu hình ZaloPay trong .env: ${missing.join(', ')}` };
  }
  return config;
}

function paymentRedirectResponse(req, payment, status, orderId = null, extra = {}) {
  const url = new URL('/payment/return', frontendBaseUrl(req));
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

async function getOrderByZaloPayAppTransId(appTransId) {
  const { orderColumns } = await getCheckoutStorageCapabilities();
  if (hasCheckoutColumn(orderColumns, 'zalopay_app_trans_id')) {
    const rows = await query(
      `SELECT TOP 1 id, user_id, total, status, payment_method,
              ${hasCheckoutColumn(orderColumns, 'momo_order_id') ? 'momo_order_id' : 'NULL AS momo_order_id'},
              ${hasCheckoutColumn(orderColumns, 'momo_trans_id') ? 'momo_trans_id' : 'NULL AS momo_trans_id'},
              zalopay_app_trans_id
       FROM orders
       WHERE zalopay_app_trans_id = ?`,
      [appTransId]
    );
    if (rows[0]) return rows[0];
  }

  const orderId = parseOrderIdFromZaloPayAppTransId(appTransId);
  return orderId ? getOrderForPayment(orderId) : null;
}

async function updatePaidOrder({ orderId, userId = null, expectedPaymentMethod = null, momoOrderId = null, momoTransId = null, zalopayAppTransId = null }) {
  const order = await getOrderForPayment(orderId, userId);
  if (!order) return { code: 404, message: 'Không tìm thấy đơn hàng' };
  if (expectedPaymentMethod && String(order.payment_method || '').toUpperCase() !== expectedPaymentMethod) {
    return { code: 400, message: 'Phương thức thanh toán của đơn hàng không khớp' };
  }
  const currentStatus = normalizeOrderStatus(order.status);
  if ([ORDER_STATUS.PAYMENT_FAILED, ORDER_STATUS.CANCELLED_PAYMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(currentStatus)) {
    return { code: 400, message: 'Đơn hàng đã bị hủy hoặc hoàn tiền' };
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
  if ([ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PENDING].includes(currentStatus)) {
    const result = await updateOrderStatusWithHistory({
      orderId,
      newStatus: ORDER_STATUS.CONFIRMED,
      note: `${String(order.payment_method || 'ONLINE').toUpperCase()} thanh toán thành công`,
    });
    if (result.code) return result;
    if (order.user_id) {
      await markCartCheckedOut({ type: 'user', key: order.user_id });
    }
    return { ...result, status: ORDER_STATUS.CONFIRMED };
  }
  if (currentStatus === ORDER_STATUS.CONFIRMED && order.user_id) {
    await markCartCheckedOut({ type: 'user', key: order.user_id });
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

async function queryZaloPayOrder(config, appTransId) {
  const macData = `${config.appId}|${appTransId}|${config.key1}`;
  const form = new URLSearchParams({
    app_id: String(config.appId),
    app_trans_id: appTransId,
    mac: hmacSha256Hex(macData, config.key1),
  });

  const response = await fetch(config.queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: 'pending', body };
  }

  const returnCode = Number(body.return_code || 0);
  if (returnCode === 1) return { ok: true, status: 'success', body };
  if (returnCode === 3 || body.is_processing === true) return { ok: true, status: 'pending', body };
  return { ok: true, status: 'failed', body };
}

function zaloPayReturnStatus(resultCode) {
  const code = Number(resultCode);
  if ([0, 1].includes(code)) return 'success';
  if (code === 3) return 'pending';
  if ([-49, 2, 4, 6, 7, 8, 9].includes(code)) return 'cancel';
  return 'failed';
}

async function markPaymentNotPaidOrder({
  orderId,
  expectedPaymentMethod,
  targetStatus,
  momoOrderId = null,
  zalopayAppTransId = null,
  note = null,
}) {
  const order = await getOrderForPayment(orderId);
  if (!order) return { code: 404, message: 'Không tìm thấy đơn hàng' };
  if (expectedPaymentMethod && String(order.payment_method || '').toUpperCase() !== expectedPaymentMethod) {
    return { code: 400, message: 'Phương thức thanh toán của đơn hàng không khớp' };
  }

  const currentStatus = normalizeOrderStatus(order.status);
  if ([ORDER_STATUS.PAYMENT_FAILED, ORDER_STATUS.CANCELLED_PAYMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(currentStatus)) {
    return { ok: true, status: currentStatus };
  }
  if (currentStatus === ORDER_STATUS.CONFIRMED) {
    return { ok: true, status: ORDER_STATUS.CONFIRMED };
  }
  if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PENDING].includes(currentStatus)) {
    return { code: 409, message: 'Đơn hàng không ở trạng thái chờ thanh toán' };
  }

  await rememberGatewayReference({ orderId, momoOrderId, zalopayAppTransId });
  const result = await cancelOrderForAdmin(orderId, {
    targetStatus,
    note: note || (targetStatus === ORDER_STATUS.CANCELLED_PAYMENT ? 'Thanh toán online bị hủy' : 'Thanh toán online thất bại'),
  });
  if (result.code) return result;
  return { ok: true, status: targetStatus };
}

function momoReturnStatus(resultCode) {
  if (Number(resultCode) === 0) return 'success';
  if ([7000, 7002].includes(Number(resultCode))) return 'pending';
  if ([7004, 7009].includes(Number(resultCode))) return 'cancel';
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
    return { ok: false, message: 'MoMo partnerCode không hợp lệ' };
  }

  const receivedSignature = String(data.signature || '');
  const computedSignature = hmacSha256Hex(momoResultSignaturePayload(data, credentials.accessKey), credentials.secretKey);
  if (!receivedSignature || !signaturesMatch(receivedSignature, computedSignature)) {
    return { ok: false, message: 'Chữ ký MoMo không hợp lệ' };
  }

  if (order.momo_order_id && String(data.orderId || '') !== String(order.momo_order_id)) {
    return { ok: false, message: 'MoMo orderId không khớp đơn hàng' };
  }

  if (Number(data.amount || 0) !== expectedMomoAmount(order)) {
    return { ok: false, message: 'Số tiền MoMo không khớp đơn hàng' };
  }

  if (Number(data.resultCode || -1) === 0 && !String(data.transId || '').trim()) {
    return { ok: false, message: 'MoMo transId không hợp lệ' };
  }

  return { ok: true };
}

export async function createMomo(req, res) {
  try {
    const orderId = validateOrderId(req.body?.orderId);
    if (!orderId) return errorResponse(res, 400, 'orderId không hợp lệ');

    const order = await getOrderForPayment(orderId, req.user?.id || null);
    if (!order) return errorResponse(res, 404, 'Không tìm thấy đơn hàng');
    const payableError = ensurePayableOrder(order, 'MOMO');
    if (payableError) return errorResponse(res, payableError.code, payableError.message);

    const credentials = requireMomoConfig();
    if (credentials.code) {
      if (!paymentMockEnabled()) return errorResponse(res, credentials.code, credentials.message);

      const momoOrderId = `${orderId}_${Date.now()}`;
      await rememberGatewayReference({ orderId, momoOrderId });
      const payUrl = createMockReturnUrl(req, 'momo', { orderId: momoOrderId, resultCode: 0, mock: 1 });
      const failUrl = createMockReturnUrl(req, 'momo', { orderId: momoOrderId, resultCode: 1006, mock: 1 });
      const cancelUrl = createMockReturnUrl(req, 'momo', { orderId: momoOrderId, resultCode: 7004, mock: 1 });
      return successResponse(res, 'Tạo thanh toán MoMo demo thành công', {
        orderId,
        momoOrderId,
        ...createMoMoQrPayload(req, { payUrl, qrUrl: payUrl }, payUrl),
        mock: true,
        mockFailUrl: failUrl,
        mockCancelUrl: cancelUrl,
      });
    }

    const requestId = `momo_${Date.now()}_${orderId}`;
    const momoOrderId = `${orderId}_${Date.now()}`;
    const orderInfo = `Thanh toán đơn hàng #${orderId}`;
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
    const payUrl = momoBody.payUrl || momoBody.deeplink || momoBody.qrCodeUrl || momoBody.qrUrl || '';
    if (!momoResponse.ok || !payUrl) {
      await markPaymentNotPaidOrder({
        orderId,
        expectedPaymentMethod: 'MOMO',
        targetStatus: ORDER_STATUS.PAYMENT_FAILED,
        momoOrderId,
        note: 'MoMo không trả về link thanh toán',
      });
      return errorResponse(res, 502, 'MoMo không trả về link thanh toán', momoBody);
    }

    return successResponse(res, 'Tạo thanh toán MoMo thành công', {
      orderId,
      momoOrderId,
      ...createMoMoQrPayload(req, momoBody, payUrl),
    });
  } catch (error) {
    console.error('[MOMO_CREATE_ERROR]', error);
    return errorResponse(res, 500, 'Lỗi tạo thanh toán MoMo', { detail: error.message });
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
    if (!order) return errorResponse(res, 400, 'orderId không hợp lệ');

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
    } else {
      const status = momoReturnStatus(body.resultCode);
      if (['failed', 'cancel'].includes(status)) {
        const result = await markPaymentNotPaidOrder({
          orderId: order.id,
          expectedPaymentMethod: 'MOMO',
          targetStatus: status === 'cancel' ? ORDER_STATUS.CANCELLED_PAYMENT : ORDER_STATUS.PAYMENT_FAILED,
          momoOrderId: String(body.orderId || ''),
          note: status === 'cancel' ? 'MoMo thanh toán bị hủy' : 'MoMo thanh toán thất bại',
        });
        if (result.code) return errorResponse(res, result.code, result.message);
      }
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
      if (paymentReturnAutoConfirmEnabled() || String(req.query.mock || '') === '1') {
        await updatePaidOrder({
          orderId: order.id,
          expectedPaymentMethod: 'MOMO',
          momoOrderId,
          momoTransId: String(req.query.transId || ''),
        });
      }
      const refreshedOrder = await getOrderForPayment(order.id);
      status = normalizeOrderStatus(refreshedOrder?.status) === ORDER_STATUS.CONFIRMED ? 'success' : 'pending';
    } else if (['failed', 'cancel'].includes(status)) {
      const result = await markPaymentNotPaidOrder({
        orderId: order.id,
        expectedPaymentMethod: 'MOMO',
        targetStatus: status === 'cancel' ? ORDER_STATUS.CANCELLED_PAYMENT : ORDER_STATUS.PAYMENT_FAILED,
        momoOrderId,
        note: status === 'cancel' ? 'MoMo thanh toán bị hủy' : 'MoMo thanh toán thất bại',
      });
      if (!result.code && result.status === ORDER_STATUS.CONFIRMED) status = 'success';
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
    if (!orderId) return errorResponse(res, 400, 'orderId không hợp lệ');

    const order = await getOrderForPayment(orderId, req.user?.id || null);
    if (!order) return errorResponse(res, 404, 'Không tìm thấy đơn hàng');
    const payableError = ensurePayableOrder(order, 'ZALOPAY');
    if (payableError) return errorResponse(res, payableError.code, payableError.message);

    const config = requireZaloPayConfig(req);
    if (config.code) {
      if (!paymentMockEnabled()) return errorResponse(res, config.code, config.message);

      const now = new Date();
      const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
      const appTransId = `${yymmdd}_${orderId}_${Date.now()}`;
      await rememberGatewayReference({ orderId, zalopayAppTransId: appTransId });
      const payUrl = createMockReturnUrl(req, 'zalopay', { apptransid: appTransId, resultcode: 1, mock: 1 });
      const failUrl = createMockReturnUrl(req, 'zalopay', { apptransid: appTransId, resultcode: 3, mock: 1 });
      const cancelUrl = createMockReturnUrl(req, 'zalopay', { apptransid: appTransId, resultcode: 2, mock: 1 });
      return successResponse(res, 'Tạo thanh toán ZaloPay demo thành công', {
        orderId,
        appTransId,
        orderUrl: payUrl,
        paymentUrl: payUrl,
        mock: true,
        mockFailUrl: failUrl,
        mockCancelUrl: cancelUrl,
      });
    }

    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const appTransId = `${yymmdd}_${orderId}_${Date.now()}`;
    const appUser = String(req.user?.email || `user_${req.user?.id || 'guest'}`);
    const appTime = Date.now();
    const amount = Math.round(Number(order.total || 0));
    const embedData = JSON.stringify({ redirecturl: config.redirectUrl });
    const item = '[]';
    const description = `Thanh toán đơn hàng #${orderId}`;
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
      callback_url: config.callbackUrl,
      mac: hmacSha256Hex(macData, config.key1),
    });

    await rememberGatewayReference({ orderId, zalopayAppTransId: appTransId });
    const response = await fetch(config.createUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    const zaloPayResponse = await response.json().catch(() => ({}));
    if (!response.ok || Number(zaloPayResponse.return_code || 0) !== 1 || !zaloPayResponse.order_url) {
      await markPaymentNotPaidOrder({
        orderId,
        expectedPaymentMethod: 'ZALOPAY',
        targetStatus: ORDER_STATUS.PAYMENT_FAILED,
        zalopayAppTransId: appTransId,
        note: 'ZaloPay không trả về link thanh toán',
      });
      return errorResponse(res, 502, 'ZaloPay không trả về link thanh toán', zaloPayResponse);
    }

    return successResponse(res, 'Tạo thanh toán ZaloPay thành công', { orderId, appTransId, orderUrl: zaloPayResponse.order_url, paymentUrl: zaloPayResponse.order_url, zaloPayResponse });
  } catch (error) {
    console.error('[ZALOPAY_CREATE_ERROR]', error);
    return errorResponse(res, 500, 'Lỗi tạo thanh toán ZaloPay', { detail: error.message });
  }
}

export async function zaloPayCallback(req, res) {
  try {
    const config = requireZaloPayConfig(req);
    if (config.code) {
      return res.json({ return_code: 0, return_message: config.message });
    }

    const dataStr = String(req.body?.data || '');
    const receivedMac = String(req.body?.mac || '');
    const computedMac = hmacSha256Hex(dataStr, config.key2);
    if (!dataStr || !receivedMac || !signaturesMatch(receivedMac, computedMac)) {
      return res.json({ return_code: -1, return_message: 'mac not equal' });
    }

    const data = JSON.parse(dataStr);
    const appTransId = String(data.app_trans_id || '');
    const order = await getOrderByZaloPayAppTransId(appTransId);
    if (!order) {
      return res.json({ return_code: 0, return_message: 'Không tìm thấy đơn hàng' });
    }

    const expectedAmount = Math.round(Number(order.total || 0));
    if (Number(data.amount || 0) !== expectedAmount) {
      return res.json({ return_code: -1, return_message: 'Số tiền ZaloPay không khớp đơn hàng' });
    }

    const result = await updatePaidOrder({
      orderId: order.id,
      expectedPaymentMethod: 'ZALOPAY',
      zalopayAppTransId: appTransId,
    });
    if (result.code) {
      return res.json({ return_code: 0, return_message: result.message });
    }

    return res.json({ return_code: 1, return_message: 'success' });
  } catch (error) {
    console.error('[ZALOPAY_CALLBACK_ERROR]', error);
    return res.json({ return_code: 0, return_message: error.message || 'Lỗi xử lý callback ZaloPay' });
  }
}

export async function zaloPayReturn(req, res) {
  try {
    const appTransId = String(req.query.apptransid || req.query.app_trans_id || req.query.appTransId || '');
    const order = await getOrderByZaloPayAppTransId(appTransId);
    if (!order) return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'failed'));

    const orderId = Number(order.id);
    const resultCodeRaw = req.query.resultcode ?? req.query.resultCode ?? req.query.status;
    const isMockReturn = String(req.query.mock || '') === '1';
    let status = resultCodeRaw === undefined ? 'pending' : zaloPayReturnStatus(resultCodeRaw);

    if (!isMockReturn) {
      const config = requireZaloPayConfig(req);
      if (!config.code) {
        const queryResult = await queryZaloPayOrder(config, appTransId);
        status = queryResult.status;
      }
    }

    if (status === 'success') {
      const result = await updatePaidOrder({
        orderId,
        expectedPaymentMethod: 'ZALOPAY',
        zalopayAppTransId: appTransId,
      });
      if (!result.code) {
        return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'success', orderId, { resultCode: resultCodeRaw }));
      }
      status = 'pending';
    }

    if (status === 'pending') {
      return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'pending', orderId, { resultCode: resultCodeRaw }));
    }

    const result = await markPaymentNotPaidOrder({
      orderId,
      expectedPaymentMethod: 'ZALOPAY',
      targetStatus: status === 'cancel' ? ORDER_STATUS.CANCELLED_PAYMENT : ORDER_STATUS.PAYMENT_FAILED,
      zalopayAppTransId: appTransId,
      note: status === 'cancel' ? 'ZaloPay thanh toán bị hủy' : 'ZaloPay thanh toán thất bại',
    });
    if (!result.code && result.status === ORDER_STATUS.CONFIRMED) {
      return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'success', orderId));
    }
    return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', status, orderId, { resultCode: resultCodeRaw }));
  } catch (error) {
    console.error('[ZALOPAY_RETURN_ERROR]', error);
    return redirectToFrontend(res, paymentRedirectResponse(req, 'zalopay', 'error'));
  }
}
