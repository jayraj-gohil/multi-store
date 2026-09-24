import { Decimal } from './money.js';

/**
 * Prisma's Decimal serializes to JSON via decimal.js's default toString(), which strips
 * trailing zeros (e.g. 300.00 -> "300"). The value is never wrong, just inconsistently
 * formatted for API consumers that don't coerce it first. This walks a plain object/array
 * tree and reformats any Decimal instance to a fixed 2-decimal string ("300.00").
 */
export function formatDecimals<T>(value: T): T {
  if (value instanceof Decimal) {
    return value.toFixed(2) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatDecimals(item)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = formatDecimals(val);
    }
    return out as T;
  }
  return value;
}
