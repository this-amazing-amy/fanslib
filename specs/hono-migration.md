# Hono Migration Specification

## Overview

Migrate the server from Elysia + Eden + TypeBox to Hono + hc client + Zod. This migration addresses persistent 422 validation errors caused by incompatible serialization between Elysia's validation layer and the devalue serialization pipeline.

## Problem Statement

The current stack has a fundamental issue: when Elysia validation fails, it returns raw JSON errors, but the Eden client expects all responses to be devalue-serialized. This causes validation error messages to be lost, making debugging difficult.

## Target Architecture

```
Server: Hono + @hono/zod-validator + Zod schemas
Client: hono/client (hc) with devalue deserialization
Serialization: devalue (unchanged)
Type Safety: End-to-end via Zod inference + hc client
```

## Server Components

### Hono App Setup

Location: `@fanslib/apps/server/src/index.ts`

Requirements:

- Hono app instance with CORS middleware
- Devalue serialization middleware (port existing mapResponse logic)
- OpenAPI/Swagger documentation
- Cron job integration for scheduled posts
- All feature routes composed via `.route()`
- Export `AppType` for client type inference

### Devalue Middleware

Location: `@fanslib/apps/server/src/lib/devalue-middleware.ts`

Requirements:

- Serialize all JSON responses with devalue
- Convert TypeORM entities to plain objects
- Convert ISO date strings to Date objects
- Skip serialization for: swagger docs, file endpoints, binary responses
- Set `X-Serialization: devalue` header

### Validation Utilities

Location: `@fanslib/apps/server/src/lib/hono-utils.ts`

Requirements:

- `validationError(result, c)` - Standard Zod validation error handler returning 422 with error details
- `notFound(c, message)` - Standard 404 response helper

### Zod Schemas

Requirements:

- Convert all TypeBox schemas to Zod equivalents
- Maintain same validation rules and constraints
- Use `z.coerce.date()` for date fields (handles ISO strings)
- Use `z.infer<typeof Schema>` for type inference
- Keep schemas co-located with operations (same pattern as current)

### Route Definitions

Requirements:

- Use `new Hono().basePath('/api/feature')` pattern
- Use `zValidator('json' | 'query' | 'param', schema, errorHandler)` for validation
- Explicit error handling in validation callback
- Return responses via `c.json(data)` or `c.json(data, statusCode)`

## Client Components

### Hono Client Setup

Location: `@fanslib/apps/web/src/lib/api/client.ts`

Requirements:

- Use `hc<AppType>(baseUrl)` for typed client
- Custom fetch wrapper to handle devalue deserialization
- Check `X-Serialization` header before parsing
- Handle error responses appropriately

### Query Hooks

Requirements:

- Update all TanStack Query hooks to use hc client
- Change call syntax: `api.api.feature.endpoint.$get()` then `.json()`
- Maintain existing query keys and cache invalidation patterns

## Feature Modules

All features follow the same migration pattern:

1. Schema files: TypeBox → Zod
2. Routes file: Elysia → Hono with zValidator
3. Client queries: Eden → hc

### Posts (10 endpoints)

- `GET /api/posts/all` - Fetch all posts with filters
- `GET /api/posts/by-id/:id` - Fetch single post
- `GET /api/posts/by-channel-id/:channelId` - Posts by channel
- `GET /api/posts/by-media-id/:mediaId` - Posts by media
- `POST /api/posts/` - Create post
- `PATCH /api/posts/by-id/:id` - Update post
- `DELETE /api/posts/by-id/:id` - Delete post
- `POST /api/posts/by-id/:id/media` - Add media to post
- `DELETE /api/posts/by-id/:id/media` - Remove media from post
- `PATCH /api/posts/by-id/:id/media/:postMediaId` - Update post media

### Channels (6 endpoints)

- `GET /api/channels/all`
- `GET /api/channels/types`
- `GET /api/channels/by-id/:id`
- `POST /api/channels/`
- `PATCH /api/channels/by-id/:id`
- `DELETE /api/channels/by-id/:id`

### Content Schedules (9 endpoints)

- `GET /api/content-schedules/all`
- `GET /api/content-schedules/by-channel-id/:channelId`
- `GET /api/content-schedules/by-id/:id`
- `GET /api/content-schedules/virtual-posts`
- `POST /api/content-schedules/`
- `PATCH /api/content-schedules/by-id/:id`
- `DELETE /api/content-schedules/by-id/:id`
- `POST /api/content-schedules/skipped-slots`
- `DELETE /api/content-schedules/skipped-slots/:id`

### Library/Media (11 endpoints)

- `POST /api/media/all`
- `GET /api/media/by-id/:id`
- `GET /api/media/by-path/:path`
- `PATCH /api/media/by-id/:id`
- `DELETE /api/media/by-id/:id`
- `POST /api/media/by-id/:id/adjacent`
- `POST /api/media/scan`
- `POST /api/media/scan/file`
- `GET /api/media/scan/status`
- `GET /api/media/:id/file`
- `GET /api/media/:id/thumbnail`

### Analytics (18 endpoints)

- `POST /api/analytics/credentials/update-from-fetch`
- `GET /api/analytics/datapoints/:postMediaId`
- `POST /api/analytics/fetch/by-id/:postMediaId`
- `GET /api/analytics/posts`
- `GET /api/analytics/hashtags`
- `GET /api/analytics/time`
- `GET /api/analytics/insights`
- `POST /api/analytics/initialize-aggregates`
- `GET /api/analytics/health`
- `GET /api/analytics/fyp-actions`
- `POST /api/analytics/candidates/`
- `GET /api/analytics/candidates/`
- `GET /api/analytics/candidates/by-id/:id/suggestions`
- `POST /api/analytics/candidates/by-id/:id/match`
- `POST /api/analytics/candidates/by-id/:id/ignore`
- `POST /api/analytics/candidates/bulk-confirm`
- `POST /api/analytics/candidates/by-id/:id/unmatch`
- `POST /api/analytics/candidates/by-id/:id/unignore`

### Tags (17 endpoints)

- `GET /api/tags/dimensions`
- `GET /api/tags/dimensions/by-id/:id`
- `POST /api/tags/dimensions`
- `PATCH /api/tags/dimensions/by-id/:id`
- `DELETE /api/tags/dimensions/by-id/:id`
- `GET /api/tags/definitions`
- `GET /api/tags/definitions/by-ids`
- `GET /api/tags/definitions/by-id/:id`
- `POST /api/tags/definitions`
- `PATCH /api/tags/definitions/by-id/:id`
- `DELETE /api/tags/definitions/by-id/:id`
- `GET /api/tags/media/by-media-id/:mediaId`
- `POST /api/tags/media/assign`
- `POST /api/tags/media/assign-bulk`
- `DELETE /api/tags/media/by-media-id/:mediaId`
- `GET /api/tags/drift-prevention/stats`
- `POST /api/tags/drift-prevention/cleanup`
- `POST /api/tags/drift-prevention/sync-sticker-display`

### Hashtags (8 endpoints)

- `GET /api/hashtags/all`
- `GET /api/hashtags/by-ids`
- `GET /api/hashtags/by-id/:id`
- `POST /api/hashtags/`
- `POST /api/hashtags/by-ids`
- `DELETE /api/hashtags/by-id/:id`
- `GET /api/hashtags/by-id/:id/stats`
- `POST /api/hashtags/by-id/:id/stats`

### Shoots (6 endpoints)

- `POST /api/shoots/all`
- `GET /api/shoots/by-id/:id`
- `POST /api/shoots/`
- `PATCH /api/shoots/by-id/:id`
- `DELETE /api/shoots/by-id/:id`
- `GET /api/shoots/by-id/:id/posts`

### Subreddits (6 endpoints)

- `GET /api/subreddits/all`
- `GET /api/subreddits/by-id/:id`
- `POST /api/subreddits/`
- `PATCH /api/subreddits/by-id/:id`
- `DELETE /api/subreddits/by-id/:id`
- `POST /api/subreddits/last-post-dates`

### Snippets (7 endpoints)

- `GET /api/snippets/all`
- `GET /api/snippets/global`
- `GET /api/snippets/by-channel-id/:channelId`
- `GET /api/snippets/by-id/:id`
- `POST /api/snippets/`
- `PATCH /api/snippets/by-id/:id`
- `DELETE /api/snippets/by-id/:id`

### Filter Presets (5 endpoints)

- `GET /api/filter-presets/all`
- `GET /api/filter-presets/by-id/:id`
- `POST /api/filter-presets/`
- `PATCH /api/filter-presets/by-id/:id`
- `DELETE /api/filter-presets/by-id/:id`

### Settings (6 endpoints)

- `GET /api/settings/`
- `PATCH /api/settings/`
- `POST /api/settings/toggle-sfw`
- `GET /api/settings/fansly-credentials`
- `POST /api/settings/fansly-credentials`
- `DELETE /api/settings/fansly-credentials`

### Pipeline (3 endpoints)

- `POST /api/pipeline/assign`
- `GET /api/pipeline/caption-queue`
- `GET /api/pipeline/health`

### Postpone (4 endpoints)

- `POST /api/postpone/draft-bluesky`
- `POST /api/postpone/find-redgifs-url`
- `POST /api/postpone/refresh-redgifs-url`
- `POST /api/postpone/find-subreddit-posting-times`

### Bluesky (1 endpoint)

- `POST /api/bluesky/test-credentials`

### Reddit Automation (11 endpoints)

- `GET /api/reddit-automation/is-running`
- `POST /api/reddit-automation/generate-random-post`
- `POST /api/reddit-automation/generate-posts`
- `POST /api/reddit-automation/regenerate-media`
- `POST /api/reddit-automation/schedule-posts`
- `GET /api/reddit-automation/scheduled-posts`
- `POST /api/reddit-automation/post-to-reddit`
- `POST /api/reddit-automation/login`
- `POST /api/reddit-automation/check-login`
- `POST /api/reddit-automation/session/status`
- `DELETE /api/reddit-automation/session`

### Root (2 endpoints)

- `GET /health`
- `POST /migrate-colors`

## Dependencies

### Server (add)

- `hono`
- `@hono/zod-validator`
- `zod`

### Server (remove after migration)

- `elysia`
- `@elysiajs/cors`
- `@elysiajs/cron`
- `@elysiajs/swagger`

### Web (add)

- `hono` (for hc client)

### Web (remove after migration)

- `@elysiajs/eden`

## Migration Strategy

1. Infrastructure first: Add dependencies, create utilities, create hc client
2. Feature by feature: Migrate one feature completely (schemas + routes + client) before moving to next
3. Test after each feature: Run `bun typecheck`, `bun lint`, manual smoke test
4. Cleanup last: Remove Elysia dependencies only after all features migrated

## Success Criteria

- All 130+ endpoints respond correctly
- Validation errors return proper 422 responses with error details
- End-to-end type safety maintained
- No Elysia/Eden dependencies remain
- `bun typecheck` and `bun lint` pass
- All existing tests pass
