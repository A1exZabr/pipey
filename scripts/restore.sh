#!/bin/bash
set -euo pipefail

BACKUP_FILE=${1:-""}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup_filename>"
  echo "Available backups:"
  mc alias set minio "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" --api S3v4
  mc ls minio/backups/postgres/
  exit 1
fi

echo "Downloading ${BACKUP_FILE}..."
mc cp "minio/backups/postgres/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}"

echo "Restoring database..."
gunzip -c "/tmp/${BACKUP_FILE}" | psql "$DATABASE_URL"

rm "/tmp/${BACKUP_FILE}"
echo "Restore completed"
