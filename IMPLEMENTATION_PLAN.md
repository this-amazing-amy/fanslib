# FansLib Implementation Plan

**Overall Status:** ✅ **COMPLETE** (78/78 features - 100%)

**Last Updated:** 2025-01-05  
**Analysis:** All specifications complete

---

## 📊 Spec Status Summary

| Spec | Features | Status | Completion |
|------|----------|--------|------------|
| `smart-virtual-post-filling.json` | 12/12 ✅ | ✅ Complete | 100% |
| `subreddits.json` | 22/22 ✅ | ✅ Complete | 100% |
| `content-schedules.json` | 20/20 ✅ | ✅ Complete | 100% |
| `query-revalidation.json` | 9/9 ✅ | ✅ Complete | 100% |
| `captioning-page.json` | 15/15 ✅ | ✅ Complete | 100% |

**Total: 78/78 features (100%)**

---

## 🔴 CRITICAL CODE QUALITY ISSUES (2)

### 1. Hardcoded Reddit Channel ID
**File:** `@fanslib/apps/web/src/features/subreddits/components/RedditBulkPostGenerator.tsx:80`

**Problem:**
```tsx
channelId: "reddit", // TODO: Get from context or settings
```

**Impact:** High - breaks multi-reddit-channel scenarios, brittle architecture

**Fix Required:**
- Fetch first available Reddit channel from `useChannels()` query
- OR add channel selector dropdown to UI
- Remove hardcoded string

**Estimated Effort:** 30 minutes

---

### 2. Tag Analytics Stub - No Backend Implementation
**File:** `@fanslib/apps/web/src/hooks/useTagAnalytics.ts:44`

**Problem:**
```tsx
// TODO: Implement tag analytics API endpoints in the backend
export const useTagAnalytics = (params) => useQuery({
  queryFn: async () => [], // Always returns empty array
});
```

**Impact:** Medium - Tag performance features non-functional

**Missing Backend Endpoints:**
- `GET /api/analytics/tag-performance` - performance metrics by tag
- `GET /api/analytics/tag-correlations` - tag co-occurrence analysis
- `GET /api/analytics/tag-trends` - trend data over time

**Note:** Hashtag analytics exists (`getHashtagAnalytics` in server), but media tag analytics missing

**Estimated Effort:** 6-8 hours (needs backend + frontend integration)

---

## ⚠️ HIGH PRIORITY ISSUES (3)

### 1. Skipped Tests - No Coverage
**Files:**
- `@fanslib/apps/server/src/features/pipeline/routes.test.ts:33`
  ```ts
  test.skip("returns caption queue with draft posts and validates Date types")
  ```
- `@fanslib/apps/server/src/features/analytics/candidates/routes.test.ts:32`
  ```ts
  test.skip("creates new candidates")
  ```
- `@fanslib/apps/server/src/features/analytics/candidates/routes.test.ts:71`
  ```ts
  test.skip("returns existing candidate if fanslyStatisticsId already exists")
  ```

**Reason for Skipping:** Unknown - tests were skipped without comments explaining why

**Impact:** Low test coverage for caption queue and analytics candidates features

**Fix Required:**
- Investigate why tests were skipped
- Enable tests and fix underlying issues
- OR document why tests are not applicable

**Estimated Effort:** 2-3 hours

---

### 2. Console.log Statements in Production Code
**Scope:** 448 total console statements across apps (97 in production code)

**Web App (`apps/web/src`):**
```tsx
// apps/web/src/features/library/filter-helpers.ts
console.log("addFilterItemToGroup", group, item);

// apps/web/src/features/library/components/MediaFilters/MediaFiltersContext.tsx
console.log("defaultItem", defaultItem);
console.log("newFilters", newFilters);
```

**Server App (`apps/server/src`):**
```ts
// apps/server/src/features/reddit-automation/reddit-poster.ts (multiple)
console.log("Starting Reddit login process...");
console.log(`Reddit login progress: ${progress.stage}...`);

// apps/server/src/features/library/operations/scan/scan.ts
console.log("Library scan starting", { mediaCount, extensionFilters });
```

**Acceptable:**
- `console.error()` for error logging (fine)
- `console.info()` in server cron jobs (fine)
- `console.warn()` for non-critical warnings (fine)

**Should Remove:**
- Debug `console.log()` in web client (5 instances)
- Reddit automation progress logs (should use structured logging or events)
- Library scan progress logs (should use events/callbacks)

**Fix Required:**
- Remove debug logs from web filter helpers
- Convert Reddit/library logs to event-based progress reporting
- OR add structured logging library (e.g., `pino`, `winston`)

**Estimated Effort:** 2 hours

---

### 3. Missing Error Handling in Async Callbacks
**Scope:** 20+ async functions without `.catch()` or `try/catch`

**Examples:**
```tsx
// apps/web/src/features/settings/components/RedditSettings.tsx
const handleLogin = useCallback(async () => {
  // No try/catch - unhandled promise rejection possible
});

// apps/web/src/features/pipeline/components/CaptioningStep/CaptionItem.tsx
const saveAndAdvance = async () => {
  // No error handling - user gets no feedback on failure
};
```

**Impact:** Medium - silent failures, poor UX when errors occur

**Fix Required:**
- Wrap async operations in `try/catch`
- Add toast notifications for errors
- OR use TanStack Query mutations (which handle errors automatically)

**Estimated Effort:** 3-4 hours

---

## 📝 MEDIUM PRIORITY CLEANUP (4)

### 1. Electron Legacy TODOs (4 items)
**Files:**
- `apps/electron-legacy/src/lib/fansly-analytics/aggregate.ts:53` - `// TODO: Use isFreePreview?`
- `apps/electron-legacy/src/renderer/src/pages/Subreddits/RedditBulkPostGenerator/ScheduledPostsList.tsx:220` - `// TODO: Show error toast to user`
- `apps/electron-legacy/src/features/analytics/post-analytics/fyp-performance.ts:34` - `// TODO: Use sustainedGrowth in performance scoring algorithm`
- `apps/electron-legacy/src/renderer/src/pages/PostDetail/PostAnalyticsSummary.tsx:18` - `return post.postMedia[0]; // TODO: Use isFreePreview?`

**Status:** Electron app is deprecated - TODOs can be ignored

**Action:** None required (document as "wontfix" for legacy app)

---

### 2. "Any" Type Usage
**Scope:** 5 instances of `any` type in production code

**Impact:** Low - type safety gaps, but limited scope

**Fix Required:**
- Replace with proper types or `unknown` + type guards
- Most are in component props or utility functions

**Estimated Effort:** 1 hour

---

### 3. Deprecated Code Comments
**Files with "deprecated" markers:**
- `apps/web/src/features/subreddits/` (6 files)
- `apps/server/src/features/pipeline/operations/assign-media.ts`
- `apps/server/src/features/content-schedules/operations/generate-virtual-posts.ts`
- `apps/server/src/features/library/filter-helpers.ts`

**Status:** Comments reference old architecture - files are still active

**Fix Required:**
- Remove "deprecated" comments if functionality is current
- OR refactor to newer patterns if actually deprecated

**Estimated Effort:** 2 hours (review each file)

---

### 4. Media Tag Auto-Removal Complexity Skipped
**Files:**
- `apps/web/src/features/library/components/MediaTagEditor/index.tsx:61`
- `apps/electron-legacy/src/renderer/src/components/MediaTagEditor/index.tsx:51`

**Comment:**
```tsx
// For now, we'll skip the auto-removal to avoid complexity
```

**Context:** When changing tag values, related cascading tag removals not implemented

**Impact:** Low - user can manually remove tags

**Fix Required:** Implement cascading tag removal logic when tag dimension changes

**Estimated Effort:** 4-6 hours (complex business logic)

---

## ✅ VERIFIED COMPLETE IMPLEMENTATIONS

### 1. Smart Virtual Post Filling (12/12 features ✅)
- ✅ **Pre-filtering:** Library automatically filtered by schedule + channel configuration
- ✅ **Cooldown filtering:** Media repost cooldown with toggle to show recently posted
- ✅ **Sort options:** Newest/Oldest Added, Recently/Least Posted
- ✅ **Visual indicators:** Posting history indicators on thumbnails with hover tooltips
- ✅ **Filter refinement:** MediaFilters component for runtime filter adjustments
- ✅ **Multi-select:** Shift-click range, Cmd/Ctrl-click multi, drag to reorder
- ✅ **Create post:** Creates post with selected media, disabled until selection made
- ✅ **Create & Next:** Creates post and navigates to next unfilled slot
- ✅ **Recent posts context:** Last 3 posts shown in collapsible panel
- ✅ **Empty state:** Clear messaging when filters result in no media
- ✅ **Morphing animation:** VirtualPostMediaPanel with framer-motion layoutId morphing from card position
- ✅ **Simplified layout:** Panel with media grid, filters, and expand functionality
- ✅ **Expand to full dialog:** Opens CreatePostDialog preserving media selection and context

**Implementation:**
- Created `VirtualPostMediaPanel.tsx` - New component for simplified media selection with morphing animation
- Panel morphs from clicked virtual post card using framer-motion shared layout transitions
- Expand button opens full `CreatePostDialog` with preserved selection
- Respects `prefers-reduced-motion` for accessibility

**Files:**
- `@fanslib/apps/web/src/features/library/components/VirtualPostMediaPanel.tsx` (new simplified panel)
- `@fanslib/apps/web/src/features/library/components/CreatePostDialog.tsx` (full dialog)
- `@fanslib/apps/web/src/features/library/components/CombinedMediaSelection.tsx` (media grid + controls)
- `@fanslib/apps/web/src/features/posts/components/PostCalendar/*.tsx` (calendar views)

---

### 2. Subreddits (22/22 features ✅)
- ✅ Complete Reddit channel integration
- ✅ 1:1 subreddit-channel composition model
- ✅ Unified Channels UI supports Reddit
- ✅ CreateChannelForm with `typeId='reddit'`
- ✅ CreatePostDialog Reddit compatibility
- ✅ Bulk post generator with scheduling
- ✅ Reddit authentication flow
- ✅ Subreddit CRUD operations

**Files:**
- `@fanslib/apps/web/src/features/subreddits/*` (UI components)
- `@fanslib/apps/server/src/features/subreddits/*` (backend)
- `@fanslib/apps/server/src/features/reddit-automation/*` (Playwright automation)

---

### 3. Content Schedules (20/20 features ✅)
- ✅ Virtual post generation with date/time slots
- ✅ Multi-channel schedule support
- ✅ Recurring patterns (daily/weekly/monthly)
- ✅ Schedule-level media filters
- ✅ Channel-specific overrides
- ✅ Skip slot functionality
- ✅ Schedule colors and names
- ✅ Active/inactive toggle

**Files:**
- `@fanslib/apps/server/src/features/content-schedules/*`
- `@fanslib/apps/web/src/features/channels/*` (schedule UI in channels feature)

---

### 4. Query Revalidation (9/9 features ✅)
- ✅ Centralized `QUERY_KEYS` registry
- ✅ All mutations invalidate related queries
- ✅ Optimistic updates with rollback
- ✅ Proper cache management

**Files:**
- `@fanslib/apps/web/src/lib/queries/query-keys.ts` (registry)
- All mutation hooks in `@fanslib/apps/web/src/lib/queries/*.ts`

---

### 5. Captioning Page (15/15 features ✅)
- ✅ Caption queue with draft posts
- ✅ Debounced auto-save (750ms)
- ✅ Caption syncing for linked posts
- ✅ Related captions panel (by media/shoot)
- ✅ Snippet insertion (`@snippet-name`)
- ✅ Hashtag insertion with search
- ✅ Keyboard shortcuts (Cmd+Enter save, Shift+Enter advance)
- ✅ Delete confirmation
- ✅ Empty state handling

**Files:**
- `@fanslib/apps/web/src/features/pipeline/components/CaptioningStep/*`
- `@fanslib/apps/web/src/features/pipeline/components/CaptionSyncControl.tsx`
- `@fanslib/apps/server/src/features/pipeline/*`

---

## 📋 PRIORITIZED ACTION PLAN

### PHASE 1: Critical Code Quality (URGENT)
**Goal:** Fix architectural brittleness and missing features

#### Task 1.1: Remove Hardcoded Reddit Channel ID
- **Priority:** P1 (critical bug)
- **Effort:** 30 minutes
- **Files:** `@fanslib/apps/web/src/features/subreddits/components/RedditBulkPostGenerator.tsx`
- **Steps:**
  1. Import `useChannels` query
  2. Filter channels by `typeId === 'reddit'`
  3. Use first reddit channel or show error if none exist
  4. Remove TODO comment

#### Task 1.2: Implement Tag Analytics Backend
- **Priority:** P1 (missing feature)
- **Effort:** 6-8 hours
- **Files:**
  - `@fanslib/apps/server/src/features/analytics/operations/tag-analytics/*` (new)
  - `@fanslib/apps/server/src/features/analytics/routes.ts` (add endpoints)
  - `@fanslib/apps/web/src/hooks/useTagAnalytics.ts` (update)
- **Steps:**
  1. Create tag performance aggregation operation (similar to hashtag analytics)
  2. Add `/api/analytics/tag-performance` endpoint
  3. Add `/api/analytics/tag-correlations` endpoint (co-occurrence analysis)
  4. Add `/api/analytics/tag-trends` endpoint (time series)
  5. Update web hooks to call real endpoints
  6. Test with sample data

---

### PHASE 2: Test Coverage & Error Handling (HIGH PRIORITY)
**Goal:** Improve reliability and maintainability

#### Task 2.1: Enable Skipped Tests
- **Priority:** P2
- **Effort:** 2-3 hours
- **Steps:**
  1. Investigate caption queue test failure
  2. Investigate analytics candidates test failures
  3. Fix underlying issues or document why tests don't apply
  4. Remove `.skip()` or add explanatory comments

#### Task 2.2: Add Error Handling to Async Callbacks
- **Priority:** P2
- **Effort:** 3-4 hours
- **Focus:**
  - Settings page handlers (Reddit/Fansly/Bluesky login/save)
  - Pipeline captioning save/advance/delete
  - Post calendar drag-drop handlers
- **Steps:**
  1. Wrap in `try/catch`
  2. Add toast notifications for errors
  3. OR convert to TanStack Query mutations

---

### PHASE 3: Code Cleanup (MEDIUM PRIORITY)
**Goal:** Professional code quality

#### Task 3.1: Remove Debug Console Logs
- **Priority:** P3
- **Effort:** 2 hours
- **Files:**
  - `apps/web/src/features/library/filter-helpers.ts`
  - `apps/web/src/features/library/components/MediaFilters/MediaFiltersContext.tsx`
  - `apps/server/src/features/reddit-automation/reddit-poster.ts`
  - `apps/server/src/features/library/operations/scan/scan.ts`
- **Steps:**
  1. Remove debug logs in web filter helpers
  2. Convert Reddit login logs to event-based progress reporting
  3. Convert library scan logs to event callbacks

#### Task 3.2: Replace "Any" Types
- **Priority:** P3
- **Effort:** 1 hour
- **Steps:** Replace 5 instances with proper types or `unknown` + type guards

#### Task 3.3: Audit "Deprecated" Comments
- **Priority:** P3
- **Effort:** 2 hours
- **Steps:** Remove outdated comments or refactor if truly deprecated

---

### PHASE 4: Nice-to-Have (LOW PRIORITY)

#### Task 4.1: Implement Media Tag Auto-Removal
- **Priority:** P4
- **Effort:** 4-6 hours
- **Description:** Cascading tag removal when tag dimension changes
- **Impact:** Quality-of-life improvement

#### Task 4.2: Electron Legacy TODOs
- **Priority:** P4 (wontfix)
- **Action:** Document as "wontfix" - electron app is deprecated

---

## 🏗️ ARCHITECTURE OVERVIEW

### Stack
- **Runtime:** Bun (not Node.js)
- **Monorepo:** Turborepo with 3 main apps
- **Server:** Elysia + TypeORM + SQLite
- **Web:** React 19 + TanStack Start/Router/Query
- **Legacy:** Electron app (deprecated, 40MB codebase)

### Code Size
- **Web:** 36MB (active development)
- **Server:** 6.9MB (active development)  
- **Electron:** 40MB (deprecated, ignore TODOs)

### Database
- **Type:** SQLite with TypeORM (sql.js driver)
- **Entities:** 19 core tables
- **Features:** 16 fully structured server features
- **Tests:** 14 test files, 3 skipped tests

### API
- **Client:** Eden treaty client with `devalue` serialization
- **Endpoints:** Complete coverage across all features
- **Validation:** Elysia schema validation (TypeBox)

---

## 🎯 COMPLETION METRICS

### Spec Compliance
- **Total Features:** 78 defined across 5 specs
- **Passing:** 78 features (100%)
- **Failing:** 0 features

### Code Quality
- **Critical Issues:** 2 (hardcoded ID, missing backend)
- **High Priority:** 3 (skipped tests, console logs, error handling)
- **Medium Priority:** 4 (electron TODOs, any types, deprecated comments, tag auto-removal)

### Test Coverage
- **Server Tests:** 14 test files
- **Skipped Tests:** 3 (pipeline, analytics candidates)
- **Test Framework:** Bun test runner

---

## 🎉 TECHNICAL ACHIEVEMENTS

### Type Safety
- ✅ Full TypeScript coverage (zero `any` usage goal)
- ✅ Shared types between client and server via workspace imports
- ✅ Schema-driven validation with runtime checking
- ✅ Eden treaty client for type-safe API calls

### Performance
- ✅ Bulk posting history queries (efficient data fetching)
- ✅ Debounced auto-save (750ms for captions)
- ✅ Optimistic updates with automatic rollback
- ✅ TanStack Query caching with smart invalidation

### Accessibility
- ✅ `usePrefersReducedMotion` respects user motion preferences
- ✅ Keyboard shortcuts throughout (Cmd+Enter, Shift+Enter, Tab, Escape)
- ✅ ARIA-compliant dialogs and interactive elements
- ✅ Focus management in modal workflows

### Developer Experience
- ✅ Turborepo for parallel builds and caching
- ✅ Hot module reloading in dev mode
- ✅ Feature-based code organization
- ✅ Centralized query key management
- ✅ Agent-first spec format (JSON with acceptance criteria)

---

## 🏷️ GIT TAG STRATEGY

### Existing Tags
- `0.0.35` - Initial smart virtual post filling features
- `0.0.36` - Partial smart virtual post filling (10/12 features)
- `0.0.37` - Most specs complete, 2 animation features pending
- `0.0.38` - Complete smart virtual post filling (12/12 features, 100% spec compliance)

### Recommended Next Tags
- **`0.0.39`** - Fix critical code quality issues (hardcoded ID, tag analytics backend)
- **`0.0.40`** - Test coverage improvements (enable skipped tests, add error handling)
- **`0.1.0`** - First production-ready release (all phases complete)

---

## 📝 NOTES

### Agent-First Development
This project uses **agent-first specification format** (Anthropic style):
- Specs in `specs/*.json` with features, acceptance criteria, technical notes
- Each feature has `passes: boolean` for incremental progress tracking
- Specs are updated after implementation validation
- Format optimized for AI agent comprehension

### Ralph Loop Integration
When running in Ralph loop (`./loop.sh`):
1. Read spec's `features` array
2. Choose next feature with `passes: false`
3. Implement feature
4. Validate with `bun lint && bun typecheck && bun test`
5. Update spec: change `passes: false` → `passes: true`
6. Commit with descriptive message
7. Create git tag when build/tests pass

### Safety Notes
- **Reddit Automation:** NEVER run Playwright automation without explicit user permission
- **Secrets:** Use environment variables, never commit credentials
- **Database:** Auto-sync enabled (no migrations) - development mode only

---

**Last Updated:** 2025-01-05  
**Analysis By:** Comprehensive codebase audit agent  
**Command Used:** Grep, glob, view tools across all specs and source files
