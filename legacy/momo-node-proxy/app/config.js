require('dotenv').config();

/** Cấu hình sandbox MoMo (lấy từ biến môi trường) */
module.exports = {
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  orderInfo: process.env.MOMO_ORDER_INFO || 'pay with MoMo',
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:8080/',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://127.0.0.1:5000/callback',
  requestType: process.env.MOMO_REQUEST_TYPE || 'payWithMethod',
  extraData: process.env.MOMO_EXTRA_DATA || '',
  orderGroupId: process.env.MOMO_ORDER_GROUP_ID || '',
  autoCapture: (process.env.MOMO_AUTO_CAPTURE || 'true') === 'true',
  lang: process.env.MOMO_LANG || 'vi',
};
