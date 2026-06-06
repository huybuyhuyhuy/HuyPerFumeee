import api, { unwrapApiData } from './api';

export type AdminReviewStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export interface AdminReview {
  id: number;
  productId: number;
  userId: number;
  orderId?: number | null;
  rating: number;
  title: string;
  comment: string;
  status: Exclude<AdminReviewStatus, 'ALL'>;
  verifiedPurchase: boolean;
  isVerifiedPurchase: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  moderatedBy?: number | null;
  moderatedAt?: string | null;
  productName?: string;
  productImage?: string;
  userName?: string;
  userEmail?: string;
}

export interface AdminReviewDetail extends AdminReview {
  moderationNote?: string;
  product?: { id: number; name: string; image?: string };
  user?: { id: number; name: string; email?: string };
}

export interface AdminReviewListParams {
  page?: number;
  pageSize?: number;
  status?: AdminReviewStatus;
  productId?: number | '';
  rating?: number | '';
}

export interface AdminReviewListResponse {
  content: AdminReview[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value);
}

function normalizeReview(raw: any): AdminReview {
  return {
    id: asNumber(raw?.id),
    productId: asNumber(raw?.productId ?? raw?.product_id),
    userId: asNumber(raw?.userId ?? raw?.user_id),
    orderId: raw?.orderId ?? raw?.order_id ?? null,
    rating: asNumber(raw?.rating),
    title: asString(raw?.title),
    comment: asString(raw?.comment),
    status: asString(raw?.status, 'PENDING') as AdminReview['status'],
    verifiedPurchase: Boolean(raw?.verifiedPurchase ?? raw?.isVerifiedPurchase ?? raw?.orderId ?? raw?.order_id),
    isVerifiedPurchase: Boolean(raw?.isVerifiedPurchase ?? raw?.verifiedPurchase ?? raw?.orderId ?? raw?.order_id),
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? null,
    moderatedBy: raw?.moderatedBy ?? raw?.moderated_by ?? null,
    moderatedAt: raw?.moderatedAt ?? raw?.moderated_at ?? null,
    productName: asString(raw?.productName ?? raw?.product_name),
    productImage: asString(raw?.productImage ?? raw?.product_image),
    userName: asString(raw?.userName ?? raw?.user_name),
    userEmail: asString(raw?.userEmail ?? raw?.user_email),
  };
}

function normalizeDetail(raw: any): AdminReviewDetail {
  const review = normalizeReview(raw);
  return {
    ...review,
    moderationNote: asString(raw?.moderationNote ?? raw?.moderation_note),
    product: raw?.product
      ? { id: asNumber(raw.product.id), name: asString(raw.product.name), image: asString(raw.product.image) }
      : undefined,
    user: raw?.user
      ? { id: asNumber(raw.user.id), name: asString(raw.user.name), email: asString(raw.user.email) }
      : undefined,
  };
}

export async function getAdminReviews(params: AdminReviewListParams = {}) {
  const { data } = await api.get('/admin/reviews', { params });
  const payload = unwrapApiData<any>(data);
  return {
    ...payload,
    content: Array.isArray(payload?.content) ? payload.content.map(normalizeReview) : [],
  } as AdminReviewListResponse;
}

export async function getAdminReviewDetail(id: number) {
  const { data } = await api.get(`/admin/reviews/${id}`);
  return normalizeDetail(unwrapApiData<any>(data));
}

export async function moderateReview(id: number, status: 'APPROVED' | 'REJECTED' | 'FLAGGED', note = '') {
  const { data } = await api.put(`/reviews/${id}/moderation`, { status, note });
  return unwrapApiData<any>(data);
}

export async function hideReview(id: number) {
  const { data } = await api.delete(`/reviews/${id}`);
  return unwrapApiData<any>(data);
}
