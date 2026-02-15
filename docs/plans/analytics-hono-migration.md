# Implementationsplan: Analytics Elysia → Zod Migration

**Spec:** `/specs/analytics-hono-migration.json`
**Briefing:** `/docs/briefings/analytics-hono-migration.md`
**Branch:** `docs/analytics-hono-migration-spec`

---

## Überblick

Rein mechanische Migration: `import { t } from "elysia"` → `import { z } from "zod"` in 9 Dateien + Type-Inference in `schemas.ts` + Cleanup von `lib/standard-schema.ts`.

Kein Logik-Refactoring. Kein Ändern von Business Logic. Nur Schema-Syntax.

---

## Schritt 1: Schema-Dateien (Basis)

**Dateien (4):**
- `@fanslib/apps/server/src/features/analytics/schemas/analytics.ts`
- `@fanslib/apps/server/src/features/analytics/schemas/health.ts`
- `@fanslib/apps/server/src/features/analytics/schemas/fyp-actions.ts`
- `@fanslib/apps/server/src/features/analytics/schemas/insights.ts`

**Reihenfolge:** `analytics.ts` zuerst (wird von `insights.ts` importiert), Rest beliebig.

**Was zu tun ist:**

1. Import ändern: `import { t } from "elysia"` → `import { z } from "zod"`
2. Schema-Syntax umschreiben nach Mapping-Tabelle (siehe unten)
3. **insights.ts Sonderfall:** `t.Intersect([a, b])` → `a.extend(b.shape)` wo möglich, sonst `a.and(b)`

### Mapping-Tabelle

| TypeBox | Zod |
|---------|-----|
| `t.Object({...})` | `z.object({...})` |
| `t.String()` | `z.string()` |
| `t.Number()` | `z.number()` |
| `t.Boolean()` | `z.boolean()` |
| `t.Date()` | `z.date()` |
| `t.Array(x)` | `z.array(x)` |
| `t.Optional(x)` | `x.optional()` |
| `t.Nullable(x)` | `x.nullable()` |
| `t.Union([a, b])` | `z.union([a, b])` |
| `t.Literal("x")` | `z.literal("x")` |
| `t.Intersect([a, b])` | Siehe Gotcha |
| `t.Tuple([a, b])` | `z.tuple([a, b])` |
| `t.Record(k, v)` | `z.record(k, v)` |
| `t.Unknown()` | `z.unknown()` |
| `t.Null()` | `z.null()` |

### Gotcha: Intersections in `insights.ts`

`t.Intersect([BaseSupportingDataSchema, t.Object({...})])` soll zu `.extend()` werden:

```typescript
// Vorher
const VideoLengthSupportingDataSchema = t.Intersect([
  BaseSupportingDataSchema,
  t.Object({
    optimalRange: t.Tuple([t.Number(), t.Number()]),
    performanceByRange: t.Array(PerformanceByRangeSchema),
  }),
]);

// Nachher
const VideoLengthSupportingDataSchema = BaseSupportingDataSchema.extend({
  optimalRange: z.tuple([z.number(), z.number()]),
  performanceByRange: z.array(PerformanceByRangeSchema),
});
```

Für die Insight-Schemas selbst (z.B. `VideoLengthInsightSchema`) die zwei `t.Object` intersecten, einfach zu einem `z.object` zusammenführen:

```typescript
// Vorher
export const VideoLengthInsightSchema = t.Intersect([
  t.Object({ type: t.Literal("videoLength"), confidence: t.Number(), recommendation: t.String() }),
  t.Object({ supportingData: VideoLengthSupportingDataSchema }),
]);

// Nachher
export const VideoLengthInsightSchema = z.object({
  type: z.literal("videoLength"),
  confidence: z.number(),
  recommendation: z.string(),
  supportingData: VideoLengthSupportingDataSchema,
});
```

Für `ActionableInsightSchema` mit `t.Intersect([BaseSupportingDataSchema, t.Record(...)])`:

```typescript
// Nachher
supportingData: BaseSupportingDataSchema.and(z.record(z.string(), z.unknown())),
```

### Gotcha: `t.Date()` → `z.date()`

Die Date-Felder in `analytics.ts` (`date`, `createdAt`, `updatedAt`, etc.) kommen aus der DB als echte `Date`-Objekte. `z.date()` ist korrekt. **Kein** `z.coerce.date()` nötig.

**Verifizierung:** Build muss durchlaufen, keine Runtime-Fehler bei Date-Feldern.

**Geschätzte Zeit:** ~15 Min

---

## Schritt 2: Operations-Dateien

**Dateien (5):**
- `@fanslib/apps/server/src/features/analytics/operations/credentials.ts`
- `@fanslib/apps/server/src/features/analytics/operations/insights.ts`
- `@fanslib/apps/server/src/features/analytics/operations/post-analytics/fetch-datapoints.ts`
- `@fanslib/apps/server/src/features/analytics/operations/post-analytics/fetch-posts-with-analytics.ts`
- `@fanslib/apps/server/src/features/analytics/fetch-fansly-data.ts`

**Was zu tun ist:**

1. Import ändern: `import { t } from "elysia"` → `import { z } from "zod"`
2. Schema-Syntax umschreiben (gleiche Mapping-Tabelle wie Schritt 1)
3. Business Logic **nicht anfassen** — nur die Schema-Definitionen am Anfang der Dateien

**Hinweise:**
- `insights.ts` importiert `ActionableInsightSchema` aus `../schemas/insights` — funktioniert nach Schritt 1
- `fetch-posts-with-analytics.ts` importiert `FanslyPostWithAnalyticsSchema` aus `../../schemas/analytics` — funktioniert nach Schritt 1
- `credentials.ts` hat nur ein kleines Schema (`{ fetchRequest: t.String() }`) — trivial

**Geschätzte Zeit:** ~10 Min

---

## Schritt 3: Type-Inference + Cleanup

**Dateien (2):**
- `@fanslib/apps/server/src/schemas.ts`
- `@fanslib/apps/server/src/lib/standard-schema.ts`

### `schemas.ts`

22 Stellen wo `Static<typeof XSchema>` durch `z.infer<typeof XSchema>` ersetzt werden muss.

1. `import type { Static } from 'elysia'` → entfernen (241 andere Types nutzen bereits `z.infer`, kein `Static` mehr nötig nach der Änderung)
2. Alle Analytics-bezogenen `Static<typeof ...>` → `z.infer<typeof ...>`

Betroffene Types (Zeilen 1159-1242):
- `GetFanslyPostsWithAnalyticsQuery`
- `GetFanslyPostsWithAnalyticsResponse`
- `GetHashtagAnalyticsResponse`
- `GetTimeAnalyticsResponse`
- `GenerateInsightsResponse`
- `FanslyPostWithAnalytics`, `HashtagAnalyticsItem`, `HashtagAnalytics`, `TimeAnalyticsItem`, `TimeAnalytics`
- `ActionableInsight`, `ActionableInsightType`, `ContentThemeInsight`, `HashtagInsight`, `PostTimingInsight`, `VideoLengthInsight`
- `AnalyticsHealthResponse`, `StalePost`
- `FypActionsQuery`, `FypActionsResponse`, `FypPost`

### `lib/standard-schema.ts`

Diese Datei wird **nirgends importiert** (verifiziert via grep). → **Datei löschen.**

Falls sie aus Vorsicht behalten werden soll: `StandardSchemaV1Like` aus `elysia/types` → `import type { StandardSchemaV1 } from '@standard-schema/spec'` (Zod 3.24+ hat Standard Schema Support eingebaut, Effect Schema ebenso).

**Empfehlung:** Löschen. Tote Datei.

**Geschätzte Zeit:** ~10 Min

---

## Schritt 4: Build + Verify

1. `pnpm build` — muss fehlerfrei durchlaufen
2. `pnpm typecheck` oder `tsc --noEmit` — keine Type-Errors
3. Prüfen ob Elysia noch anderswo im Projekt gebraucht wird:
   ```bash
   grep -r "from.*elysia\|require.*elysia" @fanslib/ --include="*.ts" --include="*.tsx"
   ```
   Falls nur noch in `package.json` → **nicht entfernen** (out of scope laut Spec)
4. Existierende Tests laufen lassen (falls vorhanden)

**Geschätzte Zeit:** ~5 Min

---

## Commit-Strategie

Ein einzelner Commit reicht:

```
refactor(analytics): migrate schemas from Elysia TypeBox to Zod

Replace all t.* (TypeBox) schema definitions with z.* (Zod) equivalents
in 9 analytics files. Update type inference in schemas.ts from
Static<> to z.infer<>. Remove unused lib/standard-schema.ts.

No business logic changes. All validations remain functionally equivalent.
```

---

## Referenz-Implementation

`@fanslib/apps/server/src/features/analytics/candidates/` — bereits auf Zod migriert. Im Zweifelsfall dort nachschauen wie das Pattern aussieht.

---

## Zusammenfassung

| Schritt | Dateien | Aufwand | Risiko |
|---------|---------|---------|--------|
| 1. Schema-Dateien | 4 | ~15 Min | Mittel (insights.ts Intersections) |
| 2. Operations | 5 | ~10 Min | Niedrig (mechanisch) |
| 3. Type-Inference + Cleanup | 2 | ~10 Min | Niedrig |
| 4. Build + Verify | — | ~5 Min | — |
| **Gesamt** | **11** | **~40 Min** | **Niedrig** |
