#!/bin/sh
set -e

echo "⏳ Waiting for database..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is up!"

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🚀 Starting backend server..."
exec node dist/main.js
