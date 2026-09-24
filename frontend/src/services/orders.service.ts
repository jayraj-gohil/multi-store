import type { ApiSuccess } from '../types/api';
import type { Order, Return, ReturnableItem } from '../types/domain';
import { api } from './api';

export interface CartLine {
  productId: string;
  quantity: number;
}

export async function placeOrder(items: CartLine[], customerLatitude: number, customerLongitude: number) {
  const { data } = await api.post<ApiSuccess<Order>>('/orders', {
    items,
    customerLatitude,
    customerLongitude,
  });
  return data.data;
}

export async function listMyOrders() {
  const { data } = await api.get<ApiSuccess<Order[]>>('/orders');
  return data.data;
}

export async function getOrder(id: string) {
  const { data } = await api.get<ApiSuccess<Order>>(`/orders/${id}`);
  return data.data;
}

export async function listAllOrdersAdmin() {
  const { data } = await api.get<ApiSuccess<Order[]>>('/admin/orders');
  return data.data;
}

export async function getReturnableItems(orderId: string) {
  const { data } = await api.get<ApiSuccess<ReturnableItem[]>>(`/orders/${orderId}/returnable-items`);
  return data.data;
}

export interface ReturnLine {
  orderItemId: string;
  quantity: number;
}

export async function createReturn(orderId: string, items: ReturnLine[]) {
  const { data } = await api.post<ApiSuccess<{ return: Return; order: Order }>>(
    `/orders/${orderId}/returns`,
    { items },
  );
  return data.data;
}

export async function listReturns(orderId: string) {
  const { data } = await api.get<ApiSuccess<Return[]>>(`/orders/${orderId}/returns`);
  return data.data;
}
