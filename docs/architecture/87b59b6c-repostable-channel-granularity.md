# Repostable: Channel-spezifische Granularität — Überarbeitetes Konzept

**Splitter:** 87b59b6c  
**Status:** Konzept-Draft für Ada  
**Autorin:** Sol ☀️  
**Datum:** 2026-03-13

---

## Problem-Analyse

Das aktuelle `repostStatus`-System funktioniert technisch bereits **per Channel** — aber das Konzept ist unklar kommuniziert und die UI vermittelt den falschen Eindruck eines "globalen" Media-Status.

### Was existiert (und funktioniert)

```typescript
// filter-presets.ts — repostStatus hat bereits channelId + subredditId
{ type: 'repostStatus'; value: '...'; channelId?: string; subredditId?: string }
```

- `filter-helpers.ts` baut SQL-Queries mit optionalem `channelId`-Scope
- `fetch-all.ts` berechnet `repostStatus` als computed column — aber nur wenn `channelId` als Request-Parameter übergeben wird
- `MediaTile` zeigt einen einzelnen `repostStatus`-Badge — ohne Channel-Kontext

### Was das Problem ist

Die **MediaTile-Badge** und die **globale Bibliotheksansicht** tun so, als wäre `repostStatus` eine Eigenschaft des Mediums selbst. Das ist konzeptuell falsch.

Ein Video kann gleichzeitig sein:
- `repostable` auf Fansly Wall
- `on_cooldown` auf r/OnlyFansGirls  
- `never_posted` auf r/GoneWild

Es gibt **keinen sinnvollen globalen Repost-Status**.

---

## Granularitätsentscheidung

### Richtige Granularität: **per Channel**

Jeder `Channel`-Eintrag in der DB ist die atomare Einheit für Repost-Tracking:

| Platform | Channel-Modellierung | Repost-Cooldown |
|----------|---------------------|-----------------|
| Fansly Wall | eigener Channel (`typeId: "fansly"`) | `mediaRepostCooldownHours` auf Channel |
| Fansly FYP | eigener Channel (`typeId: "fansly"`) | `mediaRepostCooldownHours` auf Channel |
| r/OnlyFansGirls | eigener Channel (`typeId: "reddit"`) | `mediaRepostCooldownHours` auf Channel |
| r/GoneWild | eigener Channel (`typeId: "reddit"`) | `mediaRepostCooldownHours` auf Channel |

**Fansly Wall und FYP sind separate Channels, keine Schedules!**

### Was mit Content Schedules passiert

Content Schedules sind Posting-Rhythmen, keine Repost-Kontexte. Ein Schedule "Fansly Wall — täglich" linkt via `ScheduleChannel` zu einem spezifischen Channel. Der Schedule *nutzt* den Channel-Context für Repost-Checks, er *ist* nicht der Kontext.

```
ContentSchedule "Fansly Wall täglich"
  └─ ScheduleChannel → Channel "Fansly Wall" (mediaRepostCooldownHours: 168h)

ContentSchedule "Fansly FYP 3x/Woche"
  └─ ScheduleChannel → Channel "Fansly FYP" (mediaRepostCooldownHours: 720h)
```

### Subreddits — bereits korrekt

Subreddits werden bei der Erstellung in einen eigenen Channel (`typeId: "reddit"`) gewrapped. Repost-Tracking ist damit bereits de-facto per Subreddit. Der `subredditId`-Parameter in den Filtern ist eine convenience — technisch ist es dasselbe wie `channelId` des zugehörigen Channels.

---

## Was geändert werden muss

### 1. Datenmodell — kein Änderungsbedarf

Die Channel-Tabelle unterstützt bereits alles. Fansly Wall und FYP als separate Channels anlegen (falls noch nicht so modelliert).

### 2. `repostStatus` computed column — Context-abhängig machen

**Aktuell:** `repostStatus` wird nur berechnet wenn `channelId` als URL-Parameter mitkommt.

**Soll:** `repostStatus` ohne Channel-Context ergibt keinen Badge mehr auf MediaTile. Stattdessen:
- In Channel-/Schedule-gefilterten Views: kontextueller Status
- In der globalen Bibliothek ohne Filterkontext: kein `repostStatus`-Badge (oder "N/A")

### 3. `repostStatus`-Filter in der UI — Channel-Auswahl erzwingen

**Aktuell:** Filter `repostStatus` kann ohne `channelId` gesetzt werden — dann gibt es ein schlecht definiertes Verhalten (nutzt globalen Default-Cooldown).

**Soll:** Wenn `repostStatus`-Filter gesetzt wird, muss ein Channel-Kontext ausgewählt werden. UI-Validierung: "Für welchen Channel/Schedule soll der Repost-Status geprüft werden?"

```
Filter: Repost-Status
├── Status: [repostable ▾]
└── Kontext: [Fansly Wall ▾]  ← NEU: Pflichtfeld
```

### 4. Cooldown-Berechnung — pro Channel, nicht global

**Aktuell:** Wenn kein `channelCooldownHours` gefunden, fällt das System auf `defaultMediaRepostCooldownHours` aus den Settings zurück.

**Soll:** Gleiche Logik, aber klarer kommuniziert in der UI. Jeder Channel sollte sichtbar seinen eigenen Cooldown haben. Der globale Default ist nur ein Fallback für Channels ohne spezifischen Wert.

### 5. Views-Plateau-Detection — bleibt global

`plateauConsecutiveDays`, `plateauThresholdPercent` etc. sind content-spezifisch, nicht channel-spezifisch. Eine View wächst oder stagniert plattformübergreifend. Das bleibt ein globales Setting.

---

## Cooldown-Messung je Kontext

### Wann startet der Cooldown?
Ab dem letzten `posted`-Post in diesem Channel. SQL:

```sql
WHERE pm.mediaId = media.id
  AND p.channelId = :channelId
  AND p.status = 'posted'
  AND p.date >= :cutoffDate
```

### Wann ist Cooldown abgelaufen?
Wenn kein `posted`-Post in diesem Channel innerhalb `mediaRepostCooldownHours`.

### Wie werden Cooldowns je Channel konfiguriert?
Bereits via `channel.mediaRepostCooldownHours`. Wenn null → globaler Default.

---

## UI-Anforderungen für Ada

### Bibliothek (globale Ansicht)
- **Kein** einzelner `repostStatus`-Badge pro MediaTile in der globalen Library
- Optional: Kompakte Multi-Channel-Status-Anzeige (z.B. Farbpunkte für "R/C/N" je Channel) — low priority

### Bibliothek mit Channel-/Schedule-Filter aktiv
- `repostStatus`-Badge zeigt Status **für den gefilterten Channel**
- Der Badge ist jetzt meaningful und korrekt

### Filter-Editor: `repostStatus`-Filter
- Neues Pflichtfeld: Channel-Auswahl (Dropdown mit allen Channels)
- Bei Schedule-Kontext: pre-fill mit dem zugehörigen Channel

### Settings: Repost-Cooldowns
- Pro-Channel-Cooldown konfigurierbar in den Channel-Settings (existiert bereits)
- Globaler Default in `/settings/repost` (existiert bereits)

---

## Was bleibt unverändert

- Die SQL-Logik in `filter-helpers.ts` — korrekt implementiert
- Das `channelId`/`subredditId`-Feld im Filterschema — bereits vorhanden
- Subreddit-to-Channel-Komposition — funktioniert

---

## Zusammenfassung für Ada

**Repostability ist per Channel. Immer.**

1. Jeder Channel hat seinen eigenen `mediaRepostCooldownHours`
2. Fansly Wall ≠ Fansly FYP — das sind separate Channels
3. Subreddit = sein Channel — das funktioniert schon
4. `repostStatus` ohne Channel-Kontext ist semantisch leer — die UI soll das nicht mehr suggerieren
5. Der `repostStatus`-Filter in der UI braucht ein Pflicht-Channel-Feld

Die Backend-Logik braucht wenig Änderung. Die Hauptarbeit liegt in der UI: den Channel-Kontext sichtbar machen und erzwingen.
