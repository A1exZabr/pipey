#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting MinIO bucket mirror..."
mc alias set minio "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" --api S3v4
mc mirror minio/uploads "minio/backups/minio/${TIMESTAMP}/" --overwrite

echo "Cleaning old mirrors (>30 days)..."
mc rm --recursive --older-than 30d "minio/backups/minio/" || true

echo "MinIO backup completed"
