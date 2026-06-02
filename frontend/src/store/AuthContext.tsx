import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api';
import { cartService } from '../services/cartService';
import type { User } from '../types';
import { restorePaymentAuthBridge } from '../utils/paymentAuthBridge';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  login: (emailPhone: string, password: string, captcha?: CaptchaProof) => Promise<AuthPayload>;
  register: (form: Record<string, string>) => Promise<AuthPayload>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const AUTH_TRANSFER_KEY = 'huyperfume-auth-transfer';

type AuthPayload = { token: string; accessToken?: string; refreshToken?: string; user: User };
type CaptchaProof = { captchaToken: string; captchaAnswer: string };

function clearPersistedAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readStoredUser(): User | null {
  try {
    const paymentAuth = restorePaymentAuthBridge();
    if (paymentAuth?.user) return paymentAuth.user as User;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    const transferredUser = readTransferredUser();
    if (transferredUser) return transferredUser;

    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readTransferredUser(): User | null {
  try {
    const raw = window.name || '';
    if (!raw.includes(AUTH_TRANSFER_KEY)) return null;

    const payload = JSON.parse(raw);
    window.name = '';

    if (
      payload?.type !== AUTH_TRANSFER_KEY ||
      !(payload?.token || payload?.accessToken) ||
      !payload?.user ||
      Number(payload?.expiresAt || 0) < Date.now()
    ) {
      return null;
    }

    sessionStorage.setItem(TOKEN_KEY, payload.token || payload.accessToken);
    if (payload.refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload.user;
  } catch {
    window.name = '';
    return null;
  }
}

function getAuthPayload(responseData: any): AuthPayload {
  const payload = responseData?.data ?? responseData;
  const token = payload?.token || payload?.accessToken;
  if (!token || !payload?.user) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.');
  }
  return { ...payload, token };
}

async function mergeGuestCartSilently() {
  try {
    await cartService.mergeGuestCart();
  } catch {
    // Login should never fail just because a guest cart could not be merged.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(readStoredUser);

  const setUser = (nextUser: User | null) => {
    setUserState(nextUser);
    if (nextUser) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      localStorage.removeItem(USER_KEY);
    } else {
      clearPersistedAuth();
    }
  };

  const login = async (emailPhone: string, password: string, captcha?: CaptchaProof) => {
    const { data } = await api.post('/auth/login', { emailPhone, password, ...captcha });
    const { token, refreshToken, user } = getAuthPayload(data);
    sessionStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setUserState(user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    await mergeGuestCartSilently();
    return { token, refreshToken, user };
  };

  const register = async (form: Record<string, string>) => {
    const { data } = await api.post('/auth/register', form);
    const { token, refreshToken, user } = getAuthPayload(data);
    sessionStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setUserState(user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    await mergeGuestCartSilently();
    return { token, refreshToken, user };
  };

  const logout = () => {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isAdmin: String(user?.role || '').toLowerCase() === 'admin',
      setUser,
      login,
      register,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
