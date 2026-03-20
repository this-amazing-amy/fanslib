# Fansly Analytics Feature — Status Quo, Analysis & Redesign

## Table of Contents

1. [Status Quo](#part-1-status-quo)
   1. [Architecture Overview](#architecture-overview)
   2. [Data Model](#data-model)
   3. [Data Pipeline](#data-pipeline)
   4. [Subsystems](#subsystems)
   5. [Frontend](#frontend)
   6. [Current Limitations & Gaps](#current-limitations--gaps)
   7. [Extrapolated Original Vision](#extrapolated-original-vision)
2. [Redesign Plan](#part-2-redesign-plan)
   1. [Motivation](#motivation)
   2. [Design Principles](#design-principles)
   3. [New Architecture Overview](#new-architecture-overview)
   4. [New Data Model](#new-data-model)
   5. [Flow 1: Scheduling Capture (Primary)](#flow-1-scheduling-capture-primary)
   6. [Flow 2: Timeline Backfill (Secondary)](#flow-2-timeline-backfill-secondary)
   7. [Flow 3: Background Analytics Fetching](#flow-3-background-analytics-fetching)
   8. [Credential Lifecycle](#credential-lifecycle)
   9. [What Gets Removed](#what-gets-removed)
   10. [Key Architectural Decisions](#key-architectural-decisions)
   11. [Open Questions](#open-questions)

---

# Part 1: Status Quo

## Architecture Overview

The Fansly Analytics feature is a system for ingesting, storing, aggregating, and visualizing performance data from the Fansly platform. It tracks **per-media-item** view counts and engagement (interaction time) over time, then derives higher-order insights: FYP optimization recommendations, hashtag performance, posting-time correlations, content-theme analysis, and plateau detection.

The feature spans ~50 files across backend (Hono API), frontend (React + TanStack Query + Visx charts), and a Chrome extension, with a SQLite/TypeORM persistence layer.

### System Components

```
┌──────────────────────────────────────────────────────────────┐
│                      FANSLY PLATFORM                         │
│  apiv3.fansly.com/api/v1/it/moie/statsnew?mediaOfferId=...  │
│  apiv3.fansly.com/api/v1/timelinenew (timeline browsing)     │
│  (auth: fanslyAuth, fanslySessionId, fanslyClientId)         │
└──────────────┬────────────────────────┬──────────────────────┘
               │  HTTP GET              │  Intercepted by
               │  (proxied by server)   │  Chrome extension
               ▼                        ▼
┌────────────────────────┐  ┌──────────────────────────────────┐
│   FANSLIB SERVER       │  │   CHROME EXTENSION               │
│   (Hono, always-on)    │  │   (Manifest V3, side panel)      │
│                        │  │                                  │
│   analytics/           │◄─┤   fansly-interceptor.ts          │
│   ├── routes.ts        │  │   ├── Intercepts fetch + XHR     │
│   ├── candidates/      │  │   ├── Extracts credentials       │
│   ├── entity.ts        │  │   ├── Extracts candidates        │
│   ├── fetch-fansly-    │  │   └── Sends to server            │
│   │   data.ts          │  │                                  │
│   ├── fyp-performance  │  │   Popup/SidePanel UI             │
│   ├── operations/      │  │   ├── Post queue display         │
│   └── schemas/         │  │   ├── Mark as scheduled          │
│                        │  │   └── Connection status           │
│   lib/fansly-analytics │  └──────────────────────────────────┘
│   ├── aggregate.ts     │
│   └── plateau-         │
│       detection.ts     │
└────────────┬───────────┘
             │  JSON API
             ▼
┌──────────────────────────────────────────────────────────────┐
│                    FANSLIB WEB (React)                        │
│                                                              │
│  features/analytics/components/                              │
│  ├── AnalyticsDashboard.tsx ── Tab container (FYP|Matching)  │
│  ├── FypActionItemsSection.tsx ── Remove/repost lists        │
│  ├── MatchingSection.tsx ── Split-pane candidate matcher     │
│  ├── ConfidenceIndicator.tsx ── Health badge (% tracked)     │
│  └── HealthDetailsDrawer.tsx ── Stale/coverage details       │
│                                                              │
│  features/posts/components/post-detail/                      │
│  ├── PostDetailAnalytics.tsx ── Per-post analytics section   │
│  ├── AnalyticsViewsChart.tsx ── Visx area chart              │
│  └── PostDetailFanslyStatistics.tsx ── Statistics ID input   │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Core Entities

#### `FanslyAnalyticsDatapoint`
Raw time-series data, one record per timestamp per PostMedia.

| Column           | Type    | Description                              |
|------------------|---------|------------------------------------------|
| id               | uuid    | Primary key                              |
| timestamp        | int     | Unix timestamp (ms) of the data point    |
| views            | int     | Views at this timestamp (full + preview, summed) |
| interactionTime  | int     | Interaction time at this timestamp (ms, full + preview, summed) |
| postMediaId      | varchar | FK → PostMedia                           |

**Note on view summing:** Fansly distinguishes between "media views" (full content) and "preview views" (trailer/preview content). For free FYP posts, the media itself is shown. For paywalled posts, the preview is shown on FYP. Since the post type cannot be reliably determined from API data, both are summed to capture all FYP-visible engagement regardless of content surface.

#### `FanslyAnalyticsAggregate`
Pre-computed summary per PostMedia. Updated each time new datapoints arrive.

| Column                    | Type      | Description                                                 |
|---------------------------|-----------|-------------------------------------------------------------|
| id                        | uuid      | Primary key                                                 |
| totalViews                | int       | Latest cumulative views                                     |
| averageEngagementSeconds  | float     | Average watch time in seconds                               |
| averageEngagementPercent  | float     | Watch time as % of video duration                           |
| fypPerformanceScore       | float?    | 0-100 composite score (views 50%, velocity 30%, engagement 20%) |
| fypMetrics                | json?     | `{ viewVelocity, sustainedGrowth, plateauPoint, isUnderperforming }` |
| fypPlateauDetectedAt      | datetime? | When growth plateau was first detected                      |
| postMediaId               | varchar   | FK → PostMedia (1:1)                                        |

#### `AnalyticsFetchHistory`
Designed to track fetched time windows to avoid redundant API calls. **Never used in application code — dead code.**

| Column              | Type     | Description                          |
|---------------------|----------|--------------------------------------|
| id                  | uuid     | Primary key                          |
| timeframeIdentifier | varchar  | Identifies the fetched time window   |
| postMediaId         | varchar  | FK → PostMedia                       |
| fetchedAt           | datetime | When the fetch happened               |
| expiresAt           | datetime?| When this fetch result expires       |
| timeframeType       | varchar  | `"rolling"` or `"fixed"`             |

#### `FanslyMediaCandidate`
Represents a media item discovered on Fansly that needs to be matched to a local PostMedia.

| Column              | Type     | Description                                 |
|---------------------|----------|---------------------------------------------|
| id                  | uuid     | Primary key                                 |
| fanslyStatisticsId  | varchar  | Fansly's media offer ID / contentId (unique) |
| fanslyPostId        | varchar  | Fansly's post ID                            |
| filename            | varchar  | Original filename on Fansly                 |
| caption             | varchar? | Post caption                                |
| fanslyCreatedAt     | bigint   | Fansly creation timestamp                   |
| position            | int      | Position within the Fansly post             |
| mediaType           | varchar  | `"image"` or `"video"`                      |
| status              | varchar  | `"pending"` / `"matched"` / `"ignored"`     |
| matchedPostMediaId  | varchar? | FK → PostMedia (when matched)               |
| matchConfidence     | float?   | 0.0-1.0 confidence of the match             |
| matchMethod         | varchar? | `exact_filename` / `fuzzy_filename` / `manual` / `auto_detected` |
| capturedAt          | datetime | When the candidate was created               |
| matchedAt           | datetime?| When the match was confirmed                 |

---

## Data Pipeline

### 1. Credential Acquisition

Fansly does not expose a public API. Credentials are obtained via the Chrome extension which intercepts every `fetch` and `XHR` call to `fansly.com` and extracts headers:

- `authorization` → `fanslyAuth`
- `fansly-session-id` → `fanslySessionId`
- `fansly-client-check` → `fanslyClientCheck`
- `fansly-client-id` → `fanslyClientId`

The extension forwards credentials to the server (throttled to 60-second intervals). A legacy manual flow also exists: pasting a `fetch()` call from DevTools into `POST /api/analytics/credentials/update-from-fetch`, which parses headers via regex.

### 2. Linking PostMedia to Fansly Statistics

Before analytics can be fetched for a PostMedia, it must have a `fanslyStatisticsId` (Fansly's `mediaOfferId` / `contentId`). Three mechanisms exist:

**Manual**: The user enters a Fansly statistics URL or 18-digit ID directly in the post detail view.

**Candidate Matching**: Media discovered on Fansly (via Chrome extension timeline interception) are imported as `FanslyMediaCandidate` records, then matched to local PostMedia:
- **Exact filename match** → confidence 1.0
- **Fuzzy filename match** → Levenshtein distance normalized to 0.0-1.0, threshold ≥0.5
- **Manual match** → user drag-and-drops or selects from a dialog
- **Bulk auto-confirm** → all candidates with confidence ≥0.95 are confirmed at once
- On match confirmation, the candidate's `fanslyStatisticsId` is written to the PostMedia

**Auto-detected**: When a candidate arrives from the extension and a PostMedia already has the same `fanslyStatisticsId`, it's auto-marked as matched.

### 3. Fetching Raw Data

`POST /api/analytics/fetch/by-id/:postMediaId` triggers a proxied call to Fansly's analytics API:

```
GET https://apiv3.fansly.com/api/v1/it/moie/statsnew
  ?mediaOfferId={fanslyStatisticsId}
  &beforeDate={endTimestamp}
  &afterDate={startTimestamp}
  &period=86400000
```

The response contains:
- **Datapoints**: Array of `{ timestamp, stats: [{ type, views, previewViews, interactionTime, previewInteractionTime, uniqueViewers, previewUniqueViewers }] }`
- **Top FYP Tags**: `{ tagId, views, interactionTime }` — which hashtags Fansly's algorithm surfaced the content through
- **Aggregation Data**: `accountMedia` (like counts, media dimensions) and `tags` (tag labels + view counts)

The `gatherFanslyPostAnalyticsDatapoints` helper filters to `stats.type === 0` and sums `views + previewViews` and `interactionTime + previewInteractionTime`.

### 4. Persisting & Aggregating

`addDatapointsToPostMedia()` performs:

1. **Save hashtags** from `topFypTags` and `aggregationData.tags` (for Fansly channels only)
2. **Upsert datapoints**: For each timestamp, update existing or create new `FanslyAnalyticsDatapoint`
3. **Compute aggregates** using `aggregatePostMediaAnalyticsData()`:
   - Sorts datapoints chronologically
   - Computes cumulative views over days
   - Calculates average watch time (seconds and percent of video duration)
   - Fills gaps between data points with linear interpolation
   - Ensures views are monotonically non-decreasing
   - Optionally trims at detected plateau
4. **Calculate FYP metrics**: view velocity, sustained growth, plateau point, underperformance flag
5. **FYP performance score** (0-100 composite): views 50%, velocity 30%, engagement 20%
6. **Plateau detection** via moving-average algorithm with adaptive thresholds

### 5. Gap Detection & Incremental Fetching

`fetchDatapoints()` detects when the latest stored datapoint is more than 24 hours old and returns `hasGap: true` with a `suggestedFetchRange`. The chart UI renders a clickable "Fetch More" overlay.

---

## Subsystems

### FYP Actions (`/api/analytics/fyp-actions`)

Computes two action lists over a 90-day FYP window:

**Consider Removing**: Posts within the 90-day window that have plateaued and are below a user-adjustable performance threshold (default: 50% of 90-day average).

**Ready to Repost**: Posts beyond the 90-day window that performed above average — eligible for another FYP cycle.

### Analytics Health (`/api/analytics/health`)

Monitors data coverage: coverage %, stale data count (>3 days), pending candidate matches, high-confidence unconfirmed matches. Displayed as a color-coded badge.

### Insights (`/api/analytics/insights`)

Rule-based insight generator analyzing video length, hashtags, content themes, and posting times. Produces recommendations with confidence scores. **Fully implemented server-side with query hooks, but no frontend UI exists.**

### Hashtag & Time Analytics

Backend endpoints and query hooks for per-hashtag and per-time-period performance aggregation. **No frontend UI exists.**

---

## Frontend

### Analytics Dashboard (`/analytics`)

Two-tab layout: **FYP Actions** (remove/repost recommendations with threshold selector) and **Matching** (split-pane candidate matching interface with drag-and-drop).

### Post Detail Analytics

Per-post view: statistics ID input, Visx area chart with 7-day/30-day markers, gap detection overlay.

### Query Layer

15 TanStack Query hooks wrapping the type-safe Hono RPC client.

---

## Current Limitations & Gaps

1. **Not used by the creator**: The system is too clunky to use in practice. The multi-step workflow (extension + matching + manual fetching) creates too much friction.
2. **No automated data fetching**: Analytics must be manually triggered per-PostMedia via "Fetch" button.
3. **Credential opacity**: No visibility into whether credentials are fresh or stale. Silent failures when they expire.
4. **Matching is busywork**: The candidate matching interface requires manual review of fuzzy matches — a full split-pane UI for what should be an automatic process.
5. **Extension behavior is opaque**: No activity log or visibility into what the extension is capturing or sending.
6. **Speculative features built**: Insights engine, hashtag analytics, time analytics, content theme analysis — all implemented but never surfaced in UI and never validated against actual user needs.
7. **Duplicate aggregation logic**: Three near-identical implementations of time-series aggregation across server and frontend.
8. **Dead code**: `AnalyticsFetchHistory` entity is defined but never read or written.
9. **Overengineered data model**: `fypPerformanceScore` and `fypMetrics` JSON blob store derived values that go stale and could be computed on demand.

---

## Extrapolated Original Vision

The analytics feature was designed as a **data-driven FYP optimization assistant** for Fansly creators. The core insight: Fansly's FYP operates on a ~90-day rotation window with limited slots per creator. By monitoring which posts are plateauing and underperforming, creators can strategically remove them to free slots for better content, and recycle proven performers after their natural cycle expires.

The vision included a full content intelligence platform: hashtag optimization, posting schedule optimization, content theme analysis, and AI-powered recommendations. However, the fundamental data acquisition pipeline was too manual and opaque, so the creator never adopted the system — making all downstream analysis moot.

---

# Part 2: Redesign Plan

## Motivation

The existing analytics system is not used because the data acquisition pipeline requires too many manual steps:

1. Keep Chrome extension + Fansly + FansLib all running simultaneously
2. Browse Fansly's timeline so the extension can intercept and discover media
3. Review and confirm candidate matches in a split-pane UI
4. Manually trigger analytics fetches per-post via "Fetch" button
5. Repeat fetching regularly to keep data fresh

The redesign eliminates all manual steps except the one thing the user already does: **scheduling posts on Fansly**.

## Design Principles

1. **Zero additional clicks**: If the user is already doing something (scheduling a post), piggyback on that action. Never require a separate step.
2. **Minimize Fansly API calls**: The API is private and undocumented. Be conservative — fetch only when needed, back off when data stops changing, stop entirely when credentials expire.
3. **Fail visibly**: When something goes wrong (stale credentials, failed fetch), surface it clearly in the UI. Never fail silently.
4. **Compute on demand, not in advance**: Don't pre-compute derived metrics that go stale. Store raw data and aggregates; derive insights at query time.
5. **No direct Fansly mutations**: Never use the Fansly API to *create* or *modify* data (scheduling, posting). Only read analytics data. The Chrome extension intercepts browser traffic passively — this is safe and undetectable.

## New Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER'S WORKFLOW                            │
│                                                                  │
│  1. Opens FansLib side panel in Chrome extension                  │
│  2. Opens Fansly scheduling page in same tab                     │
│  3. Copies caption, uploads media, sets walls/permissions/date   │
│  4. Hits "Schedule" on Fansly                                    │
│     (this is the ONLY action the user takes)                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                               │
│                                                                  │
│  Intercepts scheduling response automatically:                   │
│  ├── Extracts contentId from postTemplate.attachments[0]         │
│  ├── Extracts caption from postTemplate.content                  │
│  ├── Compares caption to current queue post (Levenshtein ≥ 0.9)  │
│  ├── On match: sends PATCH to server (status + contentId)        │
│  ├── Auto-advances side panel to next queue post                 │
│  └── Shows "✓ Linked" confirmation                              │
│                                                                  │
│  Also passively intercepts (on any Fansly browsing):             │
│  ├── Credentials from request headers (throttled 60s)            │
│  └── Timeline data for backfill matching                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FANSLIB SERVER (always-on via Tailscale)       │
│                                                                  │
│  On scheduling capture:                                          │
│  ├── PATCH /api/posts/by-id/:id → { status: "scheduled" }       │
│  ├── PATCH /api/posts/post-media/by-id/:id                      │
│  │   → { fanslyStatisticsId: contentId }                         │
│  └── Sets nextFetchAt on aggregate → tomorrow                   │
│                                                                  │
│  Background analytics cron (hourly):                             │
│  ├── Checks credential freshness                                 │
│  ├── Finds aggregates where nextFetchAt < now                   │
│  ├── Fetches analytics from Fansly API                           │
│  ├── Updates datapoints + aggregate                              │
│  └── Computes next nextFetchAt based on growth velocity          │
│                                                                  │
│  On 401/403:                                                     │
│  └── Marks credentials as stale, stops all fetching              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FANSLIB WEB                                    │
│                                                                  │
│  Dashboard (home route):                                         │
│  ├── Credential status indicator                                 │
│  │   ("Fansly credentials stale — open Fansly to refresh")       │
│  ├── Analytics coverage overview                                 │
│  └── Post performance summary                                   │
│                                                                  │
│  Post detail:                                                    │
│  ├── Views-over-time chart (existing, keep)                      │
│  └── Engagement metrics                                          │
└──────────────────────────────────────────────────────────────────┘
```

## New Data Model

### `FanslyAnalyticsDatapoint` (unchanged)

| Column           | Type    | Description                                    |
|------------------|---------|------------------------------------------------|
| id               | uuid    | Primary key                                    |
| timestamp        | int     | Unix timestamp (ms) of the data point          |
| views            | int     | Views at this timestamp (full + preview summed) |
| interactionTime  | int     | Interaction time (ms, full + preview summed)   |
| postMediaId      | varchar | FK → PostMedia                                 |

### `FanslyAnalyticsAggregate` (simplified)

| Column                    | Type      | Description                                 |
|---------------------------|-----------|---------------------------------------------|
| id                        | uuid      | Primary key                                 |
| totalViews                | int       | Latest cumulative views                     |
| averageEngagementSeconds  | float     | Average watch time in seconds               |
| averageEngagementPercent  | float     | Watch time as % of video duration            |
| plateauDetectedAt         | datetime? | When growth plateau was first detected       |
| nextFetchAt               | datetime? | When background fetcher should next pull data. Null = stop fetching. |
| postMediaId               | varchar   | FK → PostMedia (1:1)                         |

**Removed fields:**
- `fypPerformanceScore` — composite score with wrong weightings; can be computed on demand if ever needed
- `fypMetrics` JSON blob — derived values (velocity, sustained growth, etc.) that go stale; compute on demand from raw datapoints

### `AnalyticsFetchHistory` — REMOVED

Dead code. Never used. The `nextFetchAt` field on the aggregate replaces its intended purpose. Datapoint upsert logic (check `existingDatapointForTimestamp`) prevents duplicate data on re-fetches.

### `FanslyMediaCandidate` (kept, role changes)

Still used for **timeline backfill** (secondary flow). But matching UI moves from FansLib web app to Chrome extension side panel.

---

## Flow 1: Scheduling Capture (Primary)

**Handles ~90% of posts** — single-media posts scheduled through the normal workflow.

### Prerequisites
- Chrome extension installed
- FansLib side panel open while scheduling
- Server accessible via Tailscale

### Step-by-Step Flow

```
User schedules post on Fansly
         │
         ▼
Extension intercepts scheduling API response
         │
         ├── Extracts from response.postTemplate:
         │   ├── contentId = attachments[0].contentId
         │   ├── caption = postTemplate.content
         │   └── scheduledFor = response.scheduledFor
         │
         ▼
Extension compares caption to currently displayed queue post
         │
         ├── Uses Levenshtein distance (calculateSimilarity)
         │   Existing implementation in candidates/matching.ts
         │
         ├── Similarity ≥ 0.9 → MATCH CONFIRMED
         │   │
         │   ├── Calls PATCH /api/posts/by-id/:postId
         │   │   Body: { status: "scheduled" }
         │   │
         │   ├── Calls PATCH /api/posts/post-media/by-id/:postMediaId
         │   │   Body: { fanslyStatisticsId: contentId }
         │   │
         │   ├── Shows "✓ Linked" in side panel
         │   └── Auto-advances to next post in queue
         │
         └── Similarity < 0.9 → NO MATCH
             │
             └── Shows "Unrecognized post scheduled" in activity log
                 (no data corruption — fails safe)
```

### Why caption matching works

- The user writes captions in FansLib ~95% of the time, then copies them to Fansly
- Levenshtein ≥ 0.9 threshold tolerates minor differences: emoji additions, whitespace, trailing characters, encoding quirks
- No sequential ordering assumption — each scheduling response is independently matched against the currently displayed post
- If the user schedules something NOT from the queue (spontaneous post), no match occurs and nothing breaks

### Queue definition

The queue is: posts with `status = "ready"` and `channel.typeId = "fansly"`, ordered by `date` ascending. This is the existing definition already used by the Chrome extension's side panel.

### Multi-media posts

When `postTemplate.attachments` has multiple items, only `attachments[0]` (position 0) is linked. Secondary media items are handled by Flow 2 (timeline backfill). This is acceptable because ~90% of posts have a single media item.

---

## Flow 2: Timeline Backfill (Secondary)

**Handles: multi-media post secondary items, historical posts, anything missed by Flow 1.**

### How it works

1. User browses their Fansly profile/timeline normally
2. Extension intercepts `apiv3.fansly.com/api/v1/timelinenew` responses (existing behavior)
3. Extracts candidates with `contentId`, filename, caption, position
4. Sends candidates to server via `POST /api/analytics/candidates`
5. Server auto-matches if a PostMedia already has the same `fanslyStatisticsId`
6. For unmatched candidates, server computes match suggestions (filename-based)

### Matching UI moves to Chrome extension

**Current state:** Matching happens in FansLib's web app via a full split-pane interface (`MatchingSection.tsx`) — context switch away from Fansly.

**New state:** Matching happens in the extension's side panel while browsing Fansly:

- Side panel shows: "3 unmatched posts found"
- Each shows Fansly filename + caption + suggested local match
- One tap to confirm, one tap to ignore
- Simple list, no split-pane, no drag-and-drop

### Activity log

The extension side panel includes a persistent activity log showing all automated actions:

```
✓ Captured contentId for "poolside vibes #summer"
✓ Linked to PostMedia IMG_4821.mp4
✓ Backfill: matched 3 posts from timeline
⚠ 2 posts unmatched — tap to review
⚠ Credentials last refreshed 2 days ago
```

This addresses the opacity problem — the user always knows what the extension is doing.

---

## Flow 3: Background Analytics Fetching

**Replaces the manual "Fetch" button entirely.**

### Adaptive baton-race scheduling

Each analytics fetch decides when the *next* fetch should happen, based on what the data looks like:

```
PostMedia gets fanslyStatisticsId linked
         │
         └── Set nextFetchAt = tomorrow
                  │
                  ▼
         Cron runs (hourly), finds due aggregates
                  │
                  ├── Check: are credentials fresh?
                  │   ├── No → skip all, log warning
                  │   └── Yes → continue
                  │
                  ├── Fetch analytics from Fansly API
                  │   GET /api/v1/it/moie/statsnew?mediaOfferId=...
                  │
                  ├── Upsert datapoints
                  ├── Update aggregate (totalViews, engagement, plateau)
                  │
                  └── Compute next interval:
                      │
                      ├── Sustained growth > 5%  → nextFetchAt = now + 1 day
                      ├── Growth slowing (1-5%)  → nextFetchAt = now + 3 days
                      ├── Plateaued (< 1%)       → nextFetchAt = now + 7 days
                      └── Plateaued + > 90 days  → nextFetchAt = null (stop)
```

### Growth rate calculation

After each fetch, compute the growth rate from the last two datapoints:

```
growthRate = previousViews > 0
  ? ((currentViews - previousViews) / previousViews) * 100
  : 100
```

This uses the existing plateau detection math from `fyp-performance.ts`.

### API call minimization

- **Tiered intervals**: Fresh posts get daily checks, plateaued posts get weekly, expired posts stop entirely
- **Credential gating**: On first 401/403, mark credentials stale and halt ALL fetches (not just the failing one). Resume only when fresh credentials arrive.
- **No retry storms**: If a fetch fails for non-credential reasons, push `nextFetchAt` back by the current interval (don't hammer)
- **Batch awareness**: The cron should process fetches with small delays between them (e.g., 2-second gaps) to avoid burst traffic to Fansly's API

### Infrastructure

Uses the existing `croner` library (already in use for scheduled-posts cron and tag-drift-prevention cron). New cron job runs hourly, same initialization pattern as existing crons in `index.ts`.

No persistent job queue needed — the `nextFetchAt` column on the aggregate IS the queue. The cron just queries for due items each tick.

---

## Credential Lifecycle

### Current state
- Extension intercepts credentials on every Fansly API call
- Sends to server throttled at 60-second intervals
- Server stores via settings/credentials subsystem
- No staleness tracking, no visibility into freshness

### New state

```
Extension intercepts Fansly request
    │
    ├── Extracts credentials from headers
    ├── Sends to server (throttled 60s)
    │
    ▼
Server receives credentials
    │
    ├── Saves credentials
    ├── Sets credentialsLastRefreshedAt = now
    ├── Clears credentialsStale flag (if set)
    └── Background fetcher resumes (if was paused)

Background fetcher gets 401/403
    │
    ├── Sets credentialsStale = true
    ├── Stops ALL analytics fetching
    └── Dashboard shows: "Fansly credentials expired"
        with link to open fansly.com

User clicks link, browses Fansly briefly
    │
    └── Extension intercepts a request → credentials refresh → cycle continues
```

### Dashboard visibility

The FansLib web app's dashboard (home route) shows:
- **Green**: "Credentials fresh (last updated 2 hours ago)"
- **Yellow**: "Credentials aging (last updated 2 days ago)" — still working but may expire soon
- **Red**: "Credentials expired — [open Fansly to refresh]" — link opens fansly.com

---

## What Gets Removed

### Server-side code to remove

| Component | Files | Reason |
|-----------|-------|--------|
| Insights engine | `operations/insights.ts`, `schemas/insights.ts` | Speculative feature, never surfaced in UI, not validated against user needs |
| Hashtag analytics | `operations/post-analytics/fetch-hashtag-analytics.ts` | Speculative, no UI |
| Time analytics | `operations/post-analytics/fetch-time-analytics.ts` | Speculative, no UI |
| `AnalyticsFetchHistory` entity | `entity.ts` (partial) | Dead code, never used, replaced by `nextFetchAt` |
| `fypPerformanceScore` column | `entity.ts` (partial) | Derived metric with wrong weightings, compute on demand |
| `fypMetrics` JSON column | `entity.ts` (partial) | Derived metrics that go stale, compute on demand |
| FYP performance score calculator | `fyp-performance.ts` (partial — keep plateau detection) | Unused after aggregate simplification |
| Manual credential parser | `operations/credentials.ts` | Replaced by extension auto-capture |
| Duplicate aggregation function | `lib/fansly-analytics/aggregate.ts` (`aggregatePostAnalyticsData`) | Near-identical to `aggregatePostMediaAnalyticsData`, consolidate |
| Insights-related routes | `routes.ts` (3 endpoints: `/insights`, `/hashtags`, `/time`) | No UI, speculative |
| Insights-related query hooks | `lib/queries/analytics.ts` (3 hooks) | Corresponding to removed endpoints |

### Frontend code to remove

| Component | Files | Reason |
|-----------|-------|--------|
| Matching tab + all components | `MatchingSection.tsx`, `CandidateCard.tsx`, `SelectPostMediaDialog.tsx` | Matching moves to Chrome extension |
| Manual "Fetch More" overlay | `AnalyticsViewsChart.tsx` (partial) | Background fetcher handles this |
| Manual statistics ID input | `PostDetailFanslyStatistics.tsx` | Scheduling capture handles this |
| Insights/hashtag/time query hooks | `lib/queries/analytics.ts` (partial) | Endpoints removed |

### Code to keep and adapt

| Component | Adaptation needed |
|-----------|-------------------|
| `FypActionItemsSection.tsx` | Keep — derives metrics on demand from datapoints instead of pre-computed scores |
| `AnalyticsViewsChart.tsx` | Keep chart, remove "Fetch More" overlay |
| `ConfidenceIndicator.tsx` | Adapt to also show credential freshness |
| `HealthDetailsDrawer.tsx` | Adapt to show credential status + fetch schedule health |
| Plateau detection (`plateau-detection.ts`) | Keep — used by background fetcher for adaptive scheduling |
| Candidate system (server) | Keep — still used for timeline backfill |
| Datapoint aggregation | Consolidate duplicates into one implementation |

---

## Key Architectural Decisions

### Decision 1: Intercept scheduling calls, not timeline calls, as primary linking mechanism
**Why**: The scheduling response contains the `contentId` at the exact moment the user is already interacting with the post. No discovery step, no matching ambiguity. Timeline interception becomes a fallback, not the primary path.

### Decision 2: Caption matching via Levenshtein (≥ 0.9) as the safety gate
**Why**: The user writes captions in FansLib and copies them to Fansly. Exact match would break on encoding differences, emoji additions, whitespace. Fuzzy matching at 90% threshold is tolerant of minor variations while preventing false positives. The existing `calculateSimilarity` implementation in `candidates/matching.ts` is reused.

### Decision 3: Auto-advance instead of "mark as scheduled" click
**Why**: The "mark as scheduled" button was the last remaining manual step. Since the extension can detect the scheduling response and match it to the current queue post, the click becomes unnecessary. This makes the scheduling flow truly zero-friction — the side panel just keeps up as you work.

### Decision 4: `nextFetchAt` on aggregate instead of a job queue
**Why**: The workload is small (20-50 posts, fetched at varying intervals). A proper job queue (BullMQ, pg-boss) adds infrastructure complexity for no benefit. The aggregate table IS the queue — the cron just queries `WHERE nextFetchAt < now`. Existing `croner` library handles the scheduling.

### Decision 5: Adaptive fetch intervals based on growth velocity
**Why**: Not all posts need the same fetch frequency. A post gaining 500 views/day needs daily monitoring. A plateaued post needs weekly at most. A post past 90 days doesn't need fetching at all. This minimizes API calls to Fansly while keeping data fresh where it matters.

### Decision 6: Credential-gated fetching with immediate halt on 401/403
**Why**: Fansly's API is private and undocumented. Hammering it with invalid credentials risks account flags. On first auth failure, stop ALL fetching immediately and surface the problem to the user. Resume only when fresh credentials arrive from the extension.

### Decision 7: Drop speculative insights engine
**Why**: The insights engine (video length analysis, hashtag performance, content themes, posting times) was built speculatively without validating against user needs. The user has never seen this data. The FYP algorithm primarily optimizes for **average engagement percent** (50-60% being the sweet spot), which is already captured in `averageEngagementPercent` on the aggregate. Additional derived insights can be rebuilt later if there's actual demand.

### Decision 8: Keep views + preview views summed together
**Why**: Fansly shows either the actual media (free posts) or the preview media (paywalled posts) on the FYP, depending on post permissions. Since the post type cannot be reliably determined from API data, summing both ensures all FYP-visible engagement is captured regardless of content surface. Splitting them would create a false precision problem.

### Decision 9: Move matching UI from web app to Chrome extension
**Why**: Matching is needed when browsing Fansly — that's where the unmatched content is visible. Requiring a context switch to FansLib's web app for matching is unnecessary friction. The extension side panel is already open during scheduling and can show a simple match confirmation UI for backfill candidates.

### Decision 10: Server is always-on via Tailscale, not localhost
**Why**: The server runs on a local server accessible via Tailscale, not on the user's development machine. This means the Chrome extension can always reach it, background crons always run, and there's no dependency on having a specific app open. This is a critical enabler for the background fetching design.

---

## Open Questions

1. **Dashboard design**: The plan calls for a new home route/dashboard showing credential status and analytics overview. What specific metrics should this dashboard show beyond credential freshness? Post performance trends? FYP slot usage?

2. **Fetch scheduling thresholds**: The growth rate thresholds (>5% = daily, 1-5% = 3 days, <1% = weekly) are initial guesses. Should these be configurable, or tuned based on actual data patterns?

3. **Cron batch size**: If many posts are due for fetching at the same time (e.g., after a credential refresh), should the cron process all of them in one tick or cap at N per tick to spread load?

4. **Extension activity log persistence**: Should the activity log persist across browser sessions (via `chrome.storage.local`) or be ephemeral? Persistent logs help debugging but consume storage.

5. **Multi-media backfill urgency**: For the ~10% of posts with multiple media, how important is it to capture analytics for secondary media items? Should backfill matching be prompted proactively, or is it fine to wait until the user happens to browse their timeline?

6. **Migration path**: What happens to existing data? There are existing `FanslyAnalyticsAggregate` records with `fypMetrics` and `fypPerformanceScore`. Do we migrate (drop columns), or leave them and ignore?
