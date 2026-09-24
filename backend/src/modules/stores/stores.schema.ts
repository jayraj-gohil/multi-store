import { z } from 'zod';

export const createStoreBody = z.object({
  name: z.string().trim().min(1).max(150),
  address: z.string().trim().min(1).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type CreateStoreInput = z.infer<typeof createStoreBody>;

export const updateStoreBody = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  address: z.string().trim().min(1).max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateStoreInput = z.infer<typeof updateStoreBody>;

export const storeParams = z.object({ id: z.uuid() });
