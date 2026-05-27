import { query } from '../../config/database.js';

let checkoutCapabilitiesPromise = null;

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

export async function getCheckoutStorageCapabilities() {
  if (!checkoutCapabilitiesPromise) {
    checkoutCapabilitiesPromise = (async () => {
      const [tables, cartColumns, cartItemColumns, orderColumns, orderItemColumns, variantColumns] = await Promise.all([
        query(`
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = 'dbo'
            AND TABLE_NAME IN ('carts', 'cart_items', 'inventory_reservations', 'inventory_transactions', 'product_variants')
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
}
