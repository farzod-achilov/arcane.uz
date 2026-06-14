#!/usr/bin/env bash
# ARCANE.UZ — deploy / update script. Run on the server from the project root:
#   cd /var/www/arcane && ./deploy/deploy.sh
#
# Idempotent: pull → install → prisma → build → restart. Safe to re-run.
set -euo pipefail

APP_DIR="/var/www/arcane"
PM2_NAME="arcane"

cd "$APP_DIR"

echo "▶ 1/6 Pulling latest code…"
git pull --ff-only origin main

echo "▶ 2/6 Installing dependencies (npm ci)…"
npm ci

echo "▶ 3/6 Generating Prisma client…"
npx prisma generate

echo "▶ 4/6 Syncing database schema (prisma db push)…"
# This project is schema-first (no migrations folder). db push applies
# prisma/schema.prisma to the database without dropping data.
# If you switch to versioned migrations later, replace with:
#   npx prisma migrate deploy
npx prisma db push

echo "▶ 5/6 Building (next build)…"
# NEXT_PUBLIC_* are read from .env.production.local at build time.
npm run build

echo "▶ 6/6 Restarting PM2 process…"
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env
else
  pm2 start ecosystem.config.js
  pm2 save
fi

echo "✓ Deploy complete. Check: pm2 logs $PM2_NAME"
