import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { money } from '../../common/utils/money.js';
import { prisma } from '../../config/database.js';
import type { Role } from '../../common/types/auth.types.js';
import { calculateDiscount, lineDiscountAndTotal, type DiscountableLine } from './discount-calculator.js';
import type { CreateReturnInput } from './returns.schema.js';
import type { Prisma } from '../../generated/prisma/client.js';

const orderInclude = {
  items: { include: { allocations: { include: { store: true }, orderBy: { sequence: 'asc' } as const } } },
  customer: { select: { id: true, name: true, email: true } },
} as const;

const returnInclude = {
  items: { include: { allocations: { include: { store: true } } } },
} as const;

/** Merges duplicate orderItemId entries in a single return request into one line. */
function mergeReturnLines(items: CreateReturnInput['items']) {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.orderItemId, (merged.get(item.orderItemId) ?? 0) + item.quantity);
  }
  return [...merged.entries()].map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
}

async function getOwnedOrder(orderId: string, requesterId: string, requesterRole: Role) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');
  if (requesterRole !== 'ADMIN' && order.customerId !== requesterId) {
    throw new ForbiddenError("You cannot access another customer's order");
  }
  return order;
}

export async function getReturnableItems(orderId: string, requesterId: string, requesterRole: Role) {
  await getOwnedOrder(orderId, requesterId, requesterRole);
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { product: { select: { id: true, name: true, imageUrl: true } } },
  });
  return items.map((item) => ({
    orderItemId: item.id,
    productId: item.productId,
    productName: item.productNameSnapshot,
    productImageUrl: item.product.imageUrl,
    unitPrice: item.unitPrice,
    purchasedQuantity: item.quantity,
    returnedQuantity: item.returnedQuantity,
    returnableQuantity: item.quantity - item.returnedQuantity,
  }));
}

export async function listReturnsForOrder(orderId: string, requesterId: string, requesterRole: Role) {
  await getOwnedOrder(orderId, requesterId, requesterRole);
  return prisma.return.findMany({ where: { orderId }, include: returnInclude, orderBy: { createdAt: 'desc' } });
}

/**
 * Processes a return for one or more items of a single order, in one transaction:
 *  1. The order must belong to the requesting customer and be CONFIRMED.
 *  2. Each requested orderItemId must belong to this order.
 *  3. Each line's returned quantity is atomically capped at what's still returnable
 *     (purchased - already returned) — `WHERE returned_quantity <= quantity - requested`,
 *     using the item's immutable `quantity` as a known constant. This is the same
 *     conditional-update pattern used for inventory decrement at order creation, so two
 *     concurrent returns on the same item can never together exceed what was purchased.
 *  4. Inventory is restored to the exact stores that originally fulfilled it: each order
 *     item's OrderAllocation rows are walked in their original `sequence` order, restoring
 *     from each until the returned quantity is accounted for (never more than that
 *     allocation's own remaining, unreturned amount, and never to a store that didn't
 *     fulfill this item).
 *  5. The whole order's discount is recalculated from scratch using every item's *remaining*
 *     (not returned) quantity, against currently active discount rules — never the frontend's
 *     numbers. Product vs. platform exclusivity uses the same calculateDiscount() as checkout.
 */
export async function createReturn(orderId: string, customerId: string, input: CreateReturnInput) {
  const lines = mergeReturnLines(input.items);

  return prisma.$transaction(
    async (tx) => {
      // 1. Order must belong to this customer and be in a returnable state.
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundError('Order not found');
      if (order.customerId !== customerId) {
        throw new ForbiddenError("You cannot return items from another customer's order");
      }
      if (order.status !== 'CONFIRMED') {
        throw new BadRequestError(`This order is ${order.status.toLowerCase()} and cannot be returned`);
      }

      // 2. Every requested orderItemId must belong to this order.
      const orderItems = await tx.orderItem.findMany({ where: { orderId }, include: { product: true } });
      const orderItemById = new Map(orderItems.map((i) => [i.id, i]));
      for (const line of lines) {
        const item = orderItemById.get(line.orderItemId);
        if (!item) throw new NotFoundError(`Order item ${line.orderItemId} not found on this order`);
      }

      const returnItemsData: Prisma.ReturnItemCreateWithoutReturnInput[] = [];
      let totalReturnAmount = money(0);

      for (const line of lines) {
        const item = orderItemById.get(line.orderItemId)!;

        // 3. Atomically cap the returned quantity at what's actually still returnable.
        //    item.quantity is immutable, so `returnedQuantity <= quantity - requested` is a
        //    safe, race-free equivalent of `(quantity - returnedQuantity) >= requested`.
        const capped = await tx.orderItem.updateMany({
          where: { id: item.id, returnedQuantity: { lte: item.quantity - line.quantity } },
          data: { returnedQuantity: { increment: line.quantity } },
        });
        if (capped.count === 0) {
          const returnable = item.quantity - item.returnedQuantity;
          throw new BadRequestError(
            `Cannot return ${line.quantity} of "${item.productNameSnapshot}" — only ${returnable} unit(s) are returnable.`,
          );
        }

        // 4. Restore inventory to the original fulfilling stores, in original allocation order.
        const allocations = await tx.orderAllocation.findMany({
          where: { orderItemId: item.id },
          orderBy: { sequence: 'asc' },
        });
        let remaining = line.quantity;
        const restoreAllocations: { orderAllocationId: string; storeId: string; quantity: number }[] = [];

        for (const alloc of allocations) {
          if (remaining <= 0) break;
          const restorableHere = alloc.quantity - alloc.returnedQuantity;
          if (restorableHere <= 0) continue;
          const take = Math.min(restorableHere, remaining);

          const allocUpdate = await tx.orderAllocation.updateMany({
            where: { id: alloc.id, returnedQuantity: { lte: alloc.quantity - take } },
            data: { returnedQuantity: { increment: take } },
          });
          if (allocUpdate.count === 0) {
            throw new ConflictError('Stock allocation changed while processing this return. Please try again.');
          }

          const inventoryUpdate = await tx.storeInventory.updateMany({
            where: { storeId: alloc.storeId, productId: item.productId },
            data: { quantity: { increment: take } },
          });
          if (inventoryUpdate.count === 0) {
            throw new ConflictError('Could not restore inventory for this return. Please try again.');
          }

          restoreAllocations.push({ orderAllocationId: alloc.id, storeId: alloc.storeId, quantity: take });
          remaining -= take;
        }

        if (remaining > 0) {
          // Should be unreachable: the returnable-quantity check above guarantees the original
          // allocations can always cover it. Treated as a bug guard — rolls back the transaction.
          throw new ConflictError('Unable to determine which store to restore this return to. Please try again.');
        }

        const returnAmount = money(item.unitPrice).mul(line.quantity);
        totalReturnAmount = totalReturnAmount.add(returnAmount);

        returnItemsData.push({
          orderItem: { connect: { id: item.id } },
          product: { connect: { id: item.productId } },
          quantity: line.quantity,
          unitPrice: item.unitPrice,
          returnAmount,
          allocations: {
            create: restoreAllocations.map((a) => ({
              quantity: a.quantity,
              store: { connect: { id: a.storeId } },
              orderAllocation: { connect: { id: a.orderAllocationId } },
            })),
          },
        });
      }

      // 5. Recalculate the whole order from every item's *remaining* quantity, against current
      //    discount rules — the frontend never supplies pricing, discount, or totals.
      const freshItems = await tx.orderItem.findMany({ where: { orderId } });
      const remainingLines: DiscountableLine[] = freshItems
        .filter((i) => i.quantity - i.returnedQuantity > 0)
        .map((i) => ({
          productId: i.productId,
          quantity: i.quantity - i.returnedQuantity,
          lineSubtotal: money(i.unitPrice).mul(i.quantity - i.returnedQuantity),
        }));
      const remainingSubtotal = money(
        remainingLines.reduce((sum, l) => sum.add(l.lineSubtotal), money(0)),
      );

      const productIds = [...new Set(freshItems.map((i) => i.productId))];
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
        remainingLines,
        remainingSubtotal,
        productDiscountRules,
        activePlatformDiscount
          ? {
              minimumOrderAmount: activePlatformDiscount.minimumOrderAmount,
              discountPercentage: activePlatformDiscount.discountPercentage,
            }
          : null,
      );
      const remainingTotal = money(remainingSubtotal.sub(discount.discountAmount));

      // Every item's discountAmount/lineTotal is recomputed — a return on one product can change
      // whether PRODUCT or PLATFORM wins overall, which changes every other line's own discount too.
      for (const item of freshItems) {
        const remainingQty = item.quantity - item.returnedQuantity;
        if (remainingQty <= 0) {
          await tx.orderItem.update({ where: { id: item.id }, data: { discountAmount: money(0), lineTotal: money(0) } });
          continue;
        }
        const lineSubtotal = money(item.unitPrice).mul(remainingQty);
        const { discountAmount, lineTotal } = lineDiscountAndTotal(discount, item.productId, lineSubtotal);
        await tx.orderItem.update({ where: { id: item.id }, data: { discountAmount, lineTotal } });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: remainingSubtotal,
          discountAmount: discount.discountAmount,
          discountType: discount.discountType,
          totalAmount: remainingTotal,
          totalReturnedAmount: { increment: totalReturnAmount },
        },
      });

      const createdReturn = await tx.return.create({
        data: {
          orderId,
          customerId,
          totalReturnAmount,
          items: { create: returnItemsData },
        },
        include: returnInclude,
      });

      const updatedOrder = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });

      return { return: createdReturn, order: updatedOrder };
    },
    { maxWait: 5000, timeout: 15000 },
  );
}
