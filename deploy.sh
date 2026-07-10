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

# No --accept-data-loss: a destructive schema change must fail the deploy
# (old app keeps running) and be handled by hand, not silently drop columns.
echo "==> Applying Prisma schema..."
npx prisma db push

# Build into a staging dir while the old app keeps serving traffic.
# Only after a successful build do we stop, swap and restart — a broken
# build leaves the old version running instead of taking the site down.
echo "==> Building Next.js (staging dir, app keeps running)..."
rm -rf .next-staging
NEXT_DIST_DIR=.next-staging npm run build

echo "==> Swapping build and restarting..."
pm2 stop arcane || true
rm -rf .next
mv .next-staging .next
pm2 restart arcane || pm2 start ecosystem.config.js

echo "==> Health check..."
sleep 3
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || echo "000")
echo "localhost:3000 -> HTTP $CODE"
case "$CODE" in
  200|302|307) echo "Done! https://arcane.com.uz" ;;
  *) echo "App not healthy (HTTP $CODE). Check: pm2 logs arcane --err"; exit 1 ;;
esac
