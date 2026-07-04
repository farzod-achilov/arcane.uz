#!/bin/bash
set -e
cd /var/www/arcane

echo "==> Pulling latest..."
git fetch origin main
git stash || true
git reset --hard origin/main

echo "==> Installing deps..."
npm ci --ignore-scripts

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Applying Prisma schema..."
npx prisma db push --accept-data-loss || true

# Stop before build: `next build` regenerates .next in place. A running
# `next start` reads the half-written prerender-manifest.json, crashes with
# ENOENT and PM2 restart-loops it for the whole build (~1-2 min of 500s).
echo "==> Building Next.js (app stopped to avoid .next corruption)..."
pm2 stop arcane || true
rm -rf .next
npm run build

echo "==> Starting Next.js..."
pm2 restart arcane || pm2 start ecosystem.config.js

echo "==> Health check..."
sleep 3
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || echo "000")
echo "localhost:3000 -> HTTP $CODE"
case "$CODE" in
  200|302|307) echo "Done! https://arcane.com.uz" ;;
  *) echo "App not healthy (HTTP $CODE). Check: pm2 logs arcane --err"; exit 1 ;;
esac
