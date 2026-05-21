import mysql from 'mysql2/promise';
import sql from 'mssql';

const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'huyperfume',
};

const MSSQL_CONFIG = {
  server: 'localhost',
  database: 'huyperfume',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    trustedConnection: true,
  }
};

// Tables in dependency order (parents first, children last)
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
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'number') {
    if (Number.isFinite(val)) return val;
    return 'NULL';
  }
  if (val instanceof Date) {
    const s = val.toISOString().slice(0, 19).replace('T', ' ');
    return `'${s}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `'${val.toString('hex')}'`;
  }
  // string
  const escaped = String(val).replace(/'/g, "''");
  return `N'${escaped}'`;
}

async function migrate() {
  console.log('=== Migrating MySQL -> SQL Server ===\n');

  console.log('[1/3] Connecting to MySQL...');
  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  console.log('  MySQL connected.');

  console.log('[2/3] Connecting to SQL Server...');
  await sql.connect(MSSQL_CONFIG);
  console.log('  SQL Server connected.\n');

  const pool = sql;

  for (const table of TABLES) {
    console.log(`[3/7] Migrating ${table.name}...`);

    const [countRows] = await mysqlConn.execute(`SELECT COUNT(*) AS cnt FROM \`${table.name}\``);
    const count = countRows[0].cnt;
    console.log(`  Found ${count} rows in MySQL.`);

    if (count === 0) {
      console.log(`  Skipping (no data).\n`);
      continue;
    }

    const [rows] = await mysqlConn.execute(`SELECT * FROM \`${table.name}\``);

    const colList = table.cols.join(', ');

    // Enable IDENTITY_INSERT
    await pool.query(`SET IDENTITY_INSERT dbo.${table.name} ON`);

    // Batch insert (100 rows per INSERT)
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const values = batch.map(row =>
        `(${table.cols.map(c => esc(row[c])).join(', ')})`
      ).join(',\n');

      const stmt = `INSERT INTO dbo.${table.name} (${colList}) VALUES ${values}`;
      await pool.query(stmt);
      console.log(`  Inserted ${Math.min(i + BATCH, rows.length)}/${count}`);
    }

    await pool.query(`SET IDENTITY_INSERT dbo.${table.name} OFF`);
    console.log(`  ${table.name} done!\n`);
  }

  await mysqlConn.end();
  await sql.close();
  console.log('=== Migration complete! ===');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
