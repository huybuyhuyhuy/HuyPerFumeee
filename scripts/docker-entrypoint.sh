#!/bin/sh
set -e

# Run database migrations if enabled
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  node -e "
    const fs = require('fs');
    const path = require('path');
    const { query } = require('./src/config/database.js');

    (async () => {
      // Create migration tracking table if not exists
      await query(\`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '_migrations')
          CREATE TABLE _migrations (
            id INT IDENTITY PRIMARY KEY,
            filename NVARCHAR(500) NOT NULL UNIQUE,
            executed_at DATETIME2 DEFAULT GETDATE()
          )
      \`);

      const migrationsDir = path.join(__dirname, 'migrations');
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const applied = await query('SELECT TOP 1 id FROM _migrations WHERE filename = ?', [file]);
        if (applied.length) {
          console.log('[migration] Skipping (already applied):', file);
          continue;
        }
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log('[migration] Applying:', file);
        await query(sql);
        await query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
        console.log('[migration] Applied:', file);
      }
      console.log('[migration] Done.');
      process.exit(0);
    })().catch(err => {
      console.error('[migration] Error:', err.message);
      process.exit(1);
    });
  "
fi

# Start the application
exec "${@}"
