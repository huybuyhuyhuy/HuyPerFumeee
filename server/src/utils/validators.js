export function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

export function isValidPhone(value) {
  return /^\d{10}$/.test(String(value || ''));
}

export function isStrongPassword(value) {
  return String(value || '').length >= 6;
}
