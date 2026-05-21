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

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối tới máy chủ.'));
    }

    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Yêu cầu thất bại.';
    return Promise.reject(new Error(message));
  }
);

export default api;
