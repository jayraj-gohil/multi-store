import type { ApiSuccess } from '../types/api.types.js';
import { formatDecimals } from './serialize.js';

/**
 * Wraps a payload in the standard success envelope: `{ success: true, data }`.
 * Also normalizes any Prisma `Decimal` in the payload to a fixed 2-decimal string
 * (decimal.js's default serialization strips trailing zeros, e.g. 300.00 -> "300").
 */
export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  const formatted = formatDecimals(data);
  return message === undefined ? { success: true, data: formatted } : { success: true, message, data: formatted };
}
