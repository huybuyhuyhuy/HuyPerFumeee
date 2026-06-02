const PAYMENT_AUTH_BRIDGE_KEY = 'huyperfume-payment-auth-bridge';
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const PAYMENT_AUTH_TTL_MS = 45 * 60 * 1000;

type PaymentAuthBridgePayload = {
  token: string;
  refreshToken?: string | null;
  user: unknown;
  expiresAt: number;
};

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' && typeof localStorage !== 'undefined';
}

export function savePaymentAuthBridge() {
  if (!canUseBrowserStorage()) return;

  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const userRaw = sessionStorage.getItem(USER_KEY);
    if (!token || !userRaw) return;

    const payload: PaymentAuthBridgePayload = {
      token,
      refreshToken: sessionStorage.getItem(REFRESH_TOKEN_KEY),
      user: JSON.parse(userRaw),
      expiresAt: Date.now() + PAYMENT_AUTH_TTL_MS,
    };
    localStorage.setItem(PAYMENT_AUTH_BRIDGE_KEY, JSON.stringify(payload));
  } catch {
    localStorage.removeItem(PAYMENT_AUTH_BRIDGE_KEY);
  }
}

export function restorePaymentAuthBridge() {
  if (!canUseBrowserStorage()) return null;

  try {
    const raw = localStorage.getItem(PAYMENT_AUTH_BRIDGE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as PaymentAuthBridgePayload;
    localStorage.removeItem(PAYMENT_AUTH_BRIDGE_KEY);

    if (!payload?.token || !payload?.user || Number(payload.expiresAt || 0) < Date.now()) {
      return null;
    }

    sessionStorage.setItem(TOKEN_KEY, payload.token);
    if (payload.refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload;
  } catch {
    localStorage.removeItem(PAYMENT_AUTH_BRIDGE_KEY);
    return null;
  }
}
