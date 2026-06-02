import api, { unwrapApiData } from './api';

export type UserAddress = {
  id: number;
  userId?: number;
  label?: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  ward: string;
  district: string;
  city: string;
  country?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UserAddressPayload = Omit<UserAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

function asString(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value);
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function normalizeAddress(raw: any): UserAddress {
  return {
    id: Number(raw?.id || 0),
    userId: raw?.userId ?? raw?.user_id,
    label: asString(raw?.label),
    recipientName: asString(raw?.recipientName ?? raw?.recipient_name),
    phone: asString(raw?.phone),
    line1: asString(raw?.line1 ?? raw?.address),
    line2: asString(raw?.line2),
    ward: asString(raw?.ward),
    district: asString(raw?.district),
    city: asString(raw?.city),
    country: asString(raw?.country, 'VN'),
    postalCode: asString(raw?.postalCode ?? raw?.postal_code),
    isDefault: asBoolean(raw?.isDefault ?? raw?.is_default),
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? null,
  };
}

export function formatAddress(address: Partial<UserAddress>) {
  return [
    address.line1,
    address.ward,
    address.district,
    address.city,
  ].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
}

function normalizeAddressList(raw: any): UserAddress[] {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : [];
  return list.map(normalizeAddress).filter((address: UserAddress) => address.id);
}

export const addressService = {
  async list() {
    const { data } = await api.get('/user/addresses');
    return normalizeAddressList(unwrapApiData(data));
  },
  async create(payload: UserAddressPayload) {
    const { data } = await api.post('/user/addresses', payload);
    return normalizeAddress(unwrapApiData(data));
  },
  async update(id: number, payload: UserAddressPayload) {
    const { data } = await api.put(`/user/addresses/${id}`, payload);
    return normalizeAddress(unwrapApiData(data));
  },
  async remove(id: number) {
    const { data } = await api.delete(`/user/addresses/${id}`);
    return unwrapApiData(data);
  },
  async setDefault(id: number) {
    const { data } = await api.put(`/user/addresses/${id}/default`);
    return normalizeAddress(unwrapApiData(data));
  },
};
