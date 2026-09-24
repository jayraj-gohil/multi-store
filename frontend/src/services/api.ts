import axios, { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not set. Copy frontend/.env.example to frontend/.env.');
}

/** Shared Axios instance. Domain services (e.g. user.service.ts) import this — never axios directly. */
export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---- Auth token -----------------------------------------------------------
// Kept in memory by default (cleared on page reload, not readable by other scripts
// via storage). Decide on persistence once the auth requirements are known.
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// ---- Errors ---------------------------------------------------------------

/** Extracts a user-facing message from any error thrown by an API call. */
export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Cannot reach the server. Check your connection.';
    return `Request failed with status ${error.response.status}`;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
