# HRL Academy Core — VPS Deployment Instructions

## Problem
The frontend (Vercel) sends API requests to `course-hub.hardbanrecordslab.online` via `vercel.json` rewrites, but the VPS backend returns 404 for all routes. The Express `server.ts` (which has all 47 API routes) is not running on port 9104.

## Solution
SSH into the VPS and deploy the Express server.ts as the `course-hub` PM2 process.

## SSH Commands (run from your local terminal)

### Step 1: SSH into VPS
```bash
ssh -i C:\Users\HRL\.ssh\id_ed25519 root@84.247.162.167
```

### Step 2: Check current course-hub process
```bash
pm2 list
pm2 logs course-hub --lines 20
```

### Step 3: Navigate to Academy backend directory
```bash
cd /var/www/hrl-core-2.0/apps-source-mvp/HRL-Academy-Core
```

### Step 4: Pull latest changes (includes CORS fix)
```bash
cd /var/www/hrl-core-2.0
git pull origin main
cd apps-source-mvp/HRL-Academy-Core
```

### Step 5: Install dependencies and build
```bash
npm install
npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs
```

### Step 6: Restart PM2 process
```bash
pm2 stop course-hub 2>/dev/null; pm2 delete course-hub 2>/dev/null
PORT=9104 pm2 start dist/server.cjs --name course-hub --cwd /var/www/hrl-core-2.0/apps-source-mvp/HRL-Academy-Core
pm2 save
```

### Step 7: Verify
```bash
curl -s http://localhost:9104/api/auth/me | head -20
```

Expected: JSON response (not 404)

### Step 8: Also verify Nginx is forwarding correctly
```bash
curl -s -o /dev/null -w "HTTP %{http_code}" "https://course-hub.hardbanrecordslab.online/api/auth/me"
```

Expected: HTTP 401 (unauthorized) — NOT 404

## If git pull fails (diverged branches)
```bash
cd /var/www/hrl-core-2.0
git fetch origin main
git reset --hard origin/main
```

## If Nginx config needs updating
```bash
# Copy the updated Nginx config
cp /var/www/hrl-core-2.0/apps-source-mvp/nginx/hrl-audio-proxy.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx