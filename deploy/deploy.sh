#!/usr/bin/env bash
# ARCANE.UZ — deploy / update script. Run on the server from the project root:
#   cd /var/www/arcane && ./deploy/deploy.sh
#
# Idempotent: pull → install → prisma → (stop → build → start). Safe to re-run.
#
# WHY stop before build: `next build` regenerates .next in place. If `next start`
# is still running, it reads a half-written .next/prerender-manifest.json, crashes
# with ENOENT and PM2 restarts it in a loop for the whole build (~1-2 min of 500s).
# We take the app down only for the build+start window — everything slow (pull,
# npm ci, prisma) runs first while the old build keeps serving.
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
# Schema-first project (no migrations folder). db push applies prisma/schema.prisma
# without dropping data. If you switch to versioned migrations later, replace with:
#   npx prisma migrate deploy
npx prisma db push

# ── Downtime window starts ───────────────────────────────────────────────────
echo "▶ 5/6 Building (app stopped to avoid .next corruption)…"
# NEXT_PUBLIC_* are inlined from the env files (.env.local / .env.production*) here.
RUNNING=0
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  RUNNING=1
  pm2 stop "$PM2_NAME"
fi

npm run build

echo "▶ 6/6 Starting app…"
if [ "$RUNNING" -eq 1 ]; then
  pm2 start "$PM2_NAME" --update-env
else
  pm2 start ecosystem.config.js
  pm2 save
fi
# ── Downtime window ends ─────────────────────────────────────────────────────

echo "▶ Health check…"
sleep 3
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || echo "000")
if echo "$CODE" | grep -qE "200|307|302"; then
  echo "✓ Deploy complete — app responding ($CODE). Logs: pm2 logs $PM2_NAME"
else
  echo "✗ App not healthy (HTTP $CODE). Check: pm2 logs $PM2_NAME --err"
  exit 1
fi
