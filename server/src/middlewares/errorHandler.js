import logger from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Lỗi hệ thống';

  logger.error(`${req.method} ${req.originalUrl} — ${message}`, {
    stack: err.stack,
    status,
    userId: req.user?.id,
  });

  res.status(status).json({
    success: false,
    status,
    error: err.name || 'Lỗi máy chủ nội bộ',
    message,
    data: {},
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
