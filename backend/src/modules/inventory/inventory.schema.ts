import { z } from 'zod';

export const setInventoryBody = z.object({
  storeId: z.uuid(),
  productId: z.uuid(),
  // Capped well under Postgres's int4 range (max ~2.1 billion) so an out-of-range value is
  // rejected here with a clean 400 instead of a raw database overflow error.
  quantity: z.number().int().min(0).max(1_000_000),
});
export type SetInventoryInput = z.infer<typeof setInventoryBody>;

export const listInventoryQuery = z.object({
  storeId: z.uuid().optional(),
  productId: z.uuid().optional(),
});
export type ListInventoryQuery = z.infer<typeof listInventoryQuery>;
