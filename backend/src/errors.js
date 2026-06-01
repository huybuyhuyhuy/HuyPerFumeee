export function sendApiError(res, status, message, errors) {
  const reasons = {
    400: 'Yêu cầu không hợp lệ',
    401: 'Chưa xác thực',
    403: 'Bị từ chối',
    404: 'Không tìm thấy',
    500: 'Lỗi máy chủ nội bộ',
  };
  const reason = reasons[status] || 'Lỗi';
  const body = {
    status,
    error: reason,
    message,
    path: res.req?.originalUrl || res.req?.url || '',
    timestamp: new Date().toISOString(),
  };
  if (errors && Object.keys(errors).length) body.errors = errors;
  res.status(status).json(body);
}
