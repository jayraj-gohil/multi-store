import type { ApiSuccess } from '../types/api';
import type { InventoryRow } from '../types/domain';
import { api } from './api';

export async function listInventory() {
  const { data } = await api.get<ApiSuccess<InventoryRow[]>>('/admin/inventory');
  return data.data;
}

export async function setInventory(storeId: string, productId: string, quantity: number) {
  const { data } = await api.put<ApiSuccess<InventoryRow>>('/admin/inventory', {
    storeId,
    productId,
    quantity,
  });
  return data.data;
}
