#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pipey_backup_${TIMESTAMP}.sql.gz"
BUCKET="backups/postgres"

echo "Starting PostgreSQL backup..."
pg_dump "$DATABASE_URL" | gzip > "/tmp/${BACKUP_FILE}"

echo "Uploading to MinIO..."
mc alias set minio "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" --api S3v4
mc mb --ignore-existing "minio/${BUCKET}"
mc cp "/tmp/${BACKUP_FILE}" "minio/${BUCKET}/${BACKUP_FILE}"

echo "Cleaning old backups (>30 days)..."
mc rm --recursive --older-than 30d "minio/${BUCKET}/" || true

rm "/tmp/${BACKUP_FILE}"
echo "Backup completed: ${BACKUP_FILE}"
