import { z } from 'zod';

export const createProductDiscountBody = z.object({
  productId: z.uuid(),
  minimumQuantity: z.number().int().positive(),
  discountPercentage: z.number().positive().max(100),
});
export type CreateProductDiscountInput = z.infer<typeof createProductDiscountBody>;

export const createPlatformDiscountBody = z.object({
  // Capped well under the money column's precision (DECIMAL(10,2), max 99,999,999.99) so an
  // out-of-range value is rejected here with a clean 400 instead of a raw database overflow error.
  minimumOrderAmount: z.number().nonnegative().max(1_000_000),
  discountPercentage: z.number().positive().max(100),
});
export type CreatePlatformDiscountInput = z.infer<typeof createPlatformDiscountBody>;
