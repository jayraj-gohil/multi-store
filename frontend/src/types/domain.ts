// Decimal fields are serialized by the backend as strings — parse with Number() for
// display only; the backend is always the source of truth for totals.

export type Role = 'ADMIN' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  isActive: boolean;
  createdAt: string;
}

export interface AvailableProduct extends Product {
  availableQuantity: number;
}

export interface InventoryRow {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  store: Store;
  product: Product;
}

export interface ProductDiscount {
  id: string;
  productId: string;
  minimumQuantity: number;
  discountPercentage: string;
  isActive: boolean;
  product: { id: string; name: string };
}

export interface PlatformDiscount {
  id: string;
  minimumOrderAmount: string;
  discountPercentage: string;
  isActive: boolean;
}

export interface OrderAllocation {
  id: string;
  storeId: string;
  quantity: number;
  store: Store;
}

export interface OrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPrice: string;
  quantity: number;
  returnedQuantity: number;
  discountAmount: string;
  lineTotal: string;
  allocations: OrderAllocation[];
  /** Current product image (not a purchase-time snapshot) — null if the product has none. */
  product: { imageUrl: string | null };
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type DiscountType = 'PRODUCT' | 'PLATFORM' | null;

export interface Order {
  id: string;
  customerId: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  discountType: DiscountType;
  originalSubtotal: string;
  originalDiscountAmount: string;
  originalTotalAmount: string;
  originalDiscountType: DiscountType;
  totalReturnedAmount: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  customer: { id: string; name: string; email: string };
}

export interface ReturnableItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  unitPrice: string;
  purchasedQuantity: number;
  returnedQuantity: number;
  returnableQuantity: number;
}

export interface ReturnAllocation {
  id: string;
  storeId: string;
  quantity: number;
  store: Store;
}

export interface ReturnItem {
  id: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  returnAmount: string;
  allocations: ReturnAllocation[];
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  totalReturnAmount: string;
  createdAt: string;
  items: ReturnItem[];
}
