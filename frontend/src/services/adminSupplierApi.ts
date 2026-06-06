import api, { unwrapApiData } from './api';

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  representativeName?: string;
  phone: string;
  email: string;
  address?: string;
  note?: string;
  status: SupplierStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  totalReceipts?: number;
  totalImportValue?: number;
  lastImportDate?: string | null;
}

export interface SupplierPayload {
  supplierName: string;
  representativeName?: string;
  phone: string;
  email: string;
  address?: string;
  note?: string;
  status: SupplierStatus;
}

export interface SupplierListParams {
  search?: string;
  status?: SupplierStatus | 'ALL';
  sortBy?: 'SupplierName' | 'CreatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SupplierPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SupplierListResponse {
  items: Supplier[];
  pagination: SupplierPagination;
}

export interface SupplierDetailResponse {
  supplier: Supplier;
  summary: {
    totalReceipts: number;
    totalImportValue: number;
    lastImportDate: string | null;
  };
  histories: Array<{
    historyId: number;
    actionType: string;
    oldValue?: string | null;
    newValue?: string | null;
    updatedBy?: number | null;
    updatedByName?: string;
    updatedAt?: string | null;
  }>;
}

export interface SupplierStatistics {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  totalImportValue: number;
  topSuppliersByImportValue: Array<{
    supplierId: number;
    supplierName: string;
    totalImportValue: number;
  }>;
  supplierImportValues?: Array<{
    supplierId: number;
    supplierName: string;
    totalImportValue: number;
  }>;
  monthlyImportValues: Array<{
    month: string;
    totalValue: number;
  }>;
}

export interface SupplierImportResult {
  totalRows: number;
  successRows: number;
  failedRows: number;
  limitedErrors?: boolean;
  errors: Array<{
    row: number;
    supplierName?: string;
    errors: string[];
  }>;
}

export async function getSuppliers(params: SupplierListParams = {}) {
  const { data } = await api.get('/admin/suppliers', { params });
  return unwrapApiData<SupplierListResponse>(data);
}

export async function getSupplierStatistics() {
  const { data } = await api.get('/admin/suppliers/statistics');
  return unwrapApiData<SupplierStatistics>(data);
}

export async function getSupplierDetail(id: number) {
  const { data } = await api.get(`/admin/suppliers/${id}`);
  return unwrapApiData<SupplierDetailResponse>(data);
}

export async function createSupplier(payload: SupplierPayload) {
  const { data } = await api.post('/admin/suppliers', payload);
  return unwrapApiData<Supplier>(data);
}

export async function updateSupplier(id: number, payload: SupplierPayload) {
  const { data } = await api.put(`/admin/suppliers/${id}`, payload);
  return unwrapApiData<Supplier>(data);
}

export async function deleteSupplier(id: number) {
  const { data } = await api.delete(`/admin/suppliers/${id}`);
  return unwrapApiData<{ supplier: Supplier }>(data);
}

export async function exportSuppliersExcel(params: SupplierListParams = {}) {
  const { data } = await api.get('/admin/suppliers/export/excel', {
    params,
    responseType: 'blob',
  });
  return data as Blob;
}

export async function exportSuppliersPdf(params: SupplierListParams = {}) {
  const { data } = await api.get('/admin/suppliers/export/pdf', {
    params,
    responseType: 'blob',
  });
  return data as Blob;
}

export async function importSuppliersExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/admin/suppliers/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrapApiData<SupplierImportResult>(data);
}
