export function notFoundHandler(_req, res, _next) {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: 'Không tìm thấy tài nguyên',
  });
}
