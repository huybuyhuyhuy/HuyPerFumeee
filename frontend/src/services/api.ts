import axios from 'axios';

function normalizeApiBaseUrl(value: string | undefined) {
  const trimmed = String(value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000'
);

export function unwrapApiData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const VIEW_TOKEN_KEY = 'huyperfumeViewToken';
const CART_TOKEN_KEY = 'huyperfumeCartToken';
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const { data } = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const payload = unwrapApiData<any>(data);
  const token = payload?.token || payload?.accessToken;
  if (!token) return null;

  sessionStorage.setItem(TOKEN_KEY, token);
  if (payload.refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  if (payload.user) sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return token;
}

function clearAuthStorage() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getOrCreateViewToken() {
  try {
    const existing = localStorage.getItem(VIEW_TOKEN_KEY);
    if (existing) return existing;

    const token = globalThis.crypto?.randomUUID?.() ||
      `view_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VIEW_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

function getOrCreateCartToken() {
  try {
    const existing = localStorage.getItem(CART_TOKEN_KEY);
    if (existing) return existing;

    const token = globalThis.crypto?.randomUUID?.() ||
      `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CART_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const viewToken = getOrCreateViewToken();
  if (viewToken) {
    config.headers['X-View-Token'] = viewToken;
  }
  const cartToken = getOrCreateCartToken();
  if (cartToken) {
    config.headers['X-Cart-Token'] = cartToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      const config = error.config || {};
      const requestUrl = String(config.url || '');
      const isLogoutEndpoint = requestUrl.includes('/auth/logout');
      if (isLogoutEndpoint) {
        clearAuthStorage();
        return Promise.reject(error);
      }

      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/refresh');
      const canRefresh = !isAuthEndpoint && !config.__isRetry && sessionStorage.getItem(REFRESH_TOKEN_KEY);

      if (canRefresh) {
        config.__isRetry = true;
        refreshInFlight = refreshInFlight || refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });

        return refreshInFlight.then((token) => {
          if (!token) throw error;
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        }).catch((refreshError) => {
          clearAuthStorage();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        });
      }

      clearAuthStorage();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối tới máy chủ.'));
    }

    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Yêu cầu thất bại.';
    const requestError = new Error(message) as Error & {
      response?: typeof error.response;
      status?: number;
    };
    requestError.response = error.response;
    requestError.status = status;
    return Promise.reject(requestError);
  }
);

export default api;
