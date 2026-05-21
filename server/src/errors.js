export function sendApiError(res, status, message, errors) {
  const reasons = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
  };
  const reason = reasons[status] || 'Error';
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
