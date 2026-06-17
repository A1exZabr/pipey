#!/usr/bin/env bash
# rebuild.sh — rebuild and restart Pipey CRM with a single command
set -euo pipefail

echo "=== Pipey CRM: Rebuild ==="

# Stop the containers
echo "[1/4] Stopping containers..."
docker compose down

# Rebuild the images
echo "[2/4] Rebuilding images..."
docker compose build --no-cache backend frontend

# Start everything
echo "[3/4] Starting..."
docker compose up -d

# Show the status
echo "[4/4] Status:"
docker compose ps

echo ""
echo "=== Done ==="
echo "Frontend: ${HOST_URL:-http://localhost}:3100"
echo "Backend:  ${HOST_URL:-http://localhost}:3101"
