# 🐻 QA Report: fanslib — Plan Page 2.0: 2-Wochen-Kalender

**Datum:** 2026-02-17 12:50 GMT+1
**Tester:** Hank (QA Engineer)
**Umgebung:** Code Review (Dev Server nicht verfügbar — kein .env konfiguriert)
**Spec:** `/workspace/projects/fanslib/specs/plan-page-2.0.json`
**Commit:** `366c8ae8`
**Status:** ⚠️ PROBLEME (1 Bug, kein Browser-Test möglich)

---

## Zusammenfassung

Code-Level QA gegen alle 22 Features der Spec. TypeScript kompiliert fehlerfrei. Die Implementierung sieht strukturell solide aus. **1 Bug gefunden** (F03 Heute-Button). **Browser-Tests konnten nicht durchgeführt werden** da kein Dev Server / keine .env Konfiguration vorhanden ist — Drag & Drop, Animationen, Responsive und visuelle Tests stehen noch aus.

---

## Akzeptanzkriterien

### F01: 2-Wochen-Grid Layout ✅ (Code-Level)

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | Kalender zeigt genau 14 aufeinanderfolgende Tage | ✅ `eachDayOfInterval({ start: from, end: addDays(from, 13) })` |
| 2 | Layout ist ein 7-Spalten-Grid mit 2 Wochen-Reihen | ✅ `grid-cols-2 md:grid-cols-7` |
| 3 | Woche beginnt am Montag (Locale de) | ✅ `startOfWeek(_, { weekStartsOn: 1 })` |
| 4 | Jeder Tag zeigt Datum und abgekürzten Wochentag | ✅ `format(date, "d")` + `format(date, "EEE", { locale: de })` |
| 5 | Heutiger Tag ist visuell hervorgehoben | ✅ `isToday(date)` → `bg-base-200 ring-2 ring-primary/50` |
| 6 | Tage wachsen vertikal mit Content | ✅ `min-h-[100px]`, kein overflow/scroll |

### F02: Navigation ✅ (Code-Level)

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | Prev-Button verschiebt um 1 Woche zurück | ✅ `addWeeks(from, -1)` |
| 2 | Next-Button verschiebt um 1 Woche vorwärts | ✅ `addWeeks(from, 1)` |
| 3 | Navigation-Buttons sichtbar oben im Kalender-Bereich | ✅ TwoWeekNavigation in PlanContent header |
| 4 | Zeitraum-Label zeigt Start- und Enddatum | ✅ `formatDateRange(from, end)` |
| 5 | Bei Monatsübergang zeigt Label beide Monate | ✅ `!isSameMonth` → zeigt beide |

### F03: Heute-Button ❌ BUG

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | Heute-Button setzt `?from=` auf Montag der aktuellen Woche | ✅ |
| 2 | Nach Klick ist heutiger Tag im 2-Wochen-Fenster | ✅ |
| 3 | Button ist disabled wenn heute bereits sichtbar | ❌ **BUG** |

### F04: URL Search Param `?from=` ✅

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | Startdatum wird aus `?from=YYYY-MM-DD` gelesen | ✅ `validateSearch` + `useSearch` |
| 2 | Ohne `?from=` startet am Montag der aktuellen Woche | ✅ `getMondayFrom` Fallback |
| 3 | Navigation aktualisiert `?from=` Parameter | ✅ `navigate({ search: { from } })` |
| 4 | Browser Back navigiert zur vorherigen Position | ✅ (TanStack Router default) |
| 5 | URL ist teilbar | ✅ |
| 6 | `?from=` wird auf vorherigen Montag normalisiert | ✅ `startOfWeek(parsed, { weekStartsOn: 1 })` |

### F05: Daten-Fetching ✅

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | Posts für genau 14-Tage-Zeitraum gefetcht | ✅ `from` bis `addDays(from, 13)` |
| 2 | Virtual Posts für selben Zeitraum | ✅ |
| 3 | Kein debounced Range-Update | ✅ alte Debounce-Logik entfernt |
| 4 | Bei Navigation neuer Fetch | ✅ `useMemo` deps auf `from` |

### F06: Posts pro Tag vorgruppiert ✅

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | Posts in Map<date-string, Post[]> via useMemo | ✅ |
| 2 | CalendarDayColumn erhält nur Posts des Tages | ✅ `postsByDay.get(key)` |
| 3 | CalendarDayColumn mit React.memo | ✅ custom arePropsEqual |
| 4 | Keine Re-Renders wenn Posts unverändert | ✅ `prev.posts === next.posts` |

### F07: Drag & Drop ⬜ NICHT TESTBAR (braucht Browser)

Existing DnD components (PostCalendarDayContainer, PostCalendarDayDropzone, PostCalendarDropzone, PostCalendarPost) sind unverändert und werden weiterhin korrekt verwendet.

### F08: Click-Interaktionen ⬜ NICHT TESTBAR (braucht Browser)

PostCalendarPost, PostCalendarPostView, FloatingVirtualPostCard sind unverändert.

### F09: Split-View Layout ⬜ NICHT TESTBAR (braucht Browser)

PlanPage unverändert — Split-View Logik nicht angefasst.

### F10: Filter und View Settings ✅ (Code-Level)

Preferences-Logik in PlanContent unverändert. Alle Preferences weiterhin aus `usePostPreferences()`.

### F11: Skeleton ✅

TwoWeekCalendarSkeleton vorhanden, 7×2 Grid, Skeleton-Karten pro Tag.

### F12: Aufräumen ✅

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | PostCalendar entfernt | ✅ |
| 2 | CalendarMonthGrid entfernt | ✅ |
| 3 | CalendarMonthSkeleton entfernt | ✅ |
| 4 | useInfiniteCalendar entfernt | ✅ |
| 5 | Expanding-Range-Logik entfernt | ✅ |
| 6 | Keine toten Imports | ✅ (grep bestätigt) |

### F13–F14: Container Queries & Animationen ⬜ NICHT TESTBAR

Nicht angefasst, bestehende Komponenten unverändert.

### F15: Mobile Fallback ✅ (Code-Level)

`grid-cols-2 md:grid-cols-7` — unter 768px 2-Spalten-Grid statt 7.

### F16–F17: Monats-/Jahresübergang ✅ (Code-Level)

`formatDateRange` handles `!isSameMonth` und `!isSameYear`.

### F18: Viele Posts an einem Tag ✅ (Code-Level)

`min-h-[100px]` + `flex-col`, Tage dehnen sich vertikal.

### F19: Leerer Kalender ✅ (Code-Level)

Grid wird immer mit 14 Tagen gerendert, jeder Tag hat Dropzone.

### F20: Ungültiger `?from=` ✅

`parseISO` + `isValid` check, Fallback auf aktuelle Woche.

### F21: FloatingCard + Navigation ✅

`closePicker()` im `useEffect` auf `from` Änderung.

### F22: Keine Channels ✅

`PlanEmptyState` wenn `!channels?.length`.

---

## 🚨 Bugs

### Bug #1: Heute-Button disabled-Check zu restriktiv

**Schweregrad:** 🟡 MITTEL
**Komponente:** TwoWeekNavigation
**Akzeptanzkriterium:** F03.3 — "Button ist disabled/hidden wenn heute bereits sichtbar ist"

**Problem:**
`isCurrentWeek` prüft `from.getTime() === currentMonday.getTime()`. Der Button ist nur disabled wenn `from` genau der aktuelle Montag ist. Aber wenn `from` = letzter Montag (z.B. 9. Feb), ist heute (17. Feb) in der zweiten Reihe sichtbar, und der Button ist trotzdem enabled.

**Erwartet:** Button disabled wenn heute im 14-Tage-Fenster `[from, from+13]` liegt.

**Fix-Vorschlag:**
```tsx
const isTodayVisible = isWithinInterval(new Date(), {
  start: from,
  end: addDays(from, 13),
});
// statt: const isCurrentWeek = from.getTime() === currentMonday.getTime();
```

---

## ⚠️ Einschränkungen

**Kein Browser-Test möglich:** Dev Server nicht konfiguriert (keine .env-Dateien). Folgende Features konnten nur auf Code-Ebene, nicht visuell/interaktiv getestet werden:
- F07: Alle 6 DnD-Kombinationen
- F08: Click-Interaktionen
- F09: Split-View responsive breakpoints
- F13: Container Queries visuell
- F14: Framer Motion Animationen
- F15: Mobile Darstellung visuell

**Empfehlung:** Entweder .env bereitstellen für vollständige QA, oder Bug #1 fixen und dann deployen + Prod-QA.

---

## Ergebnis

⚠️ **BEDINGT BESTANDEN** — 1 Bug (mittel), Browser-Tests ausstehend.

**Nächste Schritte:**
1. Bug #1 (Heute-Button) fixen
2. Re-QA nach Fix
3. Idealerweise Browser-Tests vor Approval

---

🐻 Hank — QA Engineer
