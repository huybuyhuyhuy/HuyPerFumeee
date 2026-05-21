import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  login: (emailPhone: string, password: string) => Promise<AuthPayload>;
  register: (form: Record<string, string>) => Promise<AuthPayload>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const AUTH_TRANSFER_KEY = 'huyperfume-auth-transfer';

type AuthPayload = { token: string; user: User };

function clearPersistedAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readStoredUser(): User | null {
  try {
    localStorage.removeItem(TOKEN_KEY);
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
      !payload?.token ||
      !payload?.user ||
      Number(payload?.expiresAt || 0) < Date.now()
    ) {
      return null;
    }

    sessionStorage.setItem(TOKEN_KEY, payload.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload.user;
  } catch {
    window.name = '';
    return null;
  }
}

function getAuthPayload(responseData: any): AuthPayload {
  const payload = responseData?.data ?? responseData;
  if (!payload?.token || !payload?.user) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.');
  }
  return payload;
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

  const login = async (emailPhone: string, password: string) => {
    const { data } = await api.post('/auth/login', { emailPhone, password });
    const { token, user } = getAuthPayload(data);
    sessionStorage.setItem(TOKEN_KEY, token);
    setUserState(user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { token, user };
  };

  const register = async (form: Record<string, string>) => {
    const { data } = await api.post('/auth/register', form);
    const { token, user } = getAuthPayload(data);
    sessionStorage.setItem(TOKEN_KEY, token);
    setUserState(user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { token, user };
  };

  const logout = () => setUser(null);

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
