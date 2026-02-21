# Implementation Plan: Fanslib Nitro Migration + Deploy Fix

> Erstellt: 2026-02-20 von Minh 🌿
> Status: Entwurf — Review durch Amelia ausstehend

## Problemanalyse

### Bug 1: `h3-v2` fehlt
TanStack Start nutzt Nitro/Vinxi unter der Haube. Der SSR-Build (`dist/server/server.js`) referenziert `h3-v2` als externe Dependency. Das aktuelle Deploy-Verfahren kopiert `dist/` + einen generierten `package.json` + `bun install` auf dem Server. Aber `h3-v2` wird vom Build als extern markiert und fehlt dann im `node_modules/` auf tsumetai.

**Root Cause:** Fanslib Web hat **kein** `app.config.ts` und keine Nitro-Konfiguration. Der Build produziert ein `dist/`-Verzeichnis das NICHT self-contained ist — es braucht `node_modules/` zur Laufzeit.

### Bug 2: `sql-wasm.wasm` hardcoded
TypeORM mit `type: "sqljs"` lädt `sql-wasm.wasm` via `sql.js`. Beim `bun build` des API-Servers wird der Pfad zur Build-Zeit aufgelöst und als absoluter Pfad `/workspace/projects/fanslib/node_modules/sql.js/dist/sql-wasm.wasm` eingebrannt. Auf tsumetai existiert dieser Pfad nicht.

**Root Cause:** `bun build` inlined den Pfad. Es gibt keine Konfiguration die den WASM-Pfad zur Laufzeit auflöst.

## Architektur-Entscheidungen

### AD-1: Web → Nitro-Preset `bun` für self-contained Output
TanStack Start baut auf Vinxi/Nitro. Mit dem richtigen Preset produziert `vite build` ein `.output/`-Verzeichnis mit `server/index.mjs` das alle Dependencies gebundelt enthält. Kein `bun install` auf dem Server nötig.

**Referenz:** Mission Control macht genau das — `bun .output/server/index.mjs` und fertig.

### AD-2: API Server → `bun build` mit WASM als mitgeliefertes Asset
Statt den WASM-Pfad zur Build-Zeit einzubraten: Die `sql-wasm.wasm`-Datei als Asset neben das Bundle kopieren und zur Laufzeit relativ auflösen. Alternative: `locateFile`-Callback in sql.js konfigurieren.

### AD-3: Kein Docker mehr für Deployment
Das alte `deploy.sh` nutzt Docker. Das neue Deployment läuft direkt auf tsumetai via PM2 + rsync (wie Mission Control). Das ist bereits teilweise umgesetzt (siehe `HOW-TO-DEPLOY.md`), aber die Builds sind kaputt.

### AD-4: Zwei getrennte Build-Artefakte
- **Web:** `.output/` (Nitro, self-contained)
- **API:** `dist/` (bun bundle + WASM asset)

Beide werden separat deployt und von PM2 als getrennte Prozesse gemanaged.

---

## Schritt 1: `app.config.ts` erstellen für Nitro (~10 Min)

- **Dateien:** `@fanslib/apps/web/app.config.ts` (neu)
- **Was:**
  ```ts
  import { defineConfig } from '@tanstack/react-start/config'

  export default defineConfig({
    server: {
      preset: 'bun',
    },
  })
  ```
- **Warum:** TanStack Start nutzt Vinxi → Nitro. Ohne `app.config.ts` wird kein Nitro-Preset gesetzt und der Build produziert kein self-contained `.output/`.
- **Akzeptanzkriterium:** `bun run build` im Web-Package produziert `.output/server/index.mjs`

## Schritt 2: `vite.config.ts` anpassen (~10 Min)

- **Dateien:** `@fanslib/apps/web/vite.config.ts`
- **Was:**
  - Den `/api`-Proxy aus der Vite-Config entfernen (nur für Dev relevant, aber sicherstellen dass er nur im Dev-Server aktiv ist)
  - Ggf. `ssr.external` und `optimizeDeps` Einstellungen prüfen — mit Nitro-Bundling sollten diese nicht mehr nötig sein
  - **ACHTUNG:** Mission Control hat `patchProcessEnv()` Plugin — prüfen ob Fanslib das auch braucht (TanStack Start Version vergleichen)
- **Akzeptanzkriterium:** Build läuft ohne Fehler durch

## Schritt 3: `package.json` Scripts anpassen (~5 Min)

- **Dateien:** `@fanslib/apps/web/package.json`
- **Was:**
  ```json
  {
    "scripts": {
      "build": "vite build",
      "start": "bun .output/server/index.mjs"
    }
  }
  ```
  - `server.ts` wird nicht mehr gebraucht — Nitro erzeugt seinen eigenen Server
  - Der `/api`-Proxy muss in Nitro/Caddy konfiguriert werden (siehe Schritt 6)
- **Akzeptanzkriterium:** `bun run start` startet den SSR-Server auf dem konfigurierten Port

## Schritt 4: API Server — WASM-Pfad fixen (~20 Min)

- **Dateien:**
  - `@fanslib/apps/server/src/lib/db.ts`
  - `@fanslib/apps/server/package.json` (build script)
- **Was:**
  1. TypeORM sql.js DataSource um `sqlJsConfig` erweitern mit `locateFile`-Callback:
     ```ts
     import { readFileSync } from 'fs'
     import { join, dirname } from 'path'
     import { fileURLToPath } from 'url'

     // Resolve WASM relative to the running script
     const __dirname = dirname(fileURLToPath(import.meta.url))
     const wasmPath = process.env.SQL_WASM_PATH
       || join(__dirname, 'sql-wasm.wasm')
     ```
  2. TypeORM DataSource config `extra` bzw. `driver` Option nutzen um `wasmBinary` mitzugeben:
     ```ts
     import initSqlJs from 'sql.js'

     // In der DataSource config:
     {
       type: "sqljs",
       driver: await initSqlJs({
         wasmBinary: readFileSync(wasmPath),
       }),
       // ...
     }
     ```
  3. **Alternative (einfacher):** Env-Variable `SQL_WASM_PATH` die auf tsumetai gesetzt wird. Die WASM-Datei wird beim Deploy mit-rsync'd.

  4. Build-Script anpassen um WASM-Datei zu kopieren:
     ```json
     "build": "bun build ./src/index.ts --outdir ./dist --target bun --external playwright --external playwright-core --external ffprobe-static --external fluent-ffmpeg && cp ../../node_modules/sql.js/dist/sql-wasm.wasm ./dist/"
     ```

- **Akzeptanzkriterium:** API-Server startet mit `bun dist/index.js` und kann die DB öffnen, ohne dass `/workspace/...` im Pfad auftaucht.

## Schritt 5: API Server — Restliche Externals prüfen (~10 Min)

- **Dateien:** `@fanslib/apps/server/package.json`
- **Was:**
  - Aktuell werden `playwright`, `playwright-core`, `ffprobe-static`, `fluent-ffmpeg` als `--external` markiert
  - `sharp` fehlt in der External-Liste — prüfen ob es mit-gebundelt wird oder Probleme macht (native addon!)
  - `sharp` und `playwright` brauchen auf tsumetai ein `bun install` mit minimalem `package.json` (nur diese zwei)
  - Alternativ: `sharp` auch als external markieren und als binary auf tsumetai vorinstallieren
- **Akzeptanzkriterium:** API-Bundle + externe Deps starten sauber auf tsumetai

## Schritt 6: Nitro API-Proxy konfigurieren (~10 Min)

- **Dateien:** `@fanslib/apps/web/app.config.ts` oder Caddy-Config
- **Was:**
  - Die alte `server.ts` hatte einen `/api`-Proxy zu `localhost:7500`
  - **Option A (empfohlen):** Caddy übernimmt das Routing:
    ```
    fanslib.deepblush.garden {
      handle /api/* {
        reverse_proxy localhost:7500
      }
      handle {
        reverse_proxy localhost:7000
      }
    }
    ```
  - **Option B:** Nitro `routeRules` in `app.config.ts`:
    ```ts
    server: {
      preset: 'bun',
      routeRules: {
        '/api/**': { proxy: 'http://localhost:7500/**' }
      }
    }
    ```
  - Option A ist besser — klare Trennung, Caddy macht das sowieso schon
- **Akzeptanzkriterium:** Requests an `/api/*` landen beim API-Server

## Schritt 7: GHA Deploy-Workflow erstellen (~20 Min)

- **Dateien:** `.github/workflows/deploy-production.yml` (neu)
- **Was:** Basierend auf Mission Control's Workflow, aber mit zwei Artefakten:
  ```yaml
  - name: Build Web
    run: bun run --filter @fanslib/web build

  - name: Build API
    run: bun run --filter @fanslib/server build

  - name: Deploy Web
    run: |
      rsync -avz --delete \
        @fanslib/apps/web/.output/ \
        $HOST:$DEPLOY_PATH/web/

  - name: Deploy API
    run: |
      rsync -avz --delete \
        @fanslib/apps/server/dist/ \
        $HOST:$DEPLOY_PATH/api/
      # Copy WASM file
      # Copy minimal package.json for sharp/playwright

  - name: Restart Services
    run: |
      ssh $HOST "/var/www/scripts/deploy.sh fanslib production"
  ```
- **Unterschiede zu Mission Control:**
  - Zwei Build-Targets (web + api)
  - API braucht `bun install` auf Server für native deps (sharp, playwright)
  - Zwei PM2-Prozesse
- **Akzeptanzkriterium:** Push auf `main` → automatisches Deploy beider Services

## Schritt 8: PM2 + Start-Scripts anpassen (~10 Min)

- **Dateien:**
  - `/var/www/apps/fanslib/production/current/start-web.sh`
  - `/var/www/apps/fanslib/production/current/start-api.sh`
- **Was:**
  - Web: `cd /var/www/apps/fanslib/production/current/web && bun .output/server/index.mjs`
    → Einfacher: `PORT=7000 bun server/index.mjs` (Nitro liest PORT)
  - API: `cd /var/www/apps/fanslib/production/current/api && bun index.js`
  - ENV-Variablen: `PORT`, `API_PORT`, `APPDATA_PATH`, `LIBRARY_PATH`, `SQL_WASM_PATH`
- **Akzeptanzkriterium:** PM2 startet beide Prozesse, Health-Check OK

## Schritt 9: Lokal testen (~15 Min)

- **Was:**
  1. `cd @fanslib/apps/web && bun run build` → `.output/` entsteht
  2. `PORT=6969 bun .output/server/index.mjs` → Web erreichbar
  3. `cd @fanslib/apps/server && bun run build` → `dist/index.js` + `dist/sql-wasm.wasm`
  4. `APPDATA_PATH=... LIBRARY_PATH=... bun dist/index.js` → API erreichbar
  5. Web → `/api/...` → API antwortet (via Vite-Proxy im Dev bzw. manuell testen)
- **Akzeptanzkriterium:** Beide Services starten lokal aus ihren Build-Artefakten

## Schritt 10: Deploy auf tsumetai (~15 Min)

- **Was:** Manuelles erstes Deploy zum Verifizieren:
  1. rsync Web `.output/` → tsumetai
  2. rsync API `dist/` → tsumetai
  3. `bun install` auf tsumetai für native deps (sharp, playwright)
  4. PM2 restart
  5. Smoke-Test: `curl https://fanslib.deepblush.garden`
- **Akzeptanzkriterium:** Beide Services laufen, keine `h3-v2` oder `sql-wasm.wasm` Fehler

---

## Risiken & Offene Fragen

1. **TanStack Start + Nitro Kompatibilität:** Fanslib nutzt `@tanstack/react-start@1.131.50`, Mission Control nutzt `1.159.5`. Die Nitro-Integration könnte sich zwischen Versionen unterscheiden. → Testen!

2. **`@fanslib/server` als Workspace-Dependency im Web:** Das Web-Package hat `@fanslib/server: workspace:*` als Dependency. Wenn Nitro bundelt, muss das korrekt aufgelöst werden. Falls Nitro das nicht kann → Server-Package vorher bauen und aus `dist/` importieren.

3. **`sharp` native Binary:** `sharp` nutzt native Bindings. Auf tsumetai muss `bun install` laufen für die korrekten Binaries. Das ist der einzige Grund warum der API-Server noch ein `bun install` braucht.

4. **`reflect-metadata`:** TypeORM braucht `reflect-metadata` und Decorator-Support. Prüfen ob `bun build` das korrekt handhabt.

5. **API-Proxy:** Aktuell macht der Web-Server den `/api`-Proxy. Nach der Migration muss Caddy das übernehmen. → Caddy-Config updaten (Astrid).

---

## Zusammenfassung

| Vorher | Nachher |
|--------|---------|
| Web: `dist/` + `node_modules/` + `server.ts` | Web: `.output/` self-contained |
| API: `dist/index.js` + hardcoded WASM | API: `dist/index.js` + `dist/sql-wasm.wasm` |
| Deploy: rsync + `bun install` + Fehler | Deploy: rsync + PM2 restart |
| `h3-v2` fehlt | ✅ gebundelt in `.output/` |
| `sql-wasm.wasm` ENOENT | ✅ relativ aufgelöst |
