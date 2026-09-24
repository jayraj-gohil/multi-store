import { Prisma } from '../../generated/prisma/client.js';

/** Decimal-safe monetary helpers. Never use JS `number` for authoritative money math. */
export const Decimal = Prisma.Decimal;
export type Decimal = InstanceType<typeof Prisma.Decimal>;

export function money(value: Decimal | number | string): Decimal {
  return new Decimal(value).toDecimalPlaces(2);
}

export function percentOf(amount: Decimal, percentage: Decimal | number): Decimal {
  return amount.mul(percentage).div(100).toDecimalPlaces(2);
}
