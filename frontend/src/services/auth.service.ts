import type { ApiSuccess } from '../types/api';
import type { AuthUser } from '../types/domain';
import { api } from './api';

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', {
    name,
    email,
    password,
  });
  return data.data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', { email, password });
  return data.data;
}
