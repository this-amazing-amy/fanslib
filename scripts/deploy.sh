#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$REPO_ROOT/scripts/deploy.env" ]; then
  set -a
  source "$REPO_ROOT/scripts/deploy.env"
  set +a
fi

DEPLOY_HOST="${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. user@tsumetai)}"
DEPLOY_ROOT="${DEPLOY_ROOT:?Set DEPLOY_ROOT (e.g. /var/www/apps/fanslib)}"
YOUR_DOMAIN="${YOUR_DOMAIN:-fanslib.example.com}"

SSH_OPTS="-o StrictHostKeyChecking=no"

echo "Building..."
cd "$REPO_ROOT"
if [ -n "${BUILD_DEV:-}" ]; then
  echo "Using React development mode (BUILD_DEV=1)"
  bun run build:dev
else
  bun run build
fi

echo "Copying server.ts to dist..."
cp "$REPO_ROOT/@fanslib/apps/web/server.ts" "$REPO_ROOT/@fanslib/apps/web/dist/server.ts"

echo "Syncing web..."
rsync -avz --delete -e "ssh $SSH_OPTS" \
  @fanslib/apps/web/dist/ \
  "$DEPLOY_HOST:$DEPLOY_ROOT/production/current/web/"

echo "Syncing web package.json (production, workspace refs stripped)..."
python3 - << 'PYEOF' > /tmp/fanslib-web-package.json
import json, sys
with open("@fanslib/apps/web/package.json") as f:
    pkg = json.load(f)
for section in ["dependencies", "devDependencies", "peerDependencies"]:
    if section in pkg:
        pkg[section] = {k: v for k, v in pkg[section].items() if not v.startswith("workspace:")}
pkg.pop("devDependencies", None)
print(json.dumps(pkg, indent=2))
PYEOF
rsync -avz -e "ssh $SSH_OPTS" \
  /tmp/fanslib-web-package.json \
  "$DEPLOY_HOST:$DEPLOY_ROOT/production/current/web/package.json"

echo "Syncing API..."
rsync -avz --delete -e "ssh $SSH_OPTS" \
  @fanslib/apps/server/dist/ \
  "$DEPLOY_HOST:$DEPLOY_ROOT/production/current/api/"

echo "Copying .env, writing start-web.sh and restarting PM2..."
ssh $SSH_OPTS "$DEPLOY_HOST" '
  export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
  cp /var/www/apps/fanslib/production/.env /var/www/apps/fanslib/production/current/.env

  cd /var/www/apps/fanslib/production/current/web
  bun install --production

  cd /var/www/apps/fanslib/production/current/api
  bun install --production

  printf '"'"'#!/bin/bash\nset -a\nsource /var/www/apps/fanslib/production/.env\nset +a\ncd /var/www/apps/fanslib/production/current/web/.output\nexec ~/.bun/bin/bun run /var/www/apps/fanslib/production/current/web/server.ts\n'"'"' > /var/www/apps/fanslib/production/current/start-web.sh
  chmod +x /var/www/apps/fanslib/production/current/start-web.sh

  pm2 restart fanslib-web --update-env
  pm2 restart fanslib-api --update-env
  pm2 save
'

echo "Validating..."
ssh $SSH_OPTS "$DEPLOY_HOST" "
  export PATH=\"\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH\"
  pm2 list
  curl -sfI http://localhost:7000 > /dev/null && echo 'Web: OK' || echo 'Web: FAIL'
  curl -sf http://localhost:7500/health > /dev/null && echo 'API: OK' || echo 'API: FAIL'
"

echo "Done."
