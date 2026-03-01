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

echo "Syncing web..."
rsync -avz --delete -e "ssh $SSH_OPTS" \
  @fanslib/apps/web/dist/ \
  "$DEPLOY_HOST:$DEPLOY_ROOT/production/current/web/"

echo "Syncing API..."
rsync -avz --delete -e "ssh $SSH_OPTS" \
  @fanslib/apps/server/dist/ \
  "$DEPLOY_HOST:$DEPLOY_ROOT/production/current/api/"

echo "Copying .env and restarting PM2..."
ssh $SSH_OPTS "$DEPLOY_HOST" "
  export PATH=\"\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH\"
  cp $DEPLOY_ROOT/production/.env $DEPLOY_ROOT/production/current/.env
  pm2 restart fanslib-web fanslib-api
  pm2 save
"

echo "Validating..."
ssh $SSH_OPTS "$DEPLOY_HOST" "
  export PATH=\"\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH\"
  pm2 list
  curl -sfI http://localhost:7000 > /dev/null && echo 'Web: OK' || echo 'Web: FAIL'
  curl -sf http://localhost:7500/health > /dev/null && echo 'API: OK' || echo 'API: FAIL'
"

echo "Done."
