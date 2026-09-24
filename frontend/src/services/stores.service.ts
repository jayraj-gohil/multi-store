import type { ApiSuccess } from '../types/api';
import type { Store } from '../types/domain';
import { api } from './api';

export interface CreateStoreInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function listStores() {
  const { data } = await api.get<ApiSuccess<Store[]>>('/admin/stores');
  return data.data;
}

export async function createStore(input: CreateStoreInput) {
  const { data } = await api.post<ApiSuccess<Store>>('/admin/stores', input);
  return data.data;
}

export async function updateStore(id: string, input: Partial<CreateStoreInput & { isActive: boolean }>) {
  const { data } = await api.patch<ApiSuccess<Store>>(`/admin/stores/${id}`, input);
  return data.data;
}
