-- ============================================================================
-- Dashboard performance indexes
-- Target: SQL Server
-- Run: sqlcmd -S <server> -d <db> -i 001-dashboard-indexes.sql
-- ============================================================================

-- 1. orders: status + created_at (most dashboard queries filter on both)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_status_created_at' AND object_id = OBJECT_ID('orders'))
  CREATE INDEX IX_orders_status_created_at ON orders(status, created_at);

-- 2. orders: created_at (standalone date-range scans for chart queries)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_created_at' AND object_id = OBJECT_ID('orders'))
  CREATE INDEX IX_orders_created_at ON orders(created_at);

-- 3. orders: user_id (customer count queries: COUNT(DISTINCT user_id))
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_user_id' AND object_id = OBJECT_ID('orders'))
  CREATE INDEX IX_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;

-- 4. order_items: order_id (JOIN orders o ON o.id = oi.order_id)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_order_items_order_id' AND object_id = OBJECT_ID('order_items'))
  CREATE INDEX IX_order_items_order_id ON order_items(order_id);

-- 5. order_items: product_id (JOIN products p ON p.id = oi.product_id — top products)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_order_items_product_id' AND object_id = OBJECT_ID('order_items'))
  CREATE INDEX IX_order_items_product_id ON order_items(product_id);

-- 6. order_items: composite for top-products query (covers JOIN + SUM)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_order_items_product_quantity_price' AND object_id = OBJECT_ID('order_items'))
  CREATE INDEX IX_order_items_product_quantity_price ON order_items(product_id, order_id) INCLUDE (quantity, price_at_purchase);

-- 7. users: created_at (new-users-this-month and chart queries)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_users_created_at' AND object_id = OBJECT_ID('users'))
  CREATE INDEX IX_users_created_at ON users(created_at);

-- 8. users: role + status + deleted_at (user counting queries)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_users_role_status' AND object_id = OBJECT_ID('users'))
  CREATE INDEX IX_users_role_status ON users(role, status, deleted_at);

-- 9. products: status + deleted_at (nearly every product query)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_products_status_deleted' AND object_id = OBJECT_ID('products'))
  CREATE INDEX IX_products_status_deleted ON products(status, deleted_at);

-- 10. products: id_category (JOIN categories — top categories query)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_products_id_category' AND object_id = OBJECT_ID('products'))
  CREATE INDEX IX_products_id_category ON products(id_category);

-- 11. product_variants: product_id + deleted_at + status (low-stock variant counts)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_product_variants_product_status' AND object_id = OBJECT_ID('product_variants'))
  CREATE INDEX IX_product_variants_product_status ON product_variants(product_id, deleted_at, status, stock_quantity);
