export function successResponse(res, message, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl || res.req?.url || '',
  });
}

export function errorResponse(res, status, message, details = {}) {
  return res.status(status).json({
    success: false,
    status,
    message,
    data: details,
    timestamp: new Date().toISOString(),
    path: res.req?.originalUrl || res.req?.url || '',
  });
}
