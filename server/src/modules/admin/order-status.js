const ORDER_STATUS = {
  // Current English values in DB
  WAITING: 'Waiting',
  PAID: 'Paid',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',

  // Vietnamese (legacy data / manual admin updates)
  GIAO_HANG_THANH_CONG: 'Giao hàng thành công',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao',
  DA_HUY: 'Đã hủy',

  // Future standardized (forward-compatible)
  PENDING_TITLE: 'Pending',
  PROCESSING_TITLE: 'Processing',
  SHIPPED_TITLE: 'Shipped',
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED_LOWER: 'delivered',
  COMPLETED_LOWER: 'completed',
  CANCELLED_LOWER: 'cancelled',
  FAILED_TITLE: 'Failed',
  FAILED: 'failed',
  REFUNDED_TITLE: 'Refunded',
  REFUNDED: 'refunded',

  // Non-order
  CART: 'Cart',
};

const STATUS_GROUPS = {
  // Revenue = payment received AND delivery completed.
  // Excludes 'Đã xác nhận' (confirmed, possibly unpaid) and 'Đang giao' (in transit).
  REVENUE: [
    ORDER_STATUS.PAID,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.GIAO_HANG_THANH_CONG,
    ORDER_STATUS.DELIVERED_LOWER,
    ORDER_STATUS.COMPLETED_LOWER,
  ],

  // Orders in flight — not completed, not cancelled, not refunded
  PENDING: [
    ORDER_STATUS.WAITING,
    ORDER_STATUS.DA_XAC_NHAN,
    ORDER_STATUS.DANG_GIAO,
    ORDER_STATUS.PENDING_TITLE,
    ORDER_STATUS.PROCESSING_TITLE,
    ORDER_STATUS.SHIPPED_TITLE,
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
  ],

  // Terminal completed states
  COMPLETED_MAPPING: [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.GIAO_HANG_THANH_CONG,
    ORDER_STATUS.DELIVERED_LOWER,
    ORDER_STATUS.COMPLETED_LOWER,
  ],

  // Cancelled at any stage
  CANCELLED_OR_FAILED: [
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.DA_HUY,
    ORDER_STATUS.CANCELLED_LOWER,
    ORDER_STATUS.FAILED_TITLE,
    ORDER_STATUS.FAILED,
  ],

  // Refunded orders
  REFUNDED: [
    ORDER_STATUS.REFUNDED_TITLE,
    ORDER_STATUS.REFUNDED,
  ],

  // Statuses that are not real orders
  EXCLUDED_NON_ORDERS: [
    ORDER_STATUS.CART,
  ],
};

// All statuses that represent a valid (non-cart, non-cancelled, non-refunded) order
STATUS_GROUPS.VALID_ORDERS = dedupe([
  ...STATUS_GROUPS.REVENUE,
  ...STATUS_GROUPS.PENDING,
]);

// All non-valid statuses (cart + cancelled + failed + refunded)
STATUS_GROUPS.CANCELLED_REFUNDED_FAILED = dedupe([
  ...STATUS_GROUPS.EXCLUDED_NON_ORDERS,
  ...STATUS_GROUPS.CANCELLED_OR_FAILED,
  ...STATUS_GROUPS.REFUNDED,
]);

function dedupe(arr) {
  return [...new Set(arr)];
}

/**
 * Build comma-separated `?` placeholders for parameterized IN clauses.
 * @param {string[]} statuses
 * @returns {string} e.g. "?, ?, ?"
 */
function sqlInClause(statuses) {
  return statuses.map(() => '?').join(', ');
}

export { ORDER_STATUS, STATUS_GROUPS, sqlInClause };
