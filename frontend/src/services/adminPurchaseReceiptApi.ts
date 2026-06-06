import api, { unwrapApiData } from './api';

export type PurchaseReceiptStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseReceiptListItem {
  purchaseReceiptId: number;
  receiptCode: string;
  supplierId: number;
  supplierCode?: string;
  supplierName: string;
  importDate: string | null;
  totalQuantity: number;
  totalAmount: number;
  note?: string;
  status: PurchaseReceiptStatus;
  createdBy?: number | null;
  createdByName?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PurchaseReceiptItem {
  purchaseReceiptItemId: number;
  purchaseReceiptId: number;
  productId: number;
  productName: string;
  productSku?: string;
  variantId: number | null;
  variantSku?: string;
  variantLabel?: string;
  variantType?: string;
  quantity: number;
  importPrice: number;
  totalPrice: number;
  note?: string;
  createdAt?: string | null;
}

export interface PurchaseReceiptDetailResponse {
  receipt: PurchaseReceiptListItem;
  supplier: {
    supplierId: number;
    supplierCode: string;
    supplierName: string;
    representativeName?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: PurchaseReceiptItem[];
}

export interface PurchaseReceiptPayload {
  supplierId: number;
  importDate?: string;
  note?: string;
  items: Array<{
    productId: number;
    variantId?: number | null;
    quantity: number;
    importPrice: number;
    note?: string;
  }>;
}

export interface PurchaseReceiptListParams {
  search?: string;
  supplierId?: number | '';
  status?: PurchaseReceiptStatus | '';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'ReceiptCode' | 'ImportDate' | 'TotalAmount' | 'SupplierName' | 'CreatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PurchaseReceiptPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PurchaseReceiptListResponse {
  items: PurchaseReceiptListItem[];
  pagination: PurchaseReceiptPagination;
}

export interface PurchaseReceiptStatistics {
  totalReceipts: number;
  totalImportValue: number;
  totalImportedQuantity: number;
  currentMonthReceipts: number;
  topImportedProducts: Array<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalValue: number;
  }>;
  topSuppliers: Array<{
    supplierId: number;
    supplierName: string;
    totalReceipts: number;
    totalValue: number;
  }>;
  monthlyImportValues: Array<{
    month: string;
    totalValue: number;
    totalReceipts: number;
  }>;
}

export interface ReceiptProductOption {
  productId: number;
  name: string;
  sku?: string;
  image?: string;
  price: number;
  stock: number;
  variants: Array<{
    variantId: number;
    sku?: string;
    volumeLabel?: string;
    variantType?: string;
    stockQuantity: number;
  }>;
}

export async function getPurchaseReceipts(params: PurchaseReceiptListParams = {}) {
  const { data } = await api.get('/admin/purchase-receipts', { params });
  return unwrapApiData<PurchaseReceiptListResponse>(data);
}

export async function getPurchaseReceiptStatistics() {
  const { data } = await api.get('/admin/purchase-receipts/statistics');
  return unwrapApiData<PurchaseReceiptStatistics>(data);
}

export async function getPurchaseReceiptDetail(id: number) {
  const { data } = await api.get(`/admin/purchase-receipts/${id}`);
  return unwrapApiData<PurchaseReceiptDetailResponse>(data);
}

export async function createPurchaseReceipt(payload: PurchaseReceiptPayload) {
  const { data } = await api.post('/admin/purchase-receipts', payload);
  return unwrapApiData<PurchaseReceiptDetailResponse>(data);
}

export async function updatePurchaseReceipt(id: number, payload: { importDate?: string; note?: string }) {
  const { data } = await api.put(`/admin/purchase-receipts/${id}`, payload);
  return unwrapApiData<PurchaseReceiptDetailResponse>(data);
}

export async function cancelPurchaseReceipt(id: number) {
  const { data } = await api.post(`/admin/purchase-receipts/${id}/cancel`);
  return unwrapApiData<PurchaseReceiptDetailResponse>(data);
}

export async function deletePurchaseReceipt(id: number) {
  const { data } = await api.delete(`/admin/purchase-receipts/${id}`);
  return unwrapApiData<PurchaseReceiptDetailResponse>(data);
}

export async function getReceiptProductOptions(params: { search?: string; limit?: number } = {}) {
  const { data } = await api.get('/admin/purchase-receipts/products', { params });
  return unwrapApiData<ReceiptProductOption[]>(data);
}
