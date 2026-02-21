# Fanslib Deployment Setup — Tsumetai

> Updated: 2026-02-20 (v2 — nach Amelias Klärungen)

## Finales Setup-Design

```
Domain: fanslib.deepblush.garden
├── /        → Web (Port 6969, via PORT env)
└── /api     → API (Port 6970 → API_PORT env)

Daten auf Tsumetai:
├── /mnt/shares/appdata/fanslib/          ← Prod-Daten
│   ├── fanslib.sqlite                     ← Haupt-DB (4MB) ← ✅ DIE AKTIVE DB
│   ├── fansly-credentials.json            ← Auth tokens
│   ├── settings.json                      ← App settings
│   ├── thumbnails/                        ← 967 Thumbnails
│   ├── browser/                           ← Playwright browser data
│   ├── data/fanslib.sqlite                ← ❌ NICHT aktiv (alt/seed)
│   └── library → /mnt/shares/Archive/Amy/Kreativ - NSFW/Content  ← Symlink (empfohlen)
│
├── /mnt/shares/appdata/fanslib-backup/              ← DB + Credentials Backup
├── /mnt/shares/appdata/fanslib-backup-complete-20260220/  ← Vollständiges Backup
│
└── /var/www/apps/fanslib/production/     ← NEU: App-Code + State
    └── data/                              ← Migrierte Daten
```

---

## Backups ✅

### Backup 1: Kritische Dateien
**Pfad:** `/mnt/shares/appdata/fanslib-backup/`
```
fanslib.sqlite          (4.0 MB)
fanslib-data.sqlite     (272 KB, aus data/)
fansly-credentials.json
settings.json
```

### Backup 2: Kompletter Ordner
**Pfad:** `/mnt/shares/appdata/fanslib-backup-complete-20260220/`
```
Vollständige Kopie von /mnt/shares/appdata/fanslib/ (32 MB)
Inkl. thumbnails/ (967 Dateien), git/, browser/
```

---

## DB Klärung ✅

**Die aktive DB ist `/mnt/shares/appdata/fanslib/fanslib.sqlite`** (4 MB, im Root).

Die DB in `data/fanslib.sqlite` (272 KB) ist **nicht** die aktive — vermutlich eine alte/seed DB.

→ `APPDATA_PATH` muss auf den Root zeigen, nicht auf `data/`.

---

## API URL: Mit UND ohne Caddy

### Requirement
Die App soll in beiden Szenarien funktionieren:
- **Mit Caddy:** `fanslib.deepblush.garden` → path-basiertes Routing (`/api/*`)
- **Ohne Caddy:** Direkt `localhost:6969` (Web) + `localhost:6970` (API)

### Analyse der Optionen

| | Option A: Runtime Config | Option B: SSR ENV | Option C: Single Server |
|--|--|--|--|
| **Beschreibung** | Server injiziert `window.__CONFIG__.apiUrl` ins HTML | SSR liest ENV zur Laufzeit, rendert korrekte URLs | API-Routes im Web-Server (Proxy oder Mount) |
| **Mit Caddy** | ✅ `apiUrl = ""` (relativ) | ✅ `apiUrl = ""` | ✅ Automatisch |
| **Ohne Caddy** | ✅ `apiUrl = "http://localhost:6970"` | ✅ Gleich | ✅ Automatisch |
| **Build-unabhängig** | ✅ Ja | ✅ Ja | ✅ Ja |
| **Komplexität** | ⭐⭐ Gering — Script-Tag im HTML | ⭐⭐ Gering — SSR Template | ⭐⭐⭐ Mittel — Proxy-Logic |
| **Client-Side Routing** | ✅ Funktioniert | ⚠️ Nur bei SSR-Seiten | ✅ Funktioniert |
| **CORS** | ⚠️ Nötig ohne Caddy | ⚠️ Nötig ohne Caddy | ✅ Kein CORS nötig |

### Empfehlung: **Option C — Single Server mit Proxy**

**Der Web-Server proxied `/api` zum API-Server.**

```ts
// apps/web/server.ts
import { createProxyMiddleware } from 'http-proxy-middleware';

const API_URL = process.env.API_URL || 'http://localhost:6970';

app.use('/api', createProxyMiddleware({
  target: API_URL,
  pathRewrite: { '^/api': '' },
}));
```

**Warum Option C?**

1. **Ein Port nach außen** — egal ob mit oder ohne Caddy
2. **Kein CORS** — alle Requests gehen über denselben Origin
3. **Keine Client-Config nötig** — Frontend nutzt einfach relative URLs (`/api/...`)
4. **Caddy optional** — ohne Caddy: `localhost:6969` hat alles. Mit Caddy: einfaches `reverse_proxy localhost:6969`
5. **Relative URLs im Frontend** — `backendBaseUrl = ''`, fertig

**Trade-off:** Minimal mehr Load auf dem Web-Server (Proxy), aber bei dieser App-Größe irrelevant.

### Caddy-Config (vereinfacht mit Option C)

```caddyfile
fanslib.deepblush.garden {
    reverse_proxy localhost:6969
}
```

Caddy muss sich nicht mehr um `/api` Routing kümmern — das macht der Web-Server.

### Ohne Caddy

Einfach `http://localhost:6969` aufrufen. API ist unter `localhost:6969/api/*` erreichbar.

### ENV-Variablen

```env
# Web-Server
PORT=6969
API_URL=http://localhost:6970   # Interner Proxy-Target

# API-Server
API_PORT=6970
```

### Frontend-Code (vereinfacht)

```ts
// config.ts
export const backendBaseUrl = '';  // Immer relativ

// api calls nutzen einfach /api/...
fetch('/api/media/123/file')
```

---

## Media Library Pfad ✅

### Bestätigt
Die Library liegt unter:
```
/mnt/shares/Archive/Amy/Kreativ - NSFW/Content
```

### Empfehlung: Symlink + ENV

**Beides.** Symlink für Convenience, ENV als Source of Truth.

```bash
# Symlink erstellen
ln -s "/mnt/shares/Archive/Amy/Kreativ - NSFW/Content" /mnt/shares/appdata/fanslib/library
```

```env
LIBRARY_PATH=/mnt/shares/appdata/fanslib/library
```

**Warum Symlink?**
- Kurzer, sauberer Pfad ohne Leerzeichen/Sonderzeichen
- Kein Quoting-Problem in Scripts, ENV-Files, Configs
- Leicht zu ändern wenn der Pfad sich ändert (nur Symlink updaten)
- Das ENV zeigt auf den Symlink — konsistenter, weniger fehleranfällig

**Warum nicht nur ENV mit vollem Pfad?**
- Leerzeichen im Pfad = Quoting-Hölle in Shell-Scripts
- Jedes Tool das den Pfad nutzt muss korrekt quoten
- Symlink eliminiert das Problem an der Wurzel

---

## Playwright in Production — Impact-Analyse

### Was wird Playwright genutzt?
Vermutlich für headless Screenshots/Thumbnails von Content-Seiten.

### Was braucht Playwright?

| Komponente | Größe | Beschreibung |
|------------|-------|--------------|
| Chromium Binary | **~280 MB** | Headless Browser |
| System-Dependencies | **~100 MB** | Shared libraries (libX11, libglib, fonts, etc.) |
| Playwright npm Package | **~5 MB** | Node.js Bindings |
| **Gesamt** | **~385 MB** | Zusätzlicher Disk-Space |

### System-Dependencies installieren

```bash
# Auf Tsumetai (Debian/Ubuntu)
npx playwright install chromium
npx playwright install-deps chromium  # System-Libs
```

### Impact auf Deployment

1. **Docker-Image deutlich größer** (~400 MB mehr)
2. **Mehr RAM** — Chromium braucht ~100-300 MB pro Instanz
3. **Startup langsamer** — Browser-Launch dauert 1-3 Sekunden
4. **Security-Surface** — Headless Browser = potenzieller Angriffsvektor

### Alternativen für Headless Screenshots

| Alternative | Vorteile | Nachteile |
|-------------|----------|-----------|
| **Playwright** (aktuell) | Voll-featured, zuverlässig | Groß, ressourcenhungrig |
| **Puppeteer** | Ähnlich wie Playwright | Gleiche Größe, kein Vorteil |
| **sharp + HTML-to-image** | Leichtgewichtig (~20 MB) | Kein echtes Browser-Rendering |
| **Satori (Vercel)** | SVG-basiert, sehr klein | Nur React-Components, kein HTML |
| **Screenshot-API (extern)** | Kein lokaler Browser nötig | Abhängigkeit, Kosten, Latenz |

### Empfehlung: Später lösen ✅

**Playwright jetzt installieren, Optimierung verschieben.**

Begründung:
- Es funktioniert bereits
- Die App ist nicht öffentlich/hochlastig — Ressourcen sind kein Problem
- Optimierung wäre premature
- ~400 MB extra auf einem Server mit TB an Storage ist irrelevant

**Für später (wenn es stört):**
- Playwright in einen eigenen Sidecar-Container auslagern
- Oder durch leichtere Alternative ersetzen wenn klar ist was genau gerendert wird

---

## ENV-Variablen (Komplett)

### API-Server (`@fanslib/server`)

| Variable | Required | Beschreibung | Wert |
|----------|----------|--------------|------|
| `APPDATA_PATH` | ✅ | App-Daten (DB, credentials, thumbnails) | `/mnt/shares/appdata/fanslib` |
| `LIBRARY_PATH` | ✅ | Media-Library | `/mnt/shares/appdata/fanslib/library` (Symlink) |
| `API_PORT` | ❌ | Server port | `6970` (default) |
| `FFPROBE_PATH` | ❌ | Custom ffprobe binary | `/usr/bin/ffprobe` |
| `DISABLE_CRON` | ❌ | Cron-Jobs deaktivieren | `"true"` (für Preview) |
| `NODE_ENV` | ❌ | Standard Node env | `production` |
| `TZ` | ❌ | Timezone | `Europe/Berlin` |

### Web-Server (`@fanslib/web`)

| Variable | Required | Beschreibung | Wert |
|----------|----------|--------------|------|
| `PORT` | ❌ | Web server port | `6969` (default) |
| `API_URL` | ❌ | API-Server URL (für Proxy) | `http://localhost:6970` (default) |

---

## Nächste Schritte

1. ✅ SSH-Zugriff verifiziert
2. ✅ Daten lokalisiert + dokumentiert
3. ✅ Backup erstellt (2x: kritische Dateien + komplett)
4. ✅ Library-Pfad geklärt
5. ✅ DB geklärt (Root = aktiv)
6. ✅ API URL Strategie: Option C (Single Server Proxy)
7. ✅ Playwright: Jetzt installieren, später optimieren
8. ⬜ Symlink erstellen für Library
9. ⬜ Port-Refactoring umsetzen (Ada: `API_PORT` env)
10. ⬜ API Proxy im Web-Server implementieren (Ada: Option C)
11. ⬜ Relative URLs im Frontend (Ada: `backendBaseUrl = ''`)
12. ⬜ Caddy-Config schreiben (vereinfacht)
13. ⬜ PM2 ecosystem config erstellen
14. ⬜ Playwright auf Tsumetai installieren
15. ⬜ Daten-Migration planen
16. ⬜ Deploy-Script schreiben

---

## Offene Fragen

1. ~~Library-Pfad~~ ✅ `/mnt/shares/Archive/Amy/Kreativ - NSFW/Content`
2. ~~Welche DB ist aktiv~~ ✅ Root-DB (`fanslib.sqlite`, 4MB)
3. ~~API URL Strategie~~ ✅ Option C (Single Server Proxy)
4. ~~Playwright in Prod~~ ✅ Ja, jetzt installieren
5. **Preview: Seed-Daten?** Soll Preview eine Kopie der Prod-DB bekommen oder leer starten?
6. **`/mnt/shares/appdata/fanslib/git/`** — Alte Repo-Kopie. Kann das weg?
