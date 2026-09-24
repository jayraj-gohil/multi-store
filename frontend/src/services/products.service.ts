import type { ApiSuccess } from '../types/api';
import type { AvailableProduct, Product } from '../types/domain';
import { api } from './api';

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

export async function listProductsAdmin() {
  const { data } = await api.get<ApiSuccess<Product[]>>('/admin/products');
  return data.data;
}

export async function createProduct(input: CreateProductInput) {
  const { data } = await api.post<ApiSuccess<Product>>('/admin/products', input);
  return data.data;
}

export async function updateProduct(id: string, input: Partial<CreateProductInput & { isActive: boolean }>) {
  const { data } = await api.patch<ApiSuccess<Product>>(`/admin/products/${id}`, input);
  return data.data;
}

export async function listAvailableProducts() {
  const { data } = await api.get<ApiSuccess<AvailableProduct[]>>('/products');
  return data.data;
}

/** Uploads an image file and returns its URL — pass that URL as CreateProductInput.imageUrl. */
export async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post<ApiSuccess<{ url: string }>>('/admin/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.url;
}
