import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDbPool, query } from '../src/config/database.js';

const migrationPaths = process.argv.slice(2);

if (migrationPaths.length === 0) {
  console.error('Usage: node scripts/run-sql-migration.js <migration.sql> [...]');
  process.exit(1);
}

async function closePool() {
  try {
    const pool = await getDbPool();
    if (pool && typeof pool.close === 'function') {
      await pool.close();
    }
  } catch {
    // Keep the original migration error when cleanup cannot connect.
  }
}

async function runMigration(filePath) {
  const absolutePath = resolve(process.cwd(), filePath);
  const sql = readFileSync(absolutePath, 'utf8');
  const batches = sql
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);

  console.log(`Applying ${filePath} (${batches.length} batches)`);
  for (const batch of batches) {
    await query(batch);
  }
}

async function main() {
  try {
    for (const migrationPath of migrationPaths) {
      await runMigration(migrationPath);
    }
    console.log('Migration completed successfully.');
  } finally {
    await closePool();
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
});
