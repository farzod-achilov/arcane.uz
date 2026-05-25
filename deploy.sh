#!/bin/bash
set -e
cd /var/www/arcane

echo "==> Pulling latest..."
git fetch origin main
git stash || true
git reset --hard origin/main

echo "==> Installing deps..."
npm ci

echo "==> Building Next.js..."
npm run build

echo "==> Restarting Next.js..."
pm2 restart arcane

echo "Done! https://arcane.com.uz"
