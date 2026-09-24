import { z } from 'zod';

export const registerBody = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(255),
  password: z.string().min(8).max(100),
});
export type RegisterInput = z.infer<typeof registerBody>;

export const loginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginBody>;
