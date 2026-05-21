export function errorHandler(err, req, res, _next) {
  console.error(err);
  res.status(err.status || 500).json({
    status: err.status || 500,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Lỗi hệ thống',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
