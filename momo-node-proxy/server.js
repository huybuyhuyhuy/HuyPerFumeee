/**
 * Proxy MoMo – Java (Tomcat) POST JSON vào đây, server gọi MoMo create và trả payUrl.
 * Chạy: npm install && npm start  (port 5000)
 */
const { urlencoded } = require('body-parser');
const express = require('express');
const app = express();
const axios = require('axios');
const crypto = require('crypto');

const config = require('./config');

app.use(express.json());
app.use(urlencoded({ extended: true }));

/** Kiểm tra nhanh: trình duyệt mở http://127.0.0.1:5000/ — thấy JSON là server đang chạy */
app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'MoMo proxy đang chạy. Postman: POST /payment , Body raw JSON: {}' });
});

/**
 * Body từ Java (CheckoutServlet) có thể gồm:
 * amount, orderId, orderInfo, redirectUrl, ipnUrl
 * Nếu không gửi → dùng mặc định như demo cũ.
 */
app.post('/payment', async (req, res) => {
  let {
    accessKey,
    secretKey,
    orderInfo,
    partnerCode,
    redirectUrl,
    ipnUrl,
    requestType,
    extraData,
    orderGroupId,
    autoCapture,
    lang,
  } = config;

  const b = req.body || {};
  let amount = String(b.amount != null ? b.amount : 10000);
  let orderId = b.orderId || partnerCode + new Date().getTime();
  let requestId = orderId;

  if (b.orderInfo) orderInfo = String(b.orderInfo);
  if (b.redirectUrl) redirectUrl = String(b.redirectUrl);
  if (b.ipnUrl) ipnUrl = String(b.ipnUrl);

  var rawSignature =
    'accessKey=' +
    accessKey +
    '&amount=' +
    amount +
    '&extraData=' +
    extraData +
    '&ipnUrl=' +
    ipnUrl +
    '&orderId=' +
    orderId +
    '&orderInfo=' +
    orderInfo +
    '&partnerCode=' +
    partnerCode +
    '&redirectUrl=' +
    redirectUrl +
    '&requestId=' +
    requestId +
    '&requestType=' +
    requestType;

  var signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: 'HuyPerfume',
    storeId: 'MomoTestStore',
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });

  const options = {
    method: 'POST',
    url: 'https://test-payment.momo.vn/v2/gateway/api/create',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
    },
    data: requestBody,
  };

  try {
    const result = await axios(options);
    return res.status(200).json(result.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      statusCode: 500,
      message: error.message,
      detail: error.response?.data,
    });
  }
});

app.post('/callback', async (req, res) => {
  console.log('MoMo callback (IPN tới Node):', req.body);
  return res.status(204).send();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('[MoMo proxy] http://127.0.0.1:' + PORT + '  GET /  |  POST /payment');
});
