import { z } from 'zod';

// Optional image URL — not a file upload, just a link to an already-hosted image.
const imageUrl = z.url().max(2000).optional();

export const createProductBody = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
  price: z.number().positive().max(1_000_000),
  imageUrl,
});
export type CreateProductInput = z.infer<typeof createProductBody>;

export const updateProductBody = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  price: z.number().positive().max(1_000_000).optional(),
  isActive: z.boolean().optional(),
  imageUrl,
});
export type UpdateProductInput = z.infer<typeof updateProductBody>;

export const productParams = z.object({ id: z.uuid() });
