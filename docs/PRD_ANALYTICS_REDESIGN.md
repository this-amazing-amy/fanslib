# PRD: Fansly Analytics Redesign

## Problem Statement

The existing Fansly analytics system is not used because the data acquisition pipeline requires too many manual steps: keeping the Chrome extension, Fansly, and FansLib all running simultaneously, browsing Fansly's timeline so the extension can discover media, reviewing and confirming candidate matches in a split-pane UI, manually triggering analytics fetches per-post, and repeating this regularly. The creator has never adopted the system, making all downstream analysis moot.

## Solution

Redesign the analytics pipeline so that the **only user action** is the one they already perform: scheduling posts on Fansly via the Chrome extension side panel. The extension intercepts Fansly's scheduling API response, automatically links the Fansly `contentId` to the local PostMedia, and a background cron job fetches analytics data on an adaptive schedule. Credentials are passively refreshed whenever the user browses Fansly. The system fails visibly (never silently) and minimizes Fansly API calls through adaptive fetch intervals.

## User Stories

1. As a content creator, I want my Fansly posts to be automatically linked to my local posts when I schedule them, so that I don't have to manually enter statistics IDs.
2. As a content creator, I want analytics data to be fetched automatically in the background, so that I never have to click a "Fetch" button.
3. As a content creator, I want to see whether my Fansly credentials are fresh, aging, or expired directly in the FansLib dashboard, so that I know when I need to open Fansly to refresh them.
4. As a content creator, I want the extension side panel to auto-advance to the next queue post after I schedule one on Fansly, so that my scheduling workflow has zero friction.
5. As a content creator, I want an activity log in the extension side panel showing what the extension captured and linked, so that I can trust the automation and debug issues.
6. As a content creator, I want the system to immediately stop all API calls when credentials expire, so that my Fansly account is never at risk.
7. As a content creator, I want the system to automatically resume fetching when I browse Fansly and credentials are refreshed, so that I don't have to restart anything manually.
8. As a content creator, I want analytics fetching to slow down for plateaued posts and stop for expired posts, so that API calls are minimized.
9. As a content creator, I want historical posts to be backfilled when I browse my Fansly timeline, so that posts scheduled before this feature existed still get tracked.
10. As a content creator, I want unmatched backfill candidates to appear in the extension side panel for quick confirmation, so that I don't have to switch to the FansLib web app.
11. As a content creator, I want the extension to show "Linked" confirmation immediately after I schedule a post on Fansly, so that I have confidence the automation worked.
12. As a content creator, I want the system to fail safely when a scheduling response doesn't match any queue post (e.g., a spontaneous post), so that no data is corrupted.
13. As a content creator, I want stale data to be clearly indicated (not silently outdated), so that I can distinguish fresh analytics from stale analytics.
14. As a content creator, I want the dead code and speculative features removed from the codebase, so that the system is simpler to maintain and reason about.
15. As a content creator, I want the duplicate aggregation logic consolidated into one implementation, so that analytics computations are consistent.

## Implementation Decisions

### Three Data Flows

**Flow 1 — Scheduling Capture (Primary, ~90% of posts):**
The Chrome extension intercepts Fansly's scheduling API response when the user schedules a post. It extracts the `contentId` from `postTemplate.attachments[0]` and the caption from `postTemplate.content`. It compares the caption to the currently displayed queue post using Levenshtein similarity (threshold >= 0.9, reusing existing `calculateSimilarity` from `candidates/matching.ts`). On match: PATCHes the post status to "scheduled", PATCHes the PostMedia with the `fanslyStatisticsId`, shows a "Linked" confirmation, and auto-advances the side panel to the next queue post. On no match: logs "Unrecognized post scheduled" in the activity log — no data corruption.

Only `attachments[0]` is linked for multi-media posts. Secondary items are handled by Flow 2. This is acceptable because multi-media posts are negligible in practice.

**Flow 2 — Timeline Backfill (Secondary):**
When the user browses their Fansly profile/timeline, the extension intercepts `timelinenew` responses (existing behavior), extracts candidates, and sends them to the server. Server auto-matches candidates where a PostMedia already has the same `fanslyStatisticsId`. Unmatched candidates with computed match suggestions appear in the extension side panel as a simple list with one-tap confirm/ignore — no split-pane, no drag-and-drop. The matching UI moves entirely from the FansLib web app to the Chrome extension.

**Flow 3 — Background Analytics Fetching:**
An hourly cron job (using existing `croner` library) queries for aggregates where `nextFetchAt < now`. For each due aggregate, it checks credential freshness, fetches analytics from the Fansly API, upserts datapoints, updates the aggregate, and computes the next fetch interval based on growth velocity.

Adaptive fetch intervals (hardcoded):
- Sustained growth > 5%: next fetch in 1 day
- Growth slowing (1-5%): next fetch in 3 days
- Plateaued (< 1%): next fetch in 7 days
- Plateaued + older than 90 days: `nextFetchAt = null` (stop fetching)

Growth rate is computed from the last two datapoints: `((current - previous) / previous) * 100`.

No batch size cap needed — at ~2 posts/day, the maximum active set is ~60-70 posts. The cron processes all due items with 2-second gaps between API calls to avoid burst traffic.

### Credential Lifecycle

The extension passively intercepts Fansly request headers (existing behavior, throttled to 60s). The server stores `credentialsLastRefreshedAt` and a `credentialsStale` flag. On any 401/403 from Fansly's API, the server sets `credentialsStale = true` and halts ALL analytics fetching (not just the failing post). When fresh credentials arrive from the extension, the flag clears and fetching resumes.

Dashboard credential status indicator:
- **Green**: last refreshed < 24 hours ago
- **Yellow**: last refreshed 24–72 hours ago
- **Red**: credentials marked stale (401/403 received), with a link to open fansly.com

### Data Model Changes

**`FanslyAnalyticsAggregate` — simplified:**
- **Added:** `nextFetchAt` (datetime, nullable) — when the background fetcher should next pull data. Null means stop fetching. This column IS the fetch queue.
- **Added:** `plateauDetectedAt` (datetime, nullable) — when growth plateau was first detected.
- **Removed:** `fypPerformanceScore` — composite score with arbitrary weightings, not currently useful.
- **Removed:** `fypMetrics` JSON blob — derived values that go stale; can be computed on demand from raw datapoints if ever needed.

**`AnalyticsFetchHistory` — dropped entirely.** Dead code, never used. The `nextFetchAt` field replaces its intended purpose.

**`FanslyAnalyticsDatapoint` — unchanged.**

**`FanslyMediaCandidate` — unchanged**, but its role shifts: matching UI moves from FansLib web to Chrome extension.

**Migration strategy:** Drop removed columns and the `AnalyticsFetchHistory` table via TypeORM migration.

### Extension Activity Log

A persistent rolling log stored in `chrome.storage.local`, capped at 100 entries. Each entry has a timestamp, type (success/warning/error), and message. Examples:
- `"Captured contentId for 'poolside vibes #summer'"`
- `"Linked to PostMedia IMG_4821.mp4"`
- `"Backfill: matched 3 posts from timeline"`
- `"2 posts unmatched — tap to review"`
- `"Credentials last refreshed 2 days ago"`

Displayed in the extension side panel as a scrollable list.

### Chrome Extension Architecture

The extension codebase is in good shape (modular interceptor → bridge → background → UI flow). Changes follow existing patterns:
- Expand `fansly-interceptor.ts` to also monitor Fansly's scheduling API endpoint (in addition to the existing `timelinenew` interception)
- Add a new message type (`FANSLIB_SCHEDULE_CAPTURE`) through the existing bridge → background pipeline
- Background script handles the server PATCH calls and activity log writes
- Side panel gets an activity log tab and a simplified matching list for backfill candidates
- "Mark as Scheduled" button becomes vestigial (auto-advance replaces it) but can be kept as manual fallback

### API Changes

**New/Modified server endpoints:**
- Credential status stored with `credentialsLastRefreshedAt` timestamp and `credentialsStale` boolean, exposed via a health/status endpoint for the dashboard
- Existing `PATCH /api/posts/by-id/:id` and `PATCH /api/posts/post-media/by-id/:id` are reused by the extension (no new endpoints needed for scheduling capture)
- Background cron is a new server-side scheduled job, no new HTTP endpoint needed (it queries the database directly)

### Code to Remove

**Server-side:**
- Insights engine (`operations/insights.ts`, `schemas/insights.ts`)
- Hashtag analytics endpoint and operation
- Time analytics endpoint and operation
- `AnalyticsFetchHistory` entity
- `fypPerformanceScore` and `fypMetrics` columns from aggregate entity
- FYP performance score calculator (keep plateau detection)
- Manual credential parser (`operations/credentials.ts`)
- Duplicate aggregation function (`lib/fansly-analytics/aggregate.ts` → consolidate with `aggregatePostMediaAnalyticsData`)
- Insights/hashtags/time routes (3 endpoints)
- Corresponding query hooks

**Frontend (web app):**
- Matching tab and all components (`MatchingSection.tsx`, `CandidateCard.tsx`, `SelectPostMediaDialog.tsx`)
- Manual "Fetch More" overlay from `AnalyticsViewsChart.tsx`
- Manual statistics ID input (`PostDetailFanslyStatistics.tsx`)
- FYP Actions tab and components (`FypActionItemsSection.tsx`, `FypPostCard.tsx`)
- Insights/hashtag/time query hooks
- Analytics dashboard (to be rebuilt later when visualization is in scope)

### Key Architectural Decisions

1. **Intercept scheduling calls as primary linking mechanism** — the scheduling response contains the `contentId` at the exact moment the user acts. No discovery step, no matching ambiguity.
2. **Caption matching via Levenshtein >= 0.9** — tolerates minor differences (emoji, whitespace, encoding) while preventing false positives. Reuses existing implementation.
3. **Auto-advance replaces "mark as scheduled" click** — the extension detects scheduling and advances automatically, making the flow zero-friction.
4. **`nextFetchAt` on aggregate instead of a job queue** — the aggregate table IS the queue. At ~60 active posts, a proper job queue adds complexity for no benefit.
5. **Credential-gated fetching with immediate halt on 401/403** — protects against hammering Fansly's private API with invalid credentials.
6. **Drop speculative features** — insights engine, hashtag analytics, time analytics were built without validation. Remove to reduce complexity.
7. **Keep views + preview views summed** — post type cannot be reliably determined from API data; splitting creates false precision.
8. **Matching UI moves to Chrome extension** — matching is needed while browsing Fansly, not in a separate web app.
9. **Server always-on via Tailscale** — enables reliable background cron execution and Chrome extension connectivity.

## Testing Decisions

A good test verifies **external behavior through the public interface** — given specific inputs, assert on outputs and side effects. Do not test implementation details like internal method calls, private state, or intermediate computations. Tests should survive refactoring as long as the behavior stays the same.

### Modules to test

**Background analytics cron (server):**
- Given a PostMedia with `nextFetchAt` in the past and fresh credentials → fetches data, upserts datapoints, updates aggregate, computes correct next `nextFetchAt` based on growth rate
- Given stale credentials → skips all fetches, does not call Fansly API
- Given a 401/403 response → marks credentials stale, halts fetching, sets no `nextFetchAt`
- Given credential refresh after stale state → clears stale flag, resumes fetching
- Given growth rate at different thresholds → sets correct `nextFetchAt` interval (1d/3d/7d/null)

**Datapoint aggregation (server, consolidated):**
- Given raw datapoints → computes correct totalViews, averageEngagementSeconds, averageEngagementPercent
- Given datapoints with gaps → handles interpolation correctly
- Given monotonically non-decreasing views constraint → enforces it

**Scheduling capture flow (extension → server integration):**
- Given a scheduling API response with caption matching a queue post (similarity >= 0.9) → PATCHes post status and PostMedia `fanslyStatisticsId`
- Given a scheduling API response with no matching queue post → no server mutations, activity log entry created
- Given caption similarity exactly at boundary (0.89 vs 0.90) → correct match/no-match decision

**Candidate matching (server):**
- Given a candidate with `fanslyStatisticsId` matching an existing PostMedia → auto-matched
- Given a candidate with no match → stays pending with computed suggestions

### Prior art

The existing test suite in `features/posts/routes.test.ts` and `features/analytics/routes.test.ts` establishes the pattern: Bun test runner, Hono test utilities (`app.request()`), `setupTestDatabase()`/`teardownTestDatabase()` lifecycle, `resetAllFixtures()` for test data, `parseResponse()` for devalue-decoded responses.

## Out of Scope

- **Data visualization / charts**: No new charts, dashboards, or visual analytics UI. The existing `AnalyticsViewsChart.tsx` is kept as-is but not enhanced.
- **FYP Actions tab**: The "Consider Removing" / "Ready to Repost" lists need a fundamental rethink and are excluded from this work.
- **Analytics dashboard redesign**: The web app dashboard will only show credential status for now. A full analytics dashboard is future work.
- **Insights engine rebuild**: Hashtag optimization, posting time analysis, content theme analysis — all deferred until there's validated demand.
- **Multi-media post handling beyond first attachment**: Only `attachments[0]` is captured via scheduling. Secondary items rely on timeline backfill, which is best-effort.
- **Configurable fetch thresholds**: Growth rate thresholds are hardcoded. Configurability is deferred until real-world tuning data exists.

## Further Notes

- The server runs always-on via Tailscale, which is a prerequisite for background cron execution. This is the existing deployment model.
- The Chrome extension's `fansly-interceptor.ts` currently only watches `timelinenew` — it needs to be expanded to also intercept Fansly's scheduling endpoint. The exact endpoint URL will need to be discovered by inspecting Fansly's network traffic during a scheduling action.
- The Levenshtein similarity implementation already exists in `candidates/matching.ts` and can be reused directly.
- The `croner` library is already used for two existing cron jobs (scheduled posts, tag drift prevention). The new analytics cron follows the same initialization pattern.
- At ~2 posts/day, the system will have ~60 posts in active rotation and ~730/year total. This is well within SQLite's capabilities and doesn't require any scaling considerations.
