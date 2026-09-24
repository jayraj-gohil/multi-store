import { NotFoundError } from '../../common/errors/app-error.js';
import { prisma } from '../../config/database.js';
import type { ListInventoryQuery, SetInventoryInput } from './inventory.schema.js';

export async function setInventory(input: SetInventoryInput) {
  const [store, product] = await Promise.all([
    prisma.store.findUnique({ where: { id: input.storeId } }),
    prisma.product.findUnique({ where: { id: input.productId } }),
  ]);
  if (!store) throw new NotFoundError('Store not found');
  if (!product) throw new NotFoundError('Product not found');

  return prisma.storeInventory.upsert({
    where: { storeId_productId: { storeId: input.storeId, productId: input.productId } },
    create: { storeId: input.storeId, productId: input.productId, quantity: input.quantity },
    update: { quantity: input.quantity },
  });
}

export function listInventory(query: ListInventoryQuery) {
  return prisma.storeInventory.findMany({
    where: { storeId: query.storeId, productId: query.productId },
    include: { store: true, product: true },
    orderBy: [{ store: { name: 'asc' } }, { product: { name: 'asc' } }],
  });
}
