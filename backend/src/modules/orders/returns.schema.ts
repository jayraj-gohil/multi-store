import { z } from 'zod';

export const returnLine = z.object({
  orderItemId: z.uuid(),
  quantity: z.number().int().positive().max(100_000),
});

export const createReturnBody = z.object({
  items: z.array(returnLine).min(1).max(50),
});
export type CreateReturnInput = z.infer<typeof createReturnBody>;
