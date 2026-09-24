import type { ApiSuccess } from '../types/api';
import type { PlatformDiscount, ProductDiscount } from '../types/domain';
import { api } from './api';

export async function listDiscounts() {
  const { data } =
    await api.get<ApiSuccess<{ productDiscounts: ProductDiscount[]; platformDiscounts: PlatformDiscount[] }>>(
      '/admin/discounts',
    );
  return data.data;
}

export async function createProductDiscount(
  productId: string,
  minimumQuantity: number,
  discountPercentage: number,
) {
  const { data } = await api.post<ApiSuccess<ProductDiscount>>('/admin/product-discounts', {
    productId,
    minimumQuantity,
    discountPercentage,
  });
  return data.data;
}

export async function createPlatformDiscount(minimumOrderAmount: number, discountPercentage: number) {
  const { data } = await api.post<ApiSuccess<PlatformDiscount>>('/admin/platform-discounts', {
    minimumOrderAmount,
    discountPercentage,
  });
  return data.data;
}
