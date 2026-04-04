## Problem Statement

FansLib posts that were created and posted to Fansly but never linked to their Fansly analytics counterpart have no way to be retroactively connected. The only linking mechanisms today are:

1. **Schedule capture** — the Chrome extension intercepts the Fansly schedule API call and links the first PostMedia automatically. This only works for posts scheduled through the extension's queue flow.
2. **Backfill candidates** (Fansly → FansLib) — the extension extracts candidates from the Fansly timeline, and the user matches them to FansLib PostMedia. This requires scrolling through the Fansly timeline until the extension captures the relevant posts.

There is no **FansLib → Fansly** flow: starting from an unlinked FansLib post and finding its Fansly counterpart. Posts that fell through both existing mechanisms (e.g., posted manually on Fansly, or the extension missed the schedule capture) remain permanently unlinked with no analytics tracking.

Additionally, "Backfill" is a confusing name that doesn't communicate what the tab does.

## Solution

Revamp the Chrome extension's "Backfill" tab into a bidirectional matching interface called "Post Analytics," split into two directional sections:

1. **Fansly → FansLib** (existing backfill flow, renamed) — Fansly posts detected via timeline interception that need to be matched to FansLib PostMedia. Keep existing functionality.

2. **FansLib → Fansly** (new) — FansLib posts that were posted but never linked to Fansly analytics. The user navigates to the corresponding Fansly statistics page, and the extension intercepts the stats API call to extract all attachment IDs with durations. The server then auto-matches the preview attachment using the duration-based preview heuristic (shortest video = preview).

When a link is made in either direction, any corresponding entry in the other direction is automatically cleaned up to prevent duplicate matching attempts.

## User Stories

1. As a creator, I want to see which of my posted Fansly posts are missing analytics links, so that I can identify gaps in my tracking coverage.
2. As a creator, I want to link an unlinked FansLib post to its Fansly counterpart by navigating to the Fansly statistics page, so that analytics tracking starts for posts that were missed by automatic flows.
3. As a creator, I want the extension to automatically identify which attachment is the preview (for FYP tracking) when I'm on a statistics page, so that I don't have to manually figure out which thumbnail is the teaser.
4. As a creator, I want analytics tracking to start immediately after linking a post, so that I don't miss any more data.
5. As a creator, I want the "Link" button to only appear when I'm on a Fansly statistics page, so that the UI is contextual and not confusing.
6. As a creator, I want to see the FansLib post's thumbnail and caption alongside the "Link" action, so that I can verify I'm linking the correct post.
7. As a creator, I want linking in one direction to automatically clean up pending entries in the other direction, so that I don't see duplicate matching requests.
8. As a creator, I want the tab to be called "Post Analytics" instead of "Backfill," so that it's clear what the feature does.
9. As a creator, I want both matching directions visible in the same tab, so that I can see the full picture of what needs linking.
10. As a creator, I want unlinked posts sorted by date (newest first), so that I can prioritize linking recent posts that are still relevant for FYP analytics.
11. As a creator, I want to see how many unlinked posts I have at a glance (count badge or similar), so that I know whether there's work to do.
12. As a creator, I want the existing Fansly → FansLib matching flow to continue working as before, so that nothing breaks during the revamp.
13. As a creator, I want each unlinked post to show its media duration, so that I can find the right post on Fansly's statistics page.
14. As a creator, I want the extension to detect when I'm on a Fansly statistics page without me having to do anything, so that the linking flow is seamless.
15. As a creator, I want to be able to dismiss/skip an unlinked post if I don't want to link it (e.g., it was a test post), so that my unlinked list stays manageable.

## Implementation Decisions

### Granularity: Post vs PostMedia

- **FYP lifecycle flags** (`fypRemovedAt`, `fypManuallyRemoved`) stay on the **Post** entity. "Remove from FYP" is a post-level action on Fansly.
- **Analytics linking** (`fanslyStatisticsId`, aggregates, datapoints) operates at the **PostMedia** level. Each attachment has its own statistics ID and tracking.
- The "unlinked posts" endpoint returns **Posts** that have at least one PostMedia the preview heuristic identifies as FYP-trackable but that PostMedia has no `fanslyStatisticsId`.

### Statistics page extraction

- Fansly statistics pages have URL pattern `fansly.com/statistics/{id}`.
- The URL ID does **not** change when switching between attachment thumbnails on the page.
- The extension intercepts the stats API call (`apiv3.fansly.com/api/v1/it/moie/statsnew`) that the Fansly SPA makes when loading the statistics page.
- The API response includes `aggregationData.accountMedia` — an array with each attachment's `id` (the `mediaOfferId` / `fanslyStatisticsId`) and `media.duration`.
- The extension extracts **all** attachment IDs with durations and sends them to the server.
- The server matches by duration against local PostMedia using the preview heuristic (shortest video = preview), and links the correct one automatically.

### Cross-direction cleanup

- When linking FansLib → Fansly: find any `FanslyMediaCandidate` row with the same `fanslyStatisticsId` and auto-resolve it (set status to "matched," link to the same PostMedia).
- When matching Fansly → FansLib (existing flow): the PostMedia gets `fanslyStatisticsId` set, so it naturally drops out of the unlinked posts query. No explicit cleanup needed.

### Chrome extension architecture

- The extension already patches `window.fetch` and `XMLHttpRequest` in the MAIN world to intercept Fansly API calls. The stats API interception follows the same pattern.
- URL detection for `fansly.com/statistics/*` triggers a "Link" button state in the extension UI.
- The existing tab structure (`"queue" | "backfill" | "credentials"`) changes to `"queue" | "post-analytics" | "credentials"`.
- The "Post Analytics" tab is split into two sections: "Fansly → FansLib" (existing candidates flow) and "FansLib → Fansly" (new unlinked posts flow).

### Server endpoints

- `GET /api/analytics/unlinked-posts` — returns posted Fansly posts where the preview PostMedia has no `fanslyStatisticsId`. Includes post ID, caption, date, preview media thumbnail, preview media duration.
- `POST /api/analytics/link-post` — accepts `{ postId, attachments: [{ fanslyStatisticsId, duration }] }`. Uses duration matching + preview heuristic to assign the correct `fanslyStatisticsId` to the preview PostMedia. Creates analytics aggregate. Performs cross-direction candidate cleanup.
- Optionally accepts `fanslyPostId` to store on the Post if available.

### Skip/dismiss mechanism

- Unlinked posts can be dismissed so they don't clutter the list.
- This could use an `analyticsLinkSkipped` boolean on PostMedia, or a separate dismissed-list. Decided during implementation.

## Testing Decisions

### What makes a good test

Tests should verify external behavior through the API contract, not implementation details. Use the existing test patterns: create test data via helpers (`createTestPost`, `createTestMedia`, `createTestChannel`), call the HTTP endpoint, assert the response shape and content. Tests should be independent (each test resets fixtures).

### Modules to test

- **Unlinked posts endpoint** — returns correct posts, excludes posts where preview is already linked, excludes non-Fansly posts, excludes non-posted posts, respects preview heuristic (only flags posts where the *preview* PostMedia is unlinked)
- **Link post endpoint** — links correct PostMedia by duration matching, creates analytics aggregate, performs cross-direction candidate cleanup, handles edge cases (post not found, no duration match, already linked)
- **Preview heuristic** — already tested (12 unit tests exist)
- **Stats API interception** (chrome extension) — unit test the response parsing logic that extracts attachment IDs and durations

### Prior art

- `@fanslib/apps/server/src/features/analytics/routes.test.ts` — existing FYP analytics endpoint tests with `createActivePost` / `createPostMediaWithAggregate` helpers
- `@fanslib/apps/server/src/features/analytics/candidates/routes.test.ts` — existing candidate matching tests
- `@fanslib/apps/server/src/features/analytics/operations/fyp/preview-heuristic.test.ts` — pure function unit tests

## Out of Scope

- **Fansly post ID extraction from statistics page** — The statistics page URL contains the media offer ID, not the Fansly post ID. Capturing `fanslyPostId` from the statistics page requires investigating whether the stats API response or other page-level API calls include it. This can be added later as an enhancement.
- **Bulk linking** — Linking multiple posts at once. The initial implementation is one-at-a-time.
- **Automatic linking without user navigation** — The system cannot automatically discover which Fansly statistics page corresponds to a FansLib post. The user must navigate to the correct page.
- **Non-Fansly channels** — This feature is specific to Fansly analytics.

## Further Notes

- The preview heuristic (`identifyFypTrackableId`) and halt endpoint (`POST /api/analytics/halt-non-preview-aggregates`) were built as prerequisites and are already merged.
- The `isFreePreview` field exists on the PostMedia entity but is never set in production. It could be populated as a side effect of the duration-matching linking flow, though this is not required for the feature to work.
- The existing `confirmMatch` flow in the candidates system already integrates the preview heuristic — it only creates analytics aggregates for PostMedia that the heuristic identifies as the preview.
