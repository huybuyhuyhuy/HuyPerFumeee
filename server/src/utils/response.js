export function successResponse(res, message, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, status, message, details = {}) {
  return res.status(status).json({
    success: false,
    message,
    data: details,
  });
}
