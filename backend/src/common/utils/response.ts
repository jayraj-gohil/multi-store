import type { ApiSuccess } from '../types/api.types.js';

/** Wraps a payload in the standard success envelope: `{ success: true, data }`. */
export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return message === undefined ? { success: true, data } : { success: true, message, data };
}
