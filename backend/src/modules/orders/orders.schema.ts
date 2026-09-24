import { z } from 'zod';

export const cartItem = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().max(100_000),
});

export const createOrderBody = z.object({
  items: z.array(cartItem).min(1).max(50),
  customerLatitude: z.number().min(-90).max(90),
  customerLongitude: z.number().min(-180).max(180),
});
export type CreateOrderInput = z.infer<typeof createOrderBody>;

export const orderParams = z.object({ id: z.uuid() });
