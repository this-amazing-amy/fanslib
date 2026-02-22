# Implementation Plan: API Error-Responses Fix

## Übersicht

Die Fanslib API (Hono + sql.js/TypeORM) gibt bei Fehlern falsche oder irreführende HTTP-Statuscodes zurück. Es gibt keinen globalen Error Handler — unbehandelte Exceptions werden von Hono als generischer 500 mit HTML-Body zurückgegeben. Das Frontend (`hono/client`) kann diese Fehler nicht sinnvoll verarbeiten.

## Analyse: Gefundene Probleme

### Problem 1: Kein globaler Error Handler
- Hono gibt bei unbehandeltem `throw` einen 500 mit `text/plain` oder HTML zurück
- Der `devalueMiddleware` versucht dann `res.json()` auf einem Non-JSON-Body → Doppelfehler möglich
- Frontend bekommt keine strukturierte Fehlermeldung

### Problem 2: `/migrate-colors` gibt 200 bei Fehler zurück
- `src/index.ts` Zeile 77: `c.json({ success: false, error: ... })` — kein HTTP-Statuscode gesetzt
- Client bekommt `200 OK` obwohl die Migration fehlgeschlagen ist

### Problem 3: Operations werfen `throw new Error()` für Business-Logic-Fehler
Beispiele (alle in `src/features/`):
- `analytics/operations/post-analytics/add-datapoints.ts:29` — `"PostMedia not found"` → sollte 404 sein, wird 500
- `analytics/operations/post-analytics/fetch-datapoints.ts:43` — `"PostMedia not found"` → 404
- `analytics/operations/credentials.ts:47` — Credentials-Fehler → 400
- `analytics/fetch-fansly-data.ts:38-99` — Fansly API Fehler → 502 (bad gateway) oder 422
- `api-bluesky/client.ts:23` — `"Bluesky credentials not configured"` → 422
- `api-bluesky/operations/upload-video.ts` — diverse Upload-Fehler → 502
- `api-postpone/operations/bluesky/draft.ts:47,61,65` — Config/Not-Found → 422/404
- `api-postpone/operations/helpers.ts:15` — `"Postpone token not configured"` → 422

### Problem 4: Kein try/catch in den meisten Route-Handlern
Von 17 Route-Dateien haben nur 2 überhaupt try/catch:
- `library/routes.ts` — nur für File-Serving (Zeilen 188, 226)
- `analytics/candidates/routes.ts` — fängt Errors, aber re-throws non-"not found" → trotzdem 500

Alle anderen Route-Handler (posts, tags, channels, settings, etc.) haben **kein Error-Handling**.

### Problem 5: Inkonsistente Error-Response-Shapes
- Manche: `{ error: "message" }` mit Status 404
- Manche: `{ success: false, error: "message" }` mit Status 200
- Unbehandelt: HTML/Text-Body mit Status 500

## Architektur-Entscheidungen

### 1. Globaler `app.onError()` Handler statt try/catch in jedem Handler
**Warum:** Ein zentraler Ort für Error-Handling ist wartbarer als try/catch in ~50 Route-Handlern. Hono unterstützt `app.onError()` nativ.

### 2. Custom Error-Klassen für Business-Logic-Fehler
**Warum:** `throw new Error("Not found")` gibt dem Error Handler keine Info über den richtigen Statuscode. Custom Errors (`NotFoundError`, `ValidationError`, `ConfigurationError`, `ExternalServiceError`) machen den Statuscode explizit.

### 3. Einheitliche Error-Response-Shape
```typescript
type ErrorResponse = {
  error: string        // Menschenlesbare Fehlermeldung
  code?: string        // Maschinenlesbarer Fehlercode (optional)
  details?: unknown    // Zusätzliche Details (z.B. Validation-Errors)
}
```

### 4. Error-Response wird NICHT durch devalueMiddleware geleitet
**Warum:** Error-Responses sind einfaches JSON — devalue ist nur für Success-Responses mit Date-Objekten nötig. Der `onError` Handler setzt die Response direkt, bevor die Middleware greift.

## Schritte

### Schritt 1: Error-Klassen erstellen
- **Dateien:** `src/lib/errors.ts` (NEU)
- **Was:**
  - `AppError` Basisklasse mit `statusCode` und `code`
  - `NotFoundError` (404)
  - `ValidationError` (422)
  - `ConfigurationError` (422) — für fehlende Settings/Credentials
  - `ExternalServiceError` (502) — für Fansly/Bluesky/Postpone API Fehler
  - `ConflictError` (409) — für Duplikate
- **Akzeptanzkriterium:** Datei existiert, exportiert alle Error-Klassen, `bun typecheck` passt

### Schritt 2: Globalen Error Handler in `src/index.ts` einbauen
- **Dateien:** `src/index.ts`
- **Was:**
  - `app.onError()` hinzufügen — mappt `AppError`-Subklassen auf korrekte HTTP-Statuscodes
  - Unbekannte Errors → 500 mit `{ error: "Internal server error" }` (kein Stack-Trace leak!)
  - Console-Logging für alle Errors (mit Stack-Trace im Server-Log)
  - `/migrate-colors` Endpoint fixen: `c.json({ ... }, 500)` bei Fehler
- **Akzeptanzkriterium:** `app.onError` ist registriert, `/migrate-colors` gibt 500 bei Fehler, unbekannte Errors → 500 JSON

### Schritt 3: Operations in `analytics/` auf Custom Errors umstellen
- **Dateien:**
  - `src/features/analytics/operations/post-analytics/add-datapoints.ts`
  - `src/features/analytics/operations/post-analytics/fetch-datapoints.ts`
  - `src/features/analytics/operations/credentials.ts`
  - `src/features/analytics/fetch-fansly-data.ts`
- **Was:** `throw new Error(...)` → `throw new NotFoundError(...)` / `throw new ExternalServiceError(...)` etc.
- **Akzeptanzkriterium:** Alle `throw new Error` in diesen Dateien durch Custom Errors ersetzt, `bun typecheck` passt

### Schritt 4: Operations in `api-bluesky/` und `api-postpone/` auf Custom Errors umstellen
- **Dateien:**
  - `src/features/api-bluesky/client.ts`
  - `src/features/api-bluesky/operations/upload-video.ts`
  - `src/features/api-postpone/operations/bluesky/draft.ts`
  - `src/features/api-postpone/operations/helpers.ts`
- **Was:** `throw new Error(...)` → passende Custom Errors
- **Akzeptanzkriterium:** Alle `throw new Error` durch Custom Errors ersetzt, `bun typecheck` passt

### Schritt 5: Redundante try/catch in `candidates/routes.ts` aufräumen
- **Dateien:** `src/features/analytics/candidates/routes.ts`
- **Was:**
  - Redundante try/catch entfernen (der globale Handler fängt jetzt alles)
  - Falls Operations dort `throw new Error` nutzen → ebenfalls auf Custom Errors umstellen
- **Akzeptanzkriterium:** Kein redundantes try/catch mehr, TypeORM `EntityNotFoundError` wird im globalen Handler als 404 erkannt

### Schritt 6: TypeORM-spezifische Errors im globalen Handler abfangen
- **Dateien:** `src/index.ts` (Erweiterung von Schritt 2)
- **Was:**
  - TypeORM `EntityNotFoundError` → 404
  - TypeORM `QueryFailedError` mit UNIQUE constraint → 409
  - Andere TypeORM Errors → 500 mit generischer Meldung
- **Akzeptanzkriterium:** TypeORM Errors werden korrekt gemappt, kein Stack-Trace im Response-Body

## Offene Fragen

1. **Soll der Error-Response-Body auch durch devalue serialisiert werden?** — Empfehlung: Nein, plain JSON reicht für Errors. Der `devalueMiddleware` sollte bei `!response.ok` skippen.
2. **Brauchen wir Error-Logging nach extern (z.B. Sentry)?** — Aktuell nur `console.error`, reicht erstmal.
3. **Tests:** Gibt es bestehende API-Tests? Prüfen ob sie nach den Änderungen noch laufen. (`bun test` im Server-Paket)
