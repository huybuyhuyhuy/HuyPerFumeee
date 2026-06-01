import { query } from '../../config/database.js';

let checkoutCapabilitiesPromise = null;
let orderVoucherColumnsPromise = null;

function toColumnSet(rows) {
  return new Set(rows.map((row) => String(row.COLUMN_NAME || row.column_name || '').toLowerCase()));
}

function toTableSet(rows) {
  return new Set(rows.map((row) => String(row.TABLE_NAME || row.table_name || '').toLowerCase()));
}

async function tableColumns(tableName) {
  return query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ?`,
    [tableName]
  );
}

async function ensureOrderVoucherColumns() {
  if (!orderVoucherColumnsPromise) {
    orderVoucherColumnsPromise = query(`
      IF OBJECT_ID(N'dbo.orders', N'U') IS NOT NULL
      BEGIN
        IF COL_LENGTH(N'dbo.orders', N'order_subtotal') IS NULL
          ALTER TABLE dbo.orders ADD order_subtotal FLOAT NULL;
        IF COL_LENGTH(N'dbo.orders', N'voucher_id') IS NULL
          ALTER TABLE dbo.orders ADD voucher_id INT NULL;
        IF COL_LENGTH(N'dbo.orders', N'voucher_code') IS NULL
          ALTER TABLE dbo.orders ADD voucher_code NVARCHAR(50) NULL;
        IF COL_LENGTH(N'dbo.orders', N'voucher_discount_type') IS NULL
          ALTER TABLE dbo.orders ADD voucher_discount_type NVARCHAR(20) NULL;
        IF COL_LENGTH(N'dbo.orders', N'voucher_discount_value') IS NULL
          ALTER TABLE dbo.orders ADD voucher_discount_value FLOAT NULL;
        IF COL_LENGTH(N'dbo.orders', N'voucher_discount_amount') IS NULL
          ALTER TABLE dbo.orders ADD voucher_discount_amount FLOAT NULL;
      END
    `);
    orderVoucherColumnsPromise = orderVoucherColumnsPromise.catch((error) => {
      orderVoucherColumnsPromise = null;
      throw error;
    });
  }
  return orderVoucherColumnsPromise;
}

export async function getCheckoutStorageCapabilities() {
  if (!checkoutCapabilitiesPromise) {
    checkoutCapabilitiesPromise = (async () => {
      await ensureOrderVoucherColumns();
      const [tables, cartColumns, cartItemColumns, orderColumns, orderItemColumns, variantColumns] = await Promise.all([
        query(`
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = 'dbo'
            AND TABLE_NAME IN ('carts', 'cart_items', 'inventory_reservations', 'inventory_transactions', 'product_variants', 'product_batches')
        `),
        tableColumns('carts'),
        tableColumns('cart_items'),
        tableColumns('orders'),
        tableColumns('order_items'),
        tableColumns('product_variants'),
      ]);

      const tableSet = toTableSet(tables);
      const cartColumnSet = toColumnSet(cartColumns);
      const cartItemColumnSet = toColumnSet(cartItemColumns);
      const hasCartCoreColumns = cartColumnSet.has('id') && cartColumnSet.has('user_id');
      const hasCartItemCoreColumns = cartItemColumnSet.has('cart_id') &&
        cartItemColumnSet.has('product_id') &&
        cartItemColumnSet.has('quantity');

      return {
        hasDurableCart: tableSet.has('carts') && tableSet.has('cart_items') && hasCartCoreColumns && hasCartItemCoreColumns,
        hasInventoryReservations: tableSet.has('inventory_reservations'),
        hasInventoryTransactions: tableSet.has('inventory_transactions'),
        hasVariants: tableSet.has('product_variants'),
        hasProductBatches: tableSet.has('product_batches'),
        cartColumns: cartColumnSet,
        cartItemColumns: cartItemColumnSet,
        orderColumns: toColumnSet(orderColumns),
        orderItemColumns: toColumnSet(orderItemColumns),
        variantColumns: toColumnSet(variantColumns),
      };
    })();
  }

  return checkoutCapabilitiesPromise;
}

export function hasColumn(columns, name) {
  return columns.has(String(name).toLowerCase());
}

export function resetCheckoutStorageCapabilitiesForTests() {
  checkoutCapabilitiesPromise = null;
  orderVoucherColumnsPromise = null;
}
