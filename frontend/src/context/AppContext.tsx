import { createContext, useContext, useMemo, useState } from 'react';
import type { Product, User } from '../types';

interface AppContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  productsCache: Product[];
  setProductsCache: (products: Product[]) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function readUser() {
  try {
    const raw = sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(readUser);
  const [productsCache, setProductsCache] = useState<Product[]>([]);

  const setUser = (next: User | null) => {
    setUserState(next);
    if (next) sessionStorage.setItem('user', JSON.stringify(next));
    else sessionStorage.removeItem('user');
  };

  const value = useMemo(() => ({ user, setUser, productsCache, setProductsCache }), [user, productsCache]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
