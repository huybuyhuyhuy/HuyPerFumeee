#!/bin/bash
# HuyPerfume Migration Runner
# Idempotent — tracks applied migrations in _migrations table.
# Usage: ./scripts/migrate.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/../server/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "ERROR: Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-1433}"
DB_NAME="${DB_NAME:-huyperfume}"
DB_USER="${DB_USER:-sa}"
DB_PASSWORD="${DB_PASSWORD:-}"

SQLCMD_BIN="sqlcmd"
if ! command -v "$SQLCMD_BIN" &>/dev/null; then
  SQLCMD_BIN="mssql-cli"
  if ! command -v "$SQLCMD_BIN" &>/dev/null; then
    echo "ERROR: sqlcmd or mssql-cli required (install mssql-tools18)"
    exit 1
  fi
fi

export SQLCMDPASSWORD="$DB_PASSWORD"

run_sql() {
  if [ "$SQLCMD_BIN" = "sqlcmd" ]; then
    sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -C -d "$DB_NAME" -b -Q "$1"
  else
    mssql-cli -S "$DB_HOST" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -Q "$1"
  fi
}

run_sql_file() {
  if [ "$SQLCMD_BIN" = "sqlcmd" ]; then
    sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -C -d "$DB_NAME" -b -i "$1"
  else
    mssql-cli -S "$DB_HOST" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -i "$1"
  fi
}

echo "[migrate] Ensuring _migrations tracking table..."
run_sql "
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '_migrations')
BEGIN
  CREATE TABLE _migrations (
    id INT IDENTITY PRIMARY KEY,
    filename NVARCHAR(500) NOT NULL UNIQUE,
    executed_at DATETIME2 DEFAULT GETDATE()
  );
END
"

echo "[migrate] Running pending migrations..."
for file in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  filename=$(basename "$file")
  applied=$(run_sql "SELECT COUNT(*) AS cnt FROM _migrations WHERE filename = '$filename'" | tail -n 3 | head -n 1 | tr -d ' ')
  if [ "$applied" != "0" ] && [ -n "$applied" ]; then
    echo "[skip] $filename"
    continue
  fi
  echo "[run]  $filename"
  run_sql_file "$file"
  run_sql "INSERT INTO _migrations (filename) VALUES ('$filename')"
  echo "[ok]   $filename"
done

echo "[migrate] Done."
