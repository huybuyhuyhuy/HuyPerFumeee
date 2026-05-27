import apiClient, { unwrapApiData } from './apiClient';
import type { OrderResponse, Product, User } from '../types';
import { normalizeOrder, normalizeOrderList, normalizeProductPage } from '../services/dataMappers';

export async function getAdminDashboard() {
  const { data } = await apiClient.get('/admin/dashboard');
  return unwrapApiData(data);
}

export async function getAdminReports(range = '30d') {
  const { data } = await apiClient.get('/admin/reports', { params: { range } });
  return unwrapApiData(data);
}

export async function getAdminProducts() {
  const { data } = await apiClient.get<Product[]>('/admin/products');
  return normalizeProductPage(unwrapApiData(data)).content;
}

export async function createAdminProduct(payload: Record<string, unknown>) {
  const { data } = await apiClient.post('/admin/products', payload);
  return data;
}

export async function updateAdminProduct(id: number, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(`/admin/products/${id}`, payload);
  return data;
}

export async function deleteAdminProduct(id: number) {
  const { data } = await apiClient.delete(`/admin/products/${id}`);
  return data;
}

export async function resetAdminProductStock(id: number) {
  const { data } = await apiClient.post(`/admin/products/${id}/reset-stock`);
  return data;
}

export async function getAdminOrders() {
  const { data } = await apiClient.get<{ listOrders: OrderResponse[] }>('/admin/orders');
  return normalizeOrderList(unwrapApiData(data));
}

export async function getAdminOrderDetail(id: number) {
  const { data } = await apiClient.get<OrderResponse>(`/admin/orders/${id}`);
  return normalizeOrder(unwrapApiData(data));
}

export async function updateAdminOrderStatus(id: number, status: string) {
  const { data } = await apiClient.put(`/admin/orders/${id}/status`, { status });
  return data;
}

export async function getAdminUsers() {
  const { data } = await apiClient.get<User[]>('/admin/users');
  return unwrapApiData(data);
}
