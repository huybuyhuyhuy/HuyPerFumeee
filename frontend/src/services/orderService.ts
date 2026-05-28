import api, { unwrapApiData } from './api';
import { normalizeOrder, normalizeOrderList } from './dataMappers';

export const orderService = {
  async checkout(payload: { shippingAddress: string; phone: string; paymentMethod: string }) {
    const { data } = await api.post('/orders/checkout', payload);
    return normalizeOrder(unwrapApiData(data));
  },
  async createMomoPayment(orderId: number) {
    const { data } = await api.post('/payment/momo/create', { orderId });
    return unwrapApiData(data);
  },
  async createZaloPayPayment(orderId: number) {
    const { data } = await api.post('/payment/zalopay/create', { orderId });
    return unwrapApiData(data);
  },
  async getUserOrders() {
    const { data } = await api.get('/orders/history');
    return normalizeOrderList(unwrapApiData(data));
  },
  async getOrder(id: number) {
    const { data } = await api.get(`/orders/${id}`);
    return normalizeOrder(unwrapApiData(data));
  },
  async cancelOrder(id: number, note?: string) {
    const { data } = await api.put(`/orders/${id}/cancel`, note ? { note } : {});
    return unwrapApiData(data);
  },
};
