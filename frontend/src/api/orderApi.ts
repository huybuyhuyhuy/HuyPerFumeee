import apiClient, { unwrapApiData } from './apiClient';
import type { OrderResponse } from '../types';
import { normalizeOrder, normalizeOrderList } from '../services/dataMappers';

export async function checkoutOrder(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<{ data: OrderResponse }>('/orders/checkout', payload);
  return normalizeOrder(unwrapApiData(data));
}

export async function getOrderHistory() {
  const { data } = await apiClient.get<{ data: OrderResponse[] }>('/orders/history');
  return normalizeOrderList(unwrapApiData(data));
}

export async function getOrderDetail(id: number) {
  const { data } = await apiClient.get<{ data: OrderResponse }>(`/orders/${id}`);
  return normalizeOrder(unwrapApiData(data));
}

export async function cancelOrder(id: number) {
  const { data } = await apiClient.put(`/orders/${id}/cancel`);
  return data;
}
