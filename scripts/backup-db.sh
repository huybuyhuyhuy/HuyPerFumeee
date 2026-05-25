#!/bin/bash
# HuyPerfume SQL Server Backup Script
# Usage: ./scripts/backup-db.sh
# Schedule: 0 2 * * * /opt/huyperfume/scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/huyperfume}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-1433}"
DB_NAME="${DB_NAME:-huyperfume}"
DB_USER="${DB_USER:-sa}"
DB_PASSWORD="${DB_PASSWORD:-}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.bak"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of $DB_NAME to $BACKUP_FILE"

if command -v sqlcmd &>/dev/null; then
  sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -C \
    -Q "BACKUP DATABASE [$DB_NAME] TO DISK = N'$BACKUP_FILE' WITH FORMAT, COMPRESSION, STATS = 10"
elif command -v mssql-cli &>/dev/null; then
  mssql-cli -S "$DB_HOST" -U "$DB_USER" -P "$DB_PASSWORD" \
    -Q "BACKUP DATABASE [$DB_NAME] TO DISK = N'$BACKUP_FILE' WITH FORMAT, COMPRESSION"
else
  echo "ERROR: Neither sqlcmd nor mssql-cli found. Install mssql-tools18."
  exit 1
fi

echo "[$(date)] Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Rotate old backups — keep last N days
find "$BACKUP_DIR" -name "${DB_NAME}_*.bak" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Rotated backups older than ${RETENTION_DAYS} days"

# Optional: sync to remote storage with rclone
# rclone copy "$BACKUP_DIR" remote:huyperfume-backups --include "*.bak"

echo "[$(date)] Backup routine finished."
