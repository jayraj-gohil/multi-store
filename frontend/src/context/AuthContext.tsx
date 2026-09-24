/* eslint-disable react-refresh/only-export-components -- hook colocated with its provider for simplicity */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { login as loginRequest, register as registerRequest } from '../services/auth.service';
import { setAuthToken } from '../services/api';
import type { AuthUser } from '../types/domain';

const USER_STORAGE_KEY = 'auth_user';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore — falls back to in-memory only for this session
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    persistUser(user);
  }, [user]);

  const login = async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    setAuthToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await registerRequest(name, email, password);
    setAuthToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return <AuthContext value={{ user, login, register, logout }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
