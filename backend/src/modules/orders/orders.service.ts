import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { money } from '../../common/utils/money.js';
import { prisma } from '../../config/database.js';
import type { Role } from '../../common/types/auth.types.js';
import { allocateProduct } from './allocation.js';
import { calculateDiscount, type DiscountableLine } from './discount-calculator.js';
import type { CreateOrderInput } from './orders.schema.js';

const orderInclude = {
  items: {
    include: {
      allocations: { include: { store: true }, orderBy: { sequence: 'asc' } },
      // Current product image (not a purchase-time snapshot like name/price) — shown next to
      // the line item; falls back to a placeholder in the UI if the product has no image.
      product: { select: { imageUrl: true } },
    },
  },
  customer: { select: { id: true, name: true, email: true } },
} as const;

/** Merges duplicate product entries in the cart into a single line quantity. */
function mergeCartItems(items: CreateOrderInput['items']) {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function createOrder(customerId: string, input: CreateOrderInput) {
  const items = mergeCartItems(input.items);
  const productIds = items.map((i) => i.productId);

  return prisma.$transaction(
    async (tx) => {
      // 1. Re-read prices/status inside the transaction — never trust the client.
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productById = new Map(products.map((p) => [p.id, p]));
      for (const item of items) {
        const product = productById.get(item.productId);
        if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
        if (!product.isActive) throw new BadRequestError(`Product "${product.name}" is no longer available`);
      }

      // 2. Build allocation candidates from fresh inventory + active stores.
      const inventoryRows = await tx.storeInventory.findMany({
        where: { productId: { in: productIds }, quantity: { gt: 0 }, store: { isActive: true } },
        include: { store: true },
      });
      const candidatesByProduct = new Map<string, typeof inventoryRows>();
      for (const row of inventoryRows) {
        const list = candidatesByProduct.get(row.productId) ?? [];
        list.push(row);
        candidatesByProduct.set(row.productId, list);
      }

      const allocationsByProduct = new Map(
        items.map((item) => {
          const product = productById.get(item.productId)!;
          const candidates = (candidatesByProduct.get(item.productId) ?? []).map((row) => ({
            storeId: row.storeId,
            quantity: row.quantity,
            latitude: Number(row.store.latitude),
            longitude: Number(row.store.longitude),
          }));
          const allocation = allocateProduct(
            product.name,
            item.quantity,
            candidates,
            input.customerLatitude,
            input.customerLongitude,
          );
          return [item.productId, allocation] as const;
        }),
      );

      // 3. Compute subtotal and lines using authoritative prices.
      const lines: DiscountableLine[] = items.map((item) => {
        const product = productById.get(item.productId)!;
        return {
          productId: item.productId,
          quantity: item.quantity,
          lineSubtotal: money(product.price).mul(item.quantity),
        };
      });
      const subtotal = money(lines.reduce((sum, l) => sum.add(l.lineSubtotal), money(0)));

      // Even with per-field caps (price, quantity), a large enough cart could still sum to more
      // than the money column can hold (DECIMAL(10,2), max 99,999,999.99). Catch that here with a
      // clean error instead of letting the insert fail with a raw database overflow error.
      const MAX_ORDER_AMOUNT = money(99_999_999.99);
      if (subtotal.gt(MAX_ORDER_AMOUNT)) {
        throw new BadRequestError('Order amount is too large to process. Please split it into smaller orders.');
      }

      // 4. Discount: product-level vs platform-level, never combined (see discount-calculator.ts).
      const activeProductDiscounts = await tx.productQuantityDiscount.findMany({
        where: { productId: { in: productIds }, isActive: true },
      });
      const productDiscountRules = new Map(
        activeProductDiscounts.map((d) => [
          d.productId,
          { productId: d.productId, minimumQuantity: d.minimumQuantity, discountPercentage: d.discountPercentage },
        ]),
      );
      const activePlatformDiscount = await tx.platformDiscount.findFirst({ where: { isActive: true } });
      const discount = calculateDiscount(
        lines,
        subtotal,
        productDiscountRules,
        activePlatformDiscount
          ? {
              minimumOrderAmount: activePlatformDiscount.minimumOrderAmount,
              discountPercentage: activePlatformDiscount.discountPercentage,
            }
          : null,
      );
      const totalAmount = money(subtotal.sub(discount.discountAmount));

      // 5. Atomically decrement inventory — fails (and rolls back the whole order) if
      //    another concurrent order already took the stock this allocation relied on.
      for (const [productId, allocation] of allocationsByProduct) {
        for (const line of allocation) {
          const result = await tx.storeInventory.updateMany({
            where: { storeId: line.storeId, productId, quantity: { gte: line.quantity } },
            data: { quantity: { decrement: line.quantity } },
          });
          if (result.count === 0) {
            throw new ConflictError(
              `Stock for "${productById.get(productId)!.name}" changed while placing your order. Please try again.`,
            );
          }
        }
      }

      // 6. Create the order and its child records (snapshotting name/price/discount).
      // originalSubtotal/originalDiscountAmount/originalDiscountType/originalTotalAmount are an
      // immutable copy of the values below, captured once here — see schema.prisma for why.
      const order = await tx.order.create({
        data: {
          customerId,
          subtotal,
          discountAmount: discount.discountAmount,
          totalAmount,
          discountType: discount.discountType,
          originalSubtotal: subtotal,
          originalDiscountAmount: discount.discountAmount,
          originalTotalAmount: totalAmount,
          originalDiscountType: discount.discountType,
          status: 'CONFIRMED',
          customerLatitude: input.customerLatitude,
          customerLongitude: input.customerLongitude,
          items: {
            create: items.map((item) => {
              const product = productById.get(item.productId)!;
              const lineSubtotal = money(product.price).mul(item.quantity);
              const lineDiscount =
                discount.discountType === 'PRODUCT'
                  ? (discount.lineDiscounts.get(item.productId) ?? money(0))
                  : money(0);
              return {
                productId: item.productId,
                productNameSnapshot: product.name,
                unitPrice: product.price,
                quantity: item.quantity,
                discountAmount: lineDiscount,
                lineTotal: money(lineSubtotal.sub(lineDiscount)),
                allocations: {
                  // `sequence` records the order allocations were made in — a return restores
                  // inventory by unwinding this same order (see returns.service.ts).
                  create: allocationsByProduct
                    .get(item.productId)!
                    .map((a, index) => ({ storeId: a.storeId, quantity: a.quantity, sequence: index })),
                },
              };
            }),
          },
        },
        include: orderInclude,
      });

      return order;
    },
    { maxWait: 5000, timeout: 15000 },
  );
}

export function listOrdersForCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export function listAllOrders() {
  return prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' } });
}

export async function getOrderById(id: string, requesterId: string, requesterRole: Role) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new NotFoundError('Order not found');
  if (requesterRole !== 'ADMIN' && order.customerId !== requesterId) {
    throw new ForbiddenError('You cannot view another customer\'s order');
  }
  return order;
}
