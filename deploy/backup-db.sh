#!/usr/bin/env bash
# ARCANE.UZ — daily Postgres backup: pg_dump -> gzip, with rotation.
# Runs on the server via cron (see crontab -e):
#   30 3 * * * /var/www/arcane/deploy/backup-db.sh >> /var/log/arcane/backup.log 2>&1
#
# Postgres runs natively on this VPS (not in Docker, unlike the wb_bot
# project's backup script this one mirrors) — arcanedb is dumped directly
# as the `postgres` system user via sudo, no app DB password needed.
#
# Local-disk backup only: protects against a bad migration/query/accidental
# DROP, NOT against VPS/disk failure. For that, periodically copy
# $BACKUP_DIR off-box (e.g. rclone to object storage) — not set up yet.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/root/arcane_backups}"
KEEP="${KEEP:-14}"
PGDB="${PGDB:-arcanedb}"

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/arcanedb_${TS}.sql.gz"

sudo -u postgres pg_dump "$PGDB" | gzip > "$FILE"

echo "Backup saved: $FILE ($(du -h "$FILE" | cut -f1))"

# ротация: оставляем последние $KEEP файлов
ls -1t "$BACKUP_DIR"/arcanedb_*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
