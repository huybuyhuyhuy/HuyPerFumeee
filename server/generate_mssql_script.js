import mysql from 'mysql2/promise';
import { writeFileSync } from 'fs';

const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'huyperfume',
};

const TABLES = [
  { name: 'categories',     cols: ['id', 'name'] },
  { name: 'brand',          cols: ['id', 'name', 'status'] },
  { name: 'users',          cols: ['id', 'name', 'email', 'phone', 'password', 'address', 'role', 'dob', 'created_at'] },
  { name: 'products',       cols: ['id', 'sku', 'batch_code', 'name', 'price', 'image', 'description', 'scent_notes', 'is_decant', 'status', 'id_category', 'id_brand', 'stock', 'discount_price', 'volume_ml', 'created_at'] },
  { name: 'orders',         cols: ['id', 'user_id', 'total', 'shipping_address', 'phone', 'payment_method', 'momo_order_id', 'momo_trans_id', 'zalopay_app_trans_id', 'status', 'created_at'] },
  { name: 'order_items',    cols: ['id', 'order_id', 'product_id', 'quantity', 'price', 'selected_batch_code', 'price_at_purchase', 'status'] },
  { name: 'wishlist',       cols: ['id', 'user_id', 'product_id', 'created_at'] },
];

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') {
    if (Number.isFinite(val)) return String(val);
    return 'NULL';
  }
  if (val instanceof Date) {
    const s = val.toISOString().slice(0, 19).replace('T', ' ');
    return `'${s}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `'${val.toString('hex')}'`;
  }
  const escaped = String(val).replace(/'/g, "''");
  return `N'${escaped}'`;
}

async function generate() {
  console.log('Connecting to MySQL...');
  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  console.log('Connected.\n');

  let sql = '';

  for (const table of TABLES) {
    console.log(`Reading ${table.name}...`);
    const [rows] = await mysqlConn.execute(`SELECT * FROM \`${table.name}\``);
    console.log(`  Found ${rows.length} rows.`);

    if (rows.length === 0) continue;

    const colList = table.cols.join(', ');

    // Clear existing + enable identity insert
    sql += `\n-- ${table.name}\n`;
    sql += `DELETE FROM dbo.${table.name};\n`;
    sql += `SET IDENTITY_INSERT dbo.${table.name} ON;\n`;

    // Insert in batches of 100 rows
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const values = batch.map(row =>
        `(${table.cols.map(c => esc(row[c])).join(', ')})`
      ).join(',\n');
      sql += `INSERT INTO dbo.${table.name} (${colList}) VALUES\n${values};\n`;
    }

    sql += `SET IDENTITY_INSERT dbo.${table.name} OFF;\n`;
  }

  await mysqlConn.end();

  writeFileSync('D:\\Java1\\ThePerfumeShop\\migrate_data.sql', sql, 'utf8');
  console.log('\nGenerated migrate_data.sql');
}

generate().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
