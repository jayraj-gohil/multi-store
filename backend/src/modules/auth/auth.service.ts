import { ConflictError, UnauthorizedError } from '../../common/errors/app-error.js';
import { hashPassword, verifyPassword } from '../../common/utils/password.js';
import { prisma } from '../../config/database.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export async function registerCustomer(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('An account with this email already exists');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: 'CUSTOMER' },
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
