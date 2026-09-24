import { NotFoundError } from '../../common/errors/app-error.js';
import { prisma } from '../../config/database.js';
import type { CreatePlatformDiscountInput, CreateProductDiscountInput } from './discounts.schema.js';

/** MVP rule: at most one active discount per product — creating a new one deactivates the old. */
export async function createProductDiscount(input: CreateProductDiscountInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new NotFoundError('Product not found');

  return prisma.$transaction(async (tx) => {
    await tx.productQuantityDiscount.updateMany({
      where: { productId: input.productId, isActive: true },
      data: { isActive: false },
    });
    return tx.productQuantityDiscount.create({ data: { ...input, isActive: true } });
  });
}

/** MVP rule: at most one active platform discount — creating a new one deactivates the old. */
export async function createPlatformDiscount(input: CreatePlatformDiscountInput) {
  return prisma.$transaction(async (tx) => {
    await tx.platformDiscount.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return tx.platformDiscount.create({ data: { ...input, isActive: true } });
  });
}

export async function listDiscounts() {
  const [productDiscounts, platformDiscounts] = await Promise.all([
    prisma.productQuantityDiscount.findMany({
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.platformDiscount.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);
  return { productDiscounts, platformDiscounts };
}
