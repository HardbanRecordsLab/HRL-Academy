#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# HRL Academy Core — VPS Deployment Script
# Deploy Express server.ts as course-hub backend on port 9104
# Run from VPS after uploading this directory
# ═══════════════════════════════════════════════════════════════

set -e

DEPLOY_DIR="/var/www/hrl-core-2.0/apps-source-mvp/HRL-Academy-Core"
PM2_NAME="course-hub"
PORT=9104

echo "=== HRL Academy Core VPS Deployment ==="
echo ""

# 1. Navigate to deployment directory
cd "$DEPLOY_DIR" || { echo "ERROR: Directory $DEPLOY_DIR not found!"; exit 1; }

echo "[1/6] Installing dependencies..."
npm install --production=false

echo "[2/6] Building server bundle..."
npx esbuild server.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --packages=external \
  --outfile=dist/server.cjs

echo "[3/6] Stopping old PM2 process..."
pm2 stop "$PM2_NAME" 2>/dev/null || true
pm2 delete "$PM2_NAME" 2>/dev/null || true

echo "[4/6] Starting new PM2 process..."
PORT=$PORT pm2 start dist/server.cjs \
  --name "$PM2_NAME" \
  --cwd "$DEPLOY_DIR"

echo "[5/6] Saving PM2 process list..."
pm2 save

echo "[6/6] Verifying..."
sleep 2
curl -s -o /dev/null -w "HTTP %{http_code}" "http://localhost:$PORT/api/auth/me" && echo " ✓ API responding" || echo " ✗ API NOT responding"

echo ""
echo "=== Deployment complete ==="
echo "Backend: http://localhost:$PORT"
echo "Domain:  https://course-hub.hardbanrecordslab.online"
echo ""
echo "To check logs: pm2 logs $PM2_NAME"
echo "To check status: pm2 status"