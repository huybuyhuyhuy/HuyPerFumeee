/**
 * Run dashboard index migrations against the configured database.
 * Usage: node src/db/run-migrations.js
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, getDbPool } from '../config/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function run() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    // Split by GO (SQL Server batch separator) or treat as one batch
    const batches = sql
      .split(/^\s*GO\s*$/im)
      .map((b) => b.trim())
      .filter(Boolean);

    console.log(`Running migration: ${file} (${batches.length} batch(es))`);
    for (const batch of batches) {
      try {
        await query(batch);
      } catch (err) {
        // If the error is about duplicate index, that's OK
        if (err.message && err.message.includes('already exists')) {
          console.log(`  (index already exists, skipping)`);
        } else {
          console.error(`  Error: ${err.message}`);
        }
      }
    }
    console.log(`  Done.`);
  }

  const pool = await getDbPool();
  await pool.close();
  console.log('All migrations complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
