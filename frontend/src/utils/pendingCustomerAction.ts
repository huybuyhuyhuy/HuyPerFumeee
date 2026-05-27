import type { Product } from '../types';

const PENDING_CUSTOMER_ACTION_KEY = 'huyperfume:pending-customer-action';

export type PendingCustomerAction =
  | {
      type: 'cart';
      productId: number;
      quantity?: number;
      variantId?: number | string | null;
      returnTo: string;
    }
  | {
      type: 'wishlist';
      product: Product;
      returnTo: string;
    };

export function getCurrentPath(location: { pathname: string; search: string; hash: string }) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function savePendingCustomerAction(action: PendingCustomerAction) {
  sessionStorage.setItem(PENDING_CUSTOMER_ACTION_KEY, JSON.stringify(action));
}

export function consumePendingCustomerAction(): PendingCustomerAction | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CUSTOMER_ACTION_KEY);
    sessionStorage.removeItem(PENDING_CUSTOMER_ACTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    sessionStorage.removeItem(PENDING_CUSTOMER_ACTION_KEY);
    return null;
  }
}
