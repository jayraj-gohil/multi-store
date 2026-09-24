import { NotFoundError } from '../../common/errors/app-error.js';
import { prisma } from '../../config/database.js';
import type { CreateStoreInput, UpdateStoreInput } from './stores.schema.js';

export function listStores() {
  return prisma.store.findMany({ orderBy: { createdAt: 'desc' } });
}

export function createStore(input: CreateStoreInput) {
  return prisma.store.create({ data: input });
}

export async function updateStore(id: string, input: UpdateStoreInput) {
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) throw new NotFoundError('Store not found');
  return prisma.store.update({ where: { id }, data: input });
}
