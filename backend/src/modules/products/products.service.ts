import { NotFoundError } from '../../common/errors/app-error.js';
import { prisma } from '../../config/database.js';
import type { CreateProductInput, UpdateProductInput } from './products.schema.js';

export function listProductsAdmin() {
  return prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
}

export function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Product not found');
  return prisma.product.update({ where: { id }, data: input });
}

/** Active products with at least one active store carrying stock > 0. */
export async function listAvailableProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      inventory: { some: { quantity: { gt: 0 }, store: { isActive: true } } },
    },
    orderBy: { name: 'asc' },
  });

  const inventory = await prisma.storeInventory.groupBy({
    by: ['productId'],
    where: { quantity: { gt: 0 }, store: { isActive: true } },
    _sum: { quantity: true },
  });
  const availableByProduct = new Map(inventory.map((i) => [i.productId, i._sum.quantity ?? 0]));

  return products.map((p) => ({ ...p, availableQuantity: availableByProduct.get(p.id) ?? 0 }));
}
