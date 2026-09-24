import { Decimal, money, percentOf } from '../../common/utils/money.js';

export interface DiscountableLine {
  productId: string;
  quantity: number;
  lineSubtotal: Decimal;
}

export interface ProductDiscountRule {
  productId: string;
  minimumQuantity: number;
  discountPercentage: Decimal;
}

export interface PlatformDiscountRule {
  minimumOrderAmount: Decimal;
  discountPercentage: Decimal;
}

export interface DiscountResult {
  discountType: 'PRODUCT' | 'PLATFORM' | null;
  discountAmount: Decimal;
  lineDiscounts: Map<string, Decimal>; // productId -> discount amount for that line
}

/**
 * Exclusivity rule (product-level and platform-level discounts are never combined):
 *   1. Sum the product-level discount for every line whose quantity meets that
 *      product's active minimum-quantity threshold → productDiscountTotal.
 *   2. If the order subtotal meets the active platform discount's minimum order
 *      amount → platformDiscountTotal = subtotal * pct/100, else 0.
 *   3. Apply whichever total is larger (ties go to the product-level discount,
 *      since a per-line discount is finer-grained and >= counts as qualifying).
 *   4. If neither qualifies, no discount is applied.
 */
export function calculateDiscount(
  lines: DiscountableLine[],
  subtotal: Decimal,
  productDiscounts: Map<string, ProductDiscountRule>,
  platformDiscount: PlatformDiscountRule | null,
): DiscountResult {
  const lineDiscounts = new Map<string, Decimal>();
  let productDiscountTotal = new Decimal(0);

  for (const line of lines) {
    const rule = productDiscounts.get(line.productId);
    if (rule && line.quantity >= rule.minimumQuantity) {
      const discount = percentOf(line.lineSubtotal, rule.discountPercentage);
      lineDiscounts.set(line.productId, discount);
      productDiscountTotal = productDiscountTotal.add(discount);
    }
  }

  let platformDiscountTotal = new Decimal(0);
  if (platformDiscount && subtotal.gte(platformDiscount.minimumOrderAmount)) {
    platformDiscountTotal = percentOf(subtotal, platformDiscount.discountPercentage);
  }

  if (productDiscountTotal.gt(0) && productDiscountTotal.gte(platformDiscountTotal)) {
    return { discountType: 'PRODUCT', discountAmount: money(productDiscountTotal), lineDiscounts };
  }
  if (platformDiscountTotal.gt(0)) {
    return { discountType: 'PLATFORM', discountAmount: money(platformDiscountTotal), lineDiscounts: new Map() };
  }
  return { discountType: null, discountAmount: money(0), lineDiscounts: new Map() };
}

/**
 * Given a DiscountResult already computed by calculateDiscount(), returns one line's share of it.
 * Platform discounts are order-level only (no per-line share); product discounts are per-line.
 * Shared by order creation and return recalculation so both apply the exact same rule.
 */
export function lineDiscountAndTotal(
  discount: DiscountResult,
  productId: string,
  lineSubtotal: Decimal,
): { discountAmount: Decimal; lineTotal: Decimal } {
  const discountAmount =
    discount.discountType === 'PRODUCT' ? (discount.lineDiscounts.get(productId) ?? money(0)) : money(0);
  return { discountAmount, lineTotal: money(lineSubtotal.sub(discountAmount)) };
}
