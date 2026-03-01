# Fanslib — How to Deploy

## Variables (set these for your environment)

| Variable | Example | Description |
|----------|---------|-------------|
| `DEPLOY_HOST` | `user@hostname` | SSH target (user@host or host from ~/.ssh/config) |
| `DEPLOY_ROOT` | `/var/www/apps/fanslib` | Root of deploy directory on server |
| `APPDATA_PATH` | `/mnt/data/fanslib` | Persistent data (DB, uploads) |
| `LIBRARY_SOURCE` | `/path/to/your/media/library` | Source path for library symlink |
| `YOUR_DOMAIN` | `fanslib.example.com` | Public domain for Caddy |
| `BUILD_WORKSPACE` | `/workspace/projects/fanslib` | Local build workspace (where you run `bun run build`) |
| `SQL_WASM_SERVER_PATH` | *(see Known Issues)* | Path on server where sql-wasm.wasm must live (hardcoded in bundle) |

## Architecture

| Component | Port | Description |
|-----------|------|-------------|
| Web (TanStack Start) | 7000 | Frontend + SSR |
| API (Hono/Bun) | 7500 | Backend API |
| Caddy | 80 | Reverse proxy → 7000 |

## Port Schema

| Environment | Web | API |
|-------------|-----|-----|
| Production | 7000 | 7500 |
| Preview pr-1 | 7001 | 7501 |
| Preview pr-2 | 7002 | 7502 |

## Directory Structure on Server

```
$DEPLOY_ROOT/
├── production/
│   ├── .env                    ← ENV config (not in repo)
│   └── current/
│       ├── .env                ← Copy of production/.env
│       ├── start-web.sh        ← PM2 wrapper (sources .env)
│       ├── start-api.sh        ← PM2 wrapper (sources .env)
│       ├── web/                ← TanStack Start build output
│       │   ├── server/server.js
│       │   ├── client/
│       │   ├── node_modules/
│       │   └── package.json
│       └── api/                ← Hono API build output
│           ├── index.js
│           ├── node_modules/
│           └── package.json

$APPDATA_PATH/
├── library → $LIBRARY_SOURCE   (symlink)
└── (DB, uploads, etc.)
```

**Note:** The API bundle has a hardcoded path to `sql-wasm.wasm`. See Known Issues.

## ENV Variables

`$DEPLOY_ROOT/production/.env`:
```env
PORT=7000
API_URL=http://localhost:7500
API_PORT=7500
APPDATA_PATH=/path/to/appdata
LIBRARY_PATH=/path/to/appdata/library
NODE_ENV=production
TZ=Europe/Berlin
```

## Deploy Steps

**Prerequisite:** SSH key-based auth to deploy host. Export the variables above before running (or use a deploy script).

**Quick deploy:** Copy `scripts/deploy.env.example` to `scripts/deploy.env`, fill in your values, then run `bun run deploy`.

**Deploy with React dev mode** (better console errors for debugging): `BUILD_DEV=1 bun run deploy`

### 1. Build

```bash
cd $BUILD_WORKSPACE
bun run build
```

**React development mode** (full error messages, warnings, component stacks in console):

```bash
BUILD_DEV=1 bun run build
# or
bun run build:dev
```

Build output:
- Web: `@fanslib/apps/web/dist/` (client + server dirs)
- API: `@fanslib/apps/server/dist/index.js`

### 2. rsync to server

```bash
cd $BUILD_WORKSPACE

# Web
rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" \
  @fanslib/apps/web/dist/ \
  $DEPLOY_HOST:$DEPLOY_ROOT/production/current/web/

# API
rsync -avz --delete -e "ssh -o StrictHostKeyChecking=no" \
  @fanslib/apps/server/dist/ \
  $DEPLOY_HOST:$DEPLOY_ROOT/production/current/api/

# sql.js WASM (if bundle has hardcoded path - see Known Issues)
rsync -e "ssh -o StrictHostKeyChecking=no" \
  node_modules/sql.js/dist/sql-wasm.wasm \
  $DEPLOY_HOST:$SQL_WASM_SERVER_PATH
```

### 3. Copy ENV + Restart PM2

```bash
ssh -o StrictHostKeyChecking=no $DEPLOY_HOST '
  export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
  cp '"$DEPLOY_ROOT"'/production/.env '"$DEPLOY_ROOT"'/production/current/.env
  pm2 restart fanslib-web fanslib-api
  pm2 save
'
```

### 4. Validate

```bash
ssh -o StrictHostKeyChecking=no $DEPLOY_HOST '
  export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
  pm2 list
  curl -sI http://localhost:7000
  curl -s http://localhost:7500/health
  curl -sI http://localhost:80 -H "Host: '"$YOUR_DOMAIN"'"
'
```

## PM2 Processes

| Name | Script | CWD |
|------|--------|-----|
| fanslib-web | start-web.sh (→ bun run server.js) | .../current/web/server |
| fanslib-api | start-api.sh (→ bun run index.js) | .../current/api |

Start scripts source `.env` before running bun.

## Caddy Config

In `/etc/caddy/Caddyfile`:
```caddyfile
http://your-domain.com {
    reverse_proxy localhost:7000
}
```

After changes: `sudo systemctl reload caddy`

## Rollback

```bash
pm2 stop fanslib-web fanslib-api
# Deploy previous version (rsync old build), then:
pm2 restart fanslib-web fanslib-api
pm2 save
```

## Known Issues

- **sql.js WASM path**: The API bundle may have a hardcoded path to `sql-wasm.wasm`. If so, that file must exist on the server at the exact path the bundle expects. This should be fixed in the build config.
- **API /api proxy**: The web server doesn't proxy `/api` to the API server. The API is only accessible directly on port 7500. Client-side code should use `API_URL` env var.
- **Web runtime deps**: TanStack Start SSR doesn't fully bundle deps. `node_modules` must be installed in the web deploy dir. The `package.json` there lists all needed runtime deps including `h3-v2` (aliased to `npm:h3@2.0.0-beta.4`).

## First-Time Setup

1. Symlink: `ln -s "$LIBRARY_SOURCE" $APPDATA_PATH/library`
2. Directories: `mkdir -p $DEPLOY_ROOT/production/current`
3. Caddy: Add fanslib block to Caddyfile + reload
4. Playwright: `bunx playwright install chromium && sudo bunx playwright install-deps chromium`
5. Web deps: `cd $DEPLOY_ROOT/production/current/web && bun install`
6. API deps: `cd $DEPLOY_ROOT/production/current/api && bun add sharp playwright playwright-core ffprobe-static fluent-ffmpeg`
