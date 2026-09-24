import { BadRequestError } from '../../common/errors/app-error.js';
import { haversineDistanceKm } from '../../common/utils/geo.js';

export interface StoreCandidate {
  storeId: string;
  quantity: number;
  latitude: number;
  longitude: number;
}

export interface AllocationLine {
  storeId: string;
  quantity: number;
}

/**
 * Deterministic greedy allocation:
 *  1. Sort eligible stores (quantity > 0) by distance to the customer, ascending
 *     (ties broken by storeId, ascending, for reproducibility).
 *  2. If one store alone can fulfil the required quantity, allocate all of it there
 *     (prefer a single store over splitting).
 *  3. Otherwise, take as much as possible from the nearest store, then the next, and
 *     so on until the requirement is met.
 *  4. If total stock across eligible stores is short, reject the whole product line
 *     (no partial fulfilment) — the caller aborts the whole order.
 *
 * This is a simple nearest-first greedy strategy, not a globally cost-optimal one
 * (e.g. it does not minimize the number of stores when several combinations exist).
 */
export function allocateProduct(
  productName: string,
  requiredQuantity: number,
  candidates: StoreCandidate[],
  customerLat: number,
  customerLng: number,
): AllocationLine[] {
  const eligible = candidates
    .filter((c) => c.quantity > 0)
    .map((c) => ({
      ...c,
      distanceKm: haversineDistanceKm(customerLat, customerLng, c.latitude, c.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.storeId.localeCompare(b.storeId));

  const totalAvailable = eligible.reduce((sum, c) => sum + c.quantity, 0);
  if (totalAvailable < requiredQuantity) {
    throw new BadRequestError(
      `Insufficient stock for "${productName}": requested ${requiredQuantity}, only ${totalAvailable} available across all stores`,
    );
  }

  const singleStore = eligible.find((c) => c.quantity >= requiredQuantity);
  if (singleStore) {
    return [{ storeId: singleStore.storeId, quantity: requiredQuantity }];
  }

  const allocation: AllocationLine[] = [];
  let remaining = requiredQuantity;
  for (const store of eligible) {
    if (remaining <= 0) break;
    const take = Math.min(store.quantity, remaining);
    allocation.push({ storeId: store.storeId, quantity: take });
    remaining -= take;
  }
  return allocation;
}
