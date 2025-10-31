# FansLib Legacy to Modern Architecture Migration Plan

## Overview

This document outlines the incremental migration strategy from the Electron-based legacy application to the new TanStack Start + Electric SQL architecture. The migration will be done entity-by-entity, allowing frontend components to be migrated gradually while maintaining a working application throughout the process.

### Goals
- Migrate from Electron IPC to HTTP/tRPC APIs
- Replace SQLite with PostgreSQL + Electric SQL for local-first reactive data
- Enable web-based access while maintaining desktop-like reactivity
- Preserve all existing functionality during migration

### Migration Strategy
- **Incremental**: Migrate one entity/feature at a time
- **Bottom-up**: Start with foundational entities (Media, Posts) before dependent ones
- **Test-driven**: Each entity migration includes component testing
- **Parallel development**: Legacy app remains functional during migration

---

## Architecture Comparison

### Legacy (Electron)
```
React Frontend
    ↓ (Electron IPC)
Main Process (Node.js)
    ↓
SQLite Database (TypeORM)
    ↓
File System (media files)
```

**IPC Communication Pattern:**
- 17 feature modules
- ~120 IPC endpoints
- Type-safe handlers with prefixed namespaces
- Event-based notifications

### New (TanStack Start + Electric SQL)
```
React Frontend (TanStack Router)
    ↓ (Electric Collections + tRPC)
TanStack Start Server
    ↓
PostgreSQL Database (Drizzle ORM)
    ↓ (Electric SQL sync)
Frontend (reactive local cache)
    ↓
File System (media files via HTTP)
```

**API Communication Pattern:**
- Electric SQL for reactive read queries
- tRPC for mutations and operations
- Real-time sync via Electric protocol
- HTTP endpoints for file serving

---

## Legacy API Surface Analysis

### Feature Modules Identified

#### 1. **Library** (9 endpoints)
- `library:scan` - Scan file system for media
- `library:scanFile` - Scan single file
- `library:getAll` - Paginated media list with filters
- `library:get` - Get media by ID
- `library:update` - Update media metadata
- `library:delete` - Delete media (optionally delete file)
- `library:adjacentMedia` - Get previous/next media in filtered list
- `library:onScanProgress` - Event listener for scan progress
- `library:onScanComplete` - Event listener for scan completion

#### 2. **Posts** (13 endpoints)
- `post:create` - Create post with media
- `post:getAll` - Get all posts with filters
- `post:byId` - Get post by ID
- `post:bySchedule` - Get posts by schedule
- `post:byChannel` - Get posts by channel
- `post:byMediaId` - Get posts containing media
- `post:byUrl` - Get post by URL
- `post:update` - Update post
- `post:delete` - Delete post
- `post:addMedia` - Add media to post
- `post:removeMedia` - Remove media from post
- `post:setFreePreview` - Set media as free preview
- `post:adjacentPosts` - Get previous/next post

#### 3. **Channels** (10 endpoints)
- `channel:create` - Create channel
- `channel:getAll` - Get all channels
- `channel:getById` - Get channel by ID
- `channel:delete` - Delete channel
- `channel:update` - Update channel
- `channel:getTypes` - Get channel types
- `channel:updateDefaultHashtags` - Update default hashtags
- `channel:subreddit-create` - Create subreddit
- `channel:subreddit-list` - List subreddits
- `channel:subreddit-update` - Update subreddit
- `channel:subreddit-delete` - Delete subreddit
- `channel:subreddit-last-post-dates` - Get last post dates
- `channel:subreddit-analyze-posting-times` - Analyze optimal posting times

#### 4. **Tags** (14 endpoints)
- `tags:createDimension` - Create tag dimension
- `tags:updateDimension` - Update tag dimension
- `tags:deleteDimension` - Delete tag dimension
- `tags:getAllDimensions` - Get all dimensions
- `tags:getDimensionById` - Get dimension by ID
- `tags:createTag` - Create tag definition
- `tags:updateTag` - Update tag definition
- `tags:deleteTag` - Delete tag definition
- `tags:getTagsByDimension` - Get tags for dimension
- `tags:getTagById` - Get tag by ID
- `tags:getTagDefinitionsByIds` - Get multiple tags
- `tags:assignTagsToMedia` - Assign tags to media
- `tags:removeTagsFromMedia` - Remove tags from media
- `tags:getMediaTags` - Get media tags
- `tags:bulkAssignTags` - Bulk assign tags

#### 5. **Shoots** (5 endpoints)
- `shoot:create` - Create shoot
- `shoot:get` - Get shoot by ID
- `shoot:getAll` - Get all shoots (paginated)
- `shoot:update` - Update shoot
- `shoot:delete` - Delete shoot

#### 6. **Content Schedules** (5 endpoints)
- `content-schedule:getAll` - Get all schedules
- `content-schedule:getByChannel` - Get schedules by channel
- `content-schedule:create` - Create schedule
- `content-schedule:update` - Update schedule
- `content-schedule:delete` - Delete schedule

#### 7. **Snippets** (7 endpoints)
- `snippet:getAllSnippets` - Get all snippets
- `snippet:getSnippetsByChannel` - Get channel snippets
- `snippet:getGlobalSnippets` - Get global snippets
- `snippet:createSnippet` - Create snippet
- `snippet:updateSnippet` - Update snippet
- `snippet:deleteSnippet` - Delete snippet
- `snippet:incrementUsage` - Increment usage count

#### 8. **Hashtags** (5 endpoints)
- `hashtag:stats:set` - Set hashtag stats
- `hashtag:stats:get` - Get hashtag stats
- `hashtag:list` - List hashtags
- `hashtag:create` - Create hashtag
- `hashtag:delete` - Delete hashtag

#### 9. **Filter Presets** (5 endpoints)
- `filterPresets:getAll` - Get all presets
- `filterPresets:get` - Get preset by ID
- `filterPresets:create` - Create preset
- `filterPresets:update` - Update preset
- `filterPresets:delete` - Delete preset

#### 10. **Settings** (10 endpoints)
- `settings:load` - Load settings
- `settings:save` - Save settings
- `settings:resetDatabase` - Reset database
- `settings:saveFanslyCredentials` - Save Fansly credentials
- `settings:loadFanslyCredentials` - Load Fansly credentials
- `settings:clearFanslyCredentials` - Clear Fansly credentials
- `settings:importDatabase` - Import database
- `settings:validateImportedDatabase` - Validate import
- `settings:toggleSfwMode` - Toggle SFW mode
- `settings:healthCheck` - Health check server

#### 11-17. **Stubbed Endpoints** (Analytics, Reddit, Automation, etc.)
- Analytics (17 endpoints) - Return empty/default values
- Reddit Poster (7 endpoints) - Return success stubs
- Automation (1 endpoint) - Return success
- API Postpone (4 endpoints) - Return success/null
- Server Communication (15 endpoints) - Mock job responses
- OS (4 endpoints) - Return success
- Notifications (1 endpoint) - No-op listener

---

## Database Schema Design

### Core Tables (Priority 1)

#### Media Table
**File:** `packages/db/src/schema/media.ts`

```typescript
export const mediaTable = pgTable('media', {
  id: serial('id').primaryKey(),
  relativePath: text('relative_path').notNull().unique(),
  type: text('type', { enum: ['image', 'video'] }).notNull(),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  filesize: bigint('filesize', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  duration: real('duration'), // for videos
  hash: text('hash'),

  // Metadata
  filepath: text('filepath').notNull(),
  thumbnailPath: text('thumbnail_path'),
  redgifsUrl: text('redgifs_url'),

  // Timestamps
  fileCreationDate: timestamp('file_creation_date').notNull(),
  fileModificationDate: timestamp('file_modification_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Relations
  shootId: integer('shoot_id').references(() => shootsTable.id),
});
```

#### Posts Table
**File:** `packages/db/src/schema/posts.ts`

```typescript
export const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  caption: text('caption'),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: text('status', {
    enum: ['draft', 'scheduled', 'posted']
  }).notNull().default('draft'),

  // URLs
  url: text('url'),
  fanslyStatisticsId: text('fansly_statistics_id'),

  // Metadata
  fypRemovedAt: timestamp('fyp_removed_at'),

  // Relations
  channelId: integer('channel_id').references(() => channelsTable.id).notNull(),
  subredditId: integer('subreddit_id').references(() => subredditsTable.id),
  scheduleId: integer('schedule_id').references(() => contentSchedulesTable.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postMediaTable = pgTable('post_media', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => postsTable.id, { onDelete: 'cascade' }).notNull(),
  mediaId: integer('media_id').references(() => mediaTable.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').notNull(),
  isFreePreview: boolean('is_free_preview').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### Channels Table
**File:** `packages/db/src/schema/channels.ts`

```typescript
export const channelTypesTable = pgTable('channel_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
});

export const channelsTable = pgTable('channels', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  typeId: text('type_id').references(() => channelTypesTable.id).notNull(),
  eligibleMediaFilter: jsonb('eligible_media_filter'), // MediaFilters type
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subredditsTable = pgTable('subreddits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  maxPostFrequencyHours: integer('max_post_frequency_hours'),
  notes: text('notes'),
  memberCount: integer('member_count'),
  verificationStatus: text('verification_status', {
    enum: ['unknown', 'verified', 'unverified', 'required']
  }).default('unknown'),
  defaultFlair: text('default_flair'),
  captionPrefix: text('caption_prefix'),
  eligibleMediaFilter: jsonb('eligible_media_filter'),

  // Posting times analysis
  postingTimesData: jsonb('posting_times_data'),
  postingTimesLastFetched: timestamp('posting_times_last_fetched'),
  postingTimesTimezone: text('posting_times_timezone'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const channelDefaultHashtagsTable = pgTable('channel_default_hashtags', {
  channelId: integer('channel_id').references(() => channelsTable.id, { onDelete: 'cascade' }),
  hashtagId: integer('hashtag_id').references(() => hashtagsTable.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.channelId, table.hashtagId] }),
}));
```

#### Shoots Table
**File:** `packages/db/src/schema/shoots.ts`

```typescript
export const shootsTable = pgTable('shoots', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  shootDate: timestamp('shoot_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Media already references shoots via shootId foreign key
```

### Supporting Tables (Priority 2)

#### Tags System
**File:** `packages/db/src/schema/tags.ts`

```typescript
export const tagDimensionsTable = pgTable('tag_dimensions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  dataType: text('data_type', {
    enum: ['categorical', 'numerical', 'boolean']
  }).notNull(),
  validationSchema: jsonb('validation_schema'),
  sortOrder: integer('sort_order').default(0),
  stickerDisplay: text('sticker_display', {
    enum: ['none', 'color', 'short']
  }).default('none'),
  isExclusive: boolean('is_exclusive').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tagDefinitionsTable = pgTable('tag_definitions', {
  id: serial('id').primaryKey(),
  dimensionId: integer('dimension_id').references(() => tagDimensionsTable.id).notNull(),
  value: text('value').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  color: text('color'),
  shortRepresentation: text('short_representation'),
  sortOrder: integer('sort_order').default(0),
  parentTagId: integer('parent_tag_id').references(() => tagDefinitionsTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mediaTagsTable = pgTable('media_tags', {
  id: serial('id').primaryKey(),
  mediaId: integer('media_id').references(() => mediaTable.id, { onDelete: 'cascade' }).notNull(),
  tagDefinitionId: integer('tag_definition_id').references(() => tagDefinitionsTable.id).notNull(),

  // Denormalized fields for performance
  dimensionId: integer('dimension_id').notNull(),
  dimensionName: text('dimension_name').notNull(),
  dataType: text('data_type').notNull(),
  tagValue: text('tag_value').notNull(),
  tagDisplayName: text('tag_display_name').notNull(),
  color: text('color'),
  stickerDisplay: text('sticker_display').default('none'),
  shortRepresentation: text('short_representation'),
  numericValue: real('numeric_value'),
  booleanValue: boolean('boolean_value'),

  // Metadata
  confidence: real('confidence'),
  source: text('source', { enum: ['manual', 'automated', 'imported'] }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  dimensionNameTagValueIdx: index('media_tags_dimension_tag_idx').on(table.dimensionName, table.tagValue),
  mediaIdDimensionNameIdx: index('media_tags_media_dimension_idx').on(table.mediaId, table.dimensionName),
  dimensionNameNumericValueIdx: index('media_tags_dimension_numeric_idx').on(table.dimensionName, table.numericValue),
}));
```

#### Content Schedules
**File:** `packages/db/src/schema/schedules.ts`

```typescript
export const contentSchedulesTable = pgTable('content_schedules', {
  id: serial('id').primaryKey(),
  channelId: integer('channel_id').references(() => channelsTable.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
  postsPerTimeframe: integer('posts_per_timeframe'),
  preferredDays: jsonb('preferred_days').$type<string[]>(),
  preferredTimes: jsonb('preferred_times').$type<string[]>(),
  mediaFilters: jsonb('media_filters'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Snippets & Hashtags
**File:** `packages/db/src/schema/content.ts`

```typescript
export const snippetsTable = pgTable('caption_snippets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  channelId: integer('channel_id').references(() => channelsTable.id),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hashtagsTable = pgTable('hashtags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hashtagChannelStatsTable = pgTable('hashtag_channel_stats', {
  id: serial('id').primaryKey(),
  hashtagId: integer('hashtag_id').references(() => hashtagsTable.id).notNull(),
  channelId: integer('channel_id').references(() => channelsTable.id).notNull(),
  views: integer('views').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueHashtagChannel: unique().on(table.hashtagId, table.channelId),
}));
```

#### Filter Presets
**File:** `packages/db/src/schema/filters.ts`

```typescript
export const filterPresetsTable = pgTable('filter_presets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  filters: jsonb('filters').notNull(), // MediaFilters type
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Settings
**File:** `packages/db/src/schema/settings.ts`

```typescript
export const settingsTable = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## Implementation Roadmap

### Phase 1: Database Schema Setup

#### Task 1.1: Create Schema Files
**Priority:** Critical
**Files to create:**
- `packages/db/src/schema/media.ts` (extend existing)
- `packages/db/src/schema/posts.ts`
- `packages/db/src/schema/channels.ts`
- `packages/db/src/schema/shoots.ts` (extend existing)
- `packages/db/src/schema/tags.ts`
- `packages/db/src/schema/schedules.ts`
- `packages/db/src/schema/content.ts` (snippets, hashtags)
- `packages/db/src/schema/filters.ts`
- `packages/db/src/schema/settings.ts`

**Files to update:**
- `packages/db/src/schema/index.ts` - Export all schemas

#### Task 1.2: Generate Migrations
```bash
cd packages/db
bun run db:generate
bun run db:migrate
```

#### Task 1.3: Seed Initial Data
**File:** `packages/db/src/seed.ts`
- Channel types (Reddit, Fansly, OnlyFans, Bluesky, etc.)
- Sample settings

---

### Phase 2: Electric SQL Endpoints

#### Task 2.1: Media Endpoint (Already Exists)
**File:** `@fanslib/apps/web/src/routes/api/media.ts`
- ✅ Already implemented

#### Task 2.2: Shoots Endpoint (Already Exists)
**File:** `@fanslib/apps/web/src/routes/api/shoots.ts`
- ✅ Already implemented

#### Task 2.3: Posts Endpoint
**File:** `@fanslib/apps/web/src/routes/api/posts.ts`
```typescript
import { createAPIFileRoute } from '@tanstack/start/api';
import { prepareElectricUrl, proxyElectricRequest } from '../../lib/electric-proxy';

export const Route = createAPIFileRoute('/api/posts')({
  GET: async ({ request }) => {
    const originUrl = prepareElectricUrl(request.url);
    originUrl.searchParams.set('table', 'posts');
    return proxyElectricRequest(originUrl);
  },
});
```

#### Task 2.4: Additional Endpoints
**Files to create:**
- `@fanslib/apps/web/src/routes/api/channels.ts`
- `@fanslib/apps/web/src/routes/api/subreddits.ts`
- `@fanslib/apps/web/src/routes/api/tag-dimensions.ts`
- `@fanslib/apps/web/src/routes/api/tag-definitions.ts`
- `@fanslib/apps/web/src/routes/api/media-tags.ts`
- `@fanslib/apps/web/src/routes/api/content-schedules.ts`
- `@fanslib/apps/web/src/routes/api/snippets.ts`
- `@fanslib/apps/web/src/routes/api/hashtags.ts`
- `@fanslib/apps/web/src/routes/api/filter-presets.ts`

---

### Phase 3: tRPC API Routes

#### Task 3.1: Posts Router
**File:** `@fanslib/apps/server/src/modules/api/posts.ts`
```typescript
import { z } from 'zod';
import { procedure, router, generateTxId } from '../../lib/trpc/server';
import { postsTable, postMediaTable } from '@fanslib/db';
import { eq } from 'drizzle-orm';

export const postsRouter = router({
  create: procedure
    .input(z.object({
      caption: z.string().optional(),
      scheduledDate: z.date(),
      channelId: z.number(),
      mediaIds: z.array(z.number()),
      status: z.enum(['draft', 'scheduled', 'posted']).default('draft'),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        const [post] = await tx.insert(postsTable).values({
          caption: input.caption,
          scheduledDate: input.scheduledDate,
          channelId: input.channelId,
          status: input.status,
        }).returning();

        // Create post-media relationships
        if (input.mediaIds.length > 0) {
          await tx.insert(postMediaTable).values(
            input.mediaIds.map((mediaId, index) => ({
              postId: post.id,
              mediaId,
              order: index,
            }))
          );
        }

        return { item: post, txid };
      });

      return result;
    }),

  update: procedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        caption: z.string().optional(),
        scheduledDate: z.date().optional(),
        status: z.enum(['draft', 'scheduled', 'posted']).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        const [post] = await tx
          .update(postsTable)
          .set(input.data)
          .where(eq(postsTable.id, input.id))
          .returning();

        return { item: post, txid };
      });

      return result;
    }),

  delete: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        await tx.delete(postsTable).where(eq(postsTable.id, input.id));

        return { txid };
      });

      return result;
    }),

  addMedia: procedure
    .input(z.object({
      postId: z.number(),
      mediaIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        // Get current max order
        const existing = await tx
          .select()
          .from(postMediaTable)
          .where(eq(postMediaTable.postId, input.postId));

        const maxOrder = existing.length > 0
          ? Math.max(...existing.map(pm => pm.order))
          : -1;

        await tx.insert(postMediaTable).values(
          input.mediaIds.map((mediaId, index) => ({
            postId: input.postId,
            mediaId,
            order: maxOrder + index + 1,
          }))
        );

        return { txid };
      });

      return result;
    }),
});
```

#### Task 3.2: Additional Routers
**Files to create:**
- `@fanslib/apps/server/src/modules/api/channels.ts`
- `@fanslib/apps/server/src/modules/api/tags.ts`
- `@fanslib/apps/server/src/modules/api/shoots.ts`
- `@fanslib/apps/server/src/modules/api/schedules.ts`
- `@fanslib/apps/server/src/modules/api/snippets.ts`
- `@fanslib/apps/server/src/modules/api/hashtags.ts`
- `@fanslib/apps/server/src/modules/api/filter-presets.ts`
- `@fanslib/apps/server/src/modules/api/settings.ts`

**File to update:**
- `@fanslib/apps/server/src/lib/trpc/router.ts` - Merge all routers

---

### Phase 4: Frontend Collections

#### Task 4.1: Create Collections
**File:** `@fanslib/apps/web/src/lib/collections.ts`

Add to existing file:
```typescript
export const postsCollection = createCollection(
  electricCollectionOptions({
    id: 'posts',
    shapeOptions: {
      url: new URL(
        '/api/posts',
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectPostSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newPost } = transaction.mutations[0];
      const result = await trpc.posts.create.mutate({
        ...newPost,
        mediaIds: [], // Handle separately
      });
      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedPost } = transaction.mutations[0];
      const result = await trpc.posts.update.mutate({
        id: updatedPost.id,
        data: updatedPost,
      });
      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedPost } = transaction.mutations[0];
      const result = await trpc.posts.delete.mutate({
        id: deletedPost.id,
      });
      return { txid: result.txid };
    },
  })
);

// Similar for: channels, subreddits, tags, snippets, hashtags, etc.
```

#### Task 4.2: Create Query Hooks
**Files to create:**
- `@fanslib/apps/web/src/query/posts.ts`
- `@fanslib/apps/web/src/query/channels.ts`
- `@fanslib/apps/web/src/query/tags.ts`
- `@fanslib/apps/web/src/query/schedules.ts`
- `@fanslib/apps/web/src/query/snippets.ts`
- `@fanslib/apps/web/src/query/hashtags.ts`

**Example:** `posts.ts`
```typescript
import { useLiveQuery } from '@tanstack/react-db';
import { postsCollection } from '../lib/collections';

export type PostsQueryOptions = {
  channelId?: number;
  status?: 'draft' | 'scheduled' | 'posted';
  startDate?: Date;
  endDate?: Date;
};

export const usePosts = (options: PostsQueryOptions = {}) => {
  const query = useLiveQuery(postsCollection);

  const filteredData = query.data
    ? query.data.filter(post => {
        if (options.channelId && post.channelId !== options.channelId) return false;
        if (options.status && post.status !== options.status) return false;
        if (options.startDate && new Date(post.scheduledDate) < options.startDate) return false;
        if (options.endDate && new Date(post.scheduledDate) > options.endDate) return false;
        return true;
      })
    : [];

  return {
    ...query,
    data: filteredData,
  };
};
```

**File to update:**
- `@fanslib/apps/web/src/query/index.ts` - Export new hooks

---

### Phase 5: Stubbed Endpoints (tRPC Only)

#### Task 5.1: Analytics Router (Stubbed)
**File:** `@fanslib/apps/server/src/modules/api/analytics.ts`
```typescript
export const analyticsRouter = router({
  getSummary: procedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(() => ({
      engagementTrend: 0,
      averageEngagementPercent: 0,
      totalViews: 0,
      viewsTrend: 0,
      topPerformers: [],
      topPerformersByViews: [],
    })),

  getPostAnalytics: procedure.query(() => []),

  generateInsights: procedure.query(() => []),

  // ... other stubbed analytics endpoints
});
```

#### Task 5.2: Reddit/Automation Routers (Stubbed)
**Files to create:**
- `@fanslib/apps/server/src/modules/api/reddit-poster.ts`
- `@fanslib/apps/server/src/modules/api/automation.ts`
- `@fanslib/apps/server/src/modules/api/postpone.ts`

All return success/empty responses

---

### Phase 6: Component Migration

#### Task 6.1: Media Components (Already Done)
- ✅ MediaGrid
- ✅ ScanProgress

#### Task 6.2: Posts Components
**Files to migrate/create:**
- `@fanslib/apps/web/src/components/posts/PostsList.tsx`
- `@fanslib/apps/web/src/components/posts/PostEditor.tsx`
- `@fanslib/apps/web/src/components/posts/PostCalendar.tsx`
- `@fanslib/apps/web/src/routes/posts/index.tsx`
- `@fanslib/apps/web/src/routes/posts/$postId.tsx`

#### Task 6.3: Channels Components
**Files to migrate/create:**
- `@fanslib/apps/web/src/components/channels/ChannelList.tsx`
- `@fanslib/apps/web/src/components/channels/SubredditManager.tsx`
- `@fanslib/apps/web/src/routes/channels/index.tsx`

#### Task 6.4: Tags Components
**Files to migrate/create:**
- `@fanslib/apps/web/src/components/tags/TagDimensionEditor.tsx`
- `@fanslib/apps/web/src/components/tags/MediaTagEditor.tsx`
- `@fanslib/apps/web/src/routes/tags/index.tsx`

#### Task 6.5: Additional Components
- Shoots (extend existing)
- Schedules
- Snippets
- Hashtags
- Settings

---

## Pseudocode Crosscut

### Example 1: Media Read Flow (Already Working)

```typescript
// FRONTEND: Component reads media
// File: @fanslib/apps/web/src/components/media/MediaGrid.tsx
const MediaGrid = () => {
  const mediaQuery = useMedia({ shootId: null });
  // mediaQuery.data is reactive array of Media items

  return (
    <div>
      {mediaQuery.data.map(item => (
        <MediaTile key={item.id} media={item} />
      ))}
    </div>
  );
};

// FRONTEND: Query hook
// File: @fanslib/apps/web/src/query/media.ts
export const useMedia = (options) => {
  const query = useLiveQuery(mediaCollection);
  // Electric automatically syncs, data is always fresh
  return { ...query, data: filteredData };
};

// FRONTEND: Collection definition
// File: @fanslib/apps/web/src/lib/collections.ts
export const mediaCollection = createCollection(
  electricCollectionOptions({
    id: 'media',
    shapeOptions: {
      url: '/api/media', // Electric shape endpoint
    },
    schema: selectMediaSchema,
  })
);

// BACKEND: Electric shape endpoint proxies to Electric SQL
// File: @fanslib/apps/web/src/routes/api/media.ts
export const Route = createAPIFileRoute('/api/media')({
  GET: async ({ request }) => {
    const originUrl = prepareElectricUrl(request.url);
    originUrl.searchParams.set('table', 'media');
    return proxyElectricRequest(originUrl);
    // Electric SQL reads from Postgres and streams changes
  },
});

// BACKEND: Postgres table
// File: packages/db/src/schema/media.ts
export const mediaTable = pgTable('media', { /* columns */ });
```

**Flow:**
```
Component → useMedia hook → useLiveQuery(mediaCollection)
                                    ↓
                            Electric client fetches from /api/media
                                    ↓
                            Server proxies to Electric SQL
                                    ↓
                            Electric SQL queries Postgres
                                    ↓
                            Data streams to frontend
                                    ↓
                            Electric keeps local cache in sync
                                    ↓
                            Component re-renders on changes
```

---

### Example 2: Media Update Flow (Write Operation)

```typescript
// FRONTEND: User updates media in UI
// File: @fanslib/apps/web/src/components/media/MediaEditor.tsx
const MediaEditor = ({ mediaId }) => {
  const updateMedia = (updates) => {
    // Optimistically update Electric collection
    mediaCollection.update(mediaId, updates);
    // Electric automatically calls onUpdate handler
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateMedia({
        name: e.target.name.value,
        // ... other fields
      });
    }}>
      {/* form fields */}
    </form>
  );
};

// FRONTEND: Collection onUpdate handler
// File: @fanslib/apps/web/src/lib/collections.ts
export const mediaCollection = createCollection(
  electricCollectionOptions({
    // ... other options
    onUpdate: async ({ transaction }) => {
      const { modified: updatedMedia } = transaction.mutations[0];

      // Call tRPC mutation
      const result = await trpc.media.update.mutate({
        id: updatedMedia.id,
        data: updatedMedia,
      });

      // Return txid for Electric to know when to sync
      return { txid: result.txid };
    },
  })
);

// BACKEND: tRPC mutation handler
// File: @fanslib/apps/web/src/lib/trpc/routes/media.ts
export const mediaRouter = router({
  update: procedure
    .input(z.object({
      id: z.number(),
      data: updateMediaSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        // Generate transaction ID for Electric
        const txid = await generateTxId(tx);

        // Update in database
        const [updatedItem] = await tx
          .update(mediaTable)
          .set(input.data)
          .where(eq(mediaTable.id, input.id))
          .returning();

        return { item: updatedItem, txid };
      });

      return result;
    }),
});

// BACKEND: Database update
// Drizzle ORM executes:
// UPDATE media SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *
```

**Flow:**
```
User edits media → mediaCollection.update() called
                          ↓
                  Electric optimistically updates local cache
                          ↓
                  Component re-renders immediately (optimistic UI)
                          ↓
                  onUpdate handler calls trpc.media.update()
                          ↓
                  Server updates Postgres in transaction
                          ↓
                  Server generates & returns txid
                          ↓
                  Electric SQL detects change via txid
                          ↓
                  Electric streams update to all connected clients
                          ↓
                  All clients' collections sync automatically
```

---

### Example 3: Posts Creation Flow (Complex Mutation)

```typescript
// FRONTEND: User creates post with media
// File: @fanslib/apps/web/src/components/posts/PostEditor.tsx
const PostEditor = () => {
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const createPost = trpc.posts.create.useMutation();

  const handleSubmit = async (data) => {
    // Call tRPC directly (not through collection, as this is complex)
    const result = await createPost.mutateAsync({
      caption: data.caption,
      scheduledDate: data.date,
      channelId: data.channelId,
      mediaIds: selectedMedia,
      status: 'draft',
    });

    // Electric will automatically sync the new post
    // No need to manually update collection
  };

  return (
    <form onSubmit={handleSubmit}>
      <MediaSelector
        selected={selectedMedia}
        onChange={setSelectedMedia}
      />
      <input name="caption" />
      <DatePicker name="date" />
      {/* ... */}
    </form>
  );
};

// FRONTEND: Posts query hook automatically shows new post
// File: @fanslib/apps/web/src/query/posts.ts
export const usePosts = (options = {}) => {
  const query = useLiveQuery(postsCollection);
  // New post appears here automatically after Electric syncs
  return query;
};

// BACKEND: tRPC mutation creates post and relationships
// File: @fanslib/apps/server/src/modules/api/posts.ts
export const postsRouter = router({
  create: procedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        // Insert post
        const [post] = await tx.insert(postsTable).values({
          caption: input.caption,
          scheduledDate: input.scheduledDate,
          channelId: input.channelId,
          status: input.status,
        }).returning();

        // Insert post-media relationships
        if (input.mediaIds.length > 0) {
          await tx.insert(postMediaTable).values(
            input.mediaIds.map((mediaId, index) => ({
              postId: post.id,
              mediaId,
              order: index,
              isFreePreview: false,
            }))
          );
        }

        return { item: post, txid };
      });

      return result;
    }),
});
```

**Flow:**
```
User fills form → Submit → trpc.posts.create()
                                ↓
                        Server starts transaction
                                ↓
                        Generate txid
                                ↓
                        INSERT INTO posts (...)
                                ↓
                        INSERT INTO post_media (...) [multiple rows]
                                ↓
                        Commit transaction
                                ↓
                        Return { item, txid }
                                ↓
                        Electric detects new row via txid
                                ↓
                        Electric syncs to all clients
                                ↓
                        postsCollection updates
                                ↓
                        usePosts() hook returns new data
                                ↓
                        PostsList component re-renders
                                ↓
                        New post appears in UI
```

---

### Example 4: Filtered Query with Client-Side Logic

```typescript
// FRONTEND: Complex filtering in query hook
// File: @fanslib/apps/web/src/query/posts.ts
export const usePosts = (options: PostsQueryOptions = {}) => {
  const query = useLiveQuery(postsCollection);

  // Electric fetches ALL posts, we filter client-side
  const filteredData = useMemo(() => {
    if (!query.data) return [];

    return query.data.filter(post => {
      // Filter by channel
      if (options.channelId && post.channelId !== options.channelId) {
        return false;
      }

      // Filter by status
      if (options.status && post.status !== options.status) {
        return false;
      }

      // Filter by date range
      const postDate = new Date(post.scheduledDate);
      if (options.startDate && postDate < options.startDate) {
        return false;
      }
      if (options.endDate && postDate > options.endDate) {
        return false;
      }

      return true;
    });
  }, [query.data, options]);

  return {
    ...query,
    data: filteredData,
  };
};

// USAGE in component
// File: @fanslib/apps/web/src/components/posts/PostsList.tsx
const PostsList = () => {
  const [channelFilter, setChannelFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostStatus | null>(null);

  const posts = usePosts({
    channelId: channelFilter ?? undefined,
    status: statusFilter ?? undefined,
  });

  return (
    <div>
      <select onChange={(e) => setChannelFilter(Number(e.target.value))}>
        {/* channel options */}
      </select>

      <select onChange={(e) => setStatusFilter(e.target.value)}>
        {/* status options */}
      </select>

      {posts.data.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
```

**Flow:**
```
Component renders → usePosts({ channelId: 1, status: 'draft' })
                              ↓
                    useLiveQuery fetches all posts from Electric
                              ↓
                    Client-side filter applied
                              ↓
                    Return filtered array
                              ↓
                    Component renders filtered posts
                              ↓
                    User changes filter
                              ↓
                    Re-filter same data (no network request)
                              ↓
                    Component re-renders with new filter
```

---

### Example 5: Relational Data Loading

```typescript
// FRONTEND: Component needs post with media and channel info
// File: @fanslib/apps/web/src/components/posts/PostDetail.tsx
const PostDetail = ({ postId }: { postId: number }) => {
  const posts = usePosts();
  const media = useMedia();
  const channels = useChannels();

  // All three collections are synced independently
  const post = posts.data.find(p => p.id === postId);

  if (!post) return <div>Post not found</div>;

  // Get related media via post_media table
  const postMedia = usePostMedia({ postId });
  const postMediaItems = postMedia.data
    .map(pm => media.data.find(m => m.id === pm.mediaId))
    .filter(Boolean);

  // Get channel info
  const channel = channels.data.find(c => c.id === post.channelId);

  return (
    <div>
      <h1>{post.caption}</h1>
      <p>Channel: {channel?.name}</p>
      <p>Status: {post.status}</p>
      <p>Scheduled: {post.scheduledDate.toLocaleString()}</p>

      <div className="media-grid">
        {postMediaItems.map((item, index) => (
          <MediaTile key={item.id} media={item} />
        ))}
      </div>
    </div>
  );
};

// Each collection syncs independently
// Relationships are resolved client-side
// Changes to any table automatically propagate
```

**Flow:**
```
Component renders → Multiple useLiveQuery calls
                          ↓
                  Electric fetches from multiple endpoints:
                  - /api/posts
                  - /api/media
                  - /api/channels
                  - /api/post-media
                          ↓
                  All data cached locally
                          ↓
                  Client-side JOIN via .find()
                          ↓
                  Component renders complete view
                          ↓
                  Any table updates → Electric syncs → Component re-renders
```

---

## Migration Priority Order

### Week 1: Foundation
1. ✅ Database schema for Media & Shoots (extend existing)
2. Database schema for Posts, Channels, Subreddits
3. Electric endpoints for Posts, Channels, Subreddits
4. tRPC routers for Posts, Channels
5. Frontend collections for Posts, Channels
6. Query hooks for Posts, Channels

### Week 2: Core Features
7. Migrate Posts management UI
8. Migrate Channel management UI
9. Test post creation, editing, scheduling workflows
10. Database schema for Tags system
11. Electric endpoints for Tags
12. tRPC routers for Tags

### Week 3: Advanced Features
13. Migrate tagging UI
14. Database schema for Schedules, Snippets, Hashtags, Filter Presets
15. Electric endpoints for above
16. tRPC routers for above
17. Frontend collections and hooks

### Week 4: Supporting Features
18. Migrate remaining UI components
19. Settings management
20. Stubbed endpoints (Analytics, Reddit, etc.)
21. Testing and bug fixes

### Week 5: Polish
22. Performance optimization
23. Error handling improvements
24. Documentation
25. Migration guide for users

---

## Testing Strategy

### Unit Tests
**Directory:** `@fanslib/apps/server/src/modules/api/__tests__/`
- Test each tRPC router in isolation
- Mock database with Drizzle's mock adapter
- Test validation, error cases

### Integration Tests
**Directory:** `@fanslib/apps/web/src/__tests__/integration/`
- Test Electric sync flow
- Test tRPC mutations → Electric updates
- Test collection CRUD operations

### E2E Tests
**Directory:** `@fanslib/apps/web/src/__tests__/e2e/`
- Test full user workflows (create post, add media, schedule)
- Test cross-component reactivity
- Test offline/online scenarios with Electric

### Migration Validation
- Script to compare legacy SQLite data with new Postgres data
- Validate all entity counts match
- Validate relationships are preserved

---

## File Structure Summary

```
fanslib-web/
├── packages/
│   └── db/
│       └── src/
│           └── schema/
│               ├── media.ts (extend)
│               ├── posts.ts (new)
│               ├── channels.ts (new)
│               ├── shoots.ts (extend)
│               ├── tags.ts (new)
│               ├── schedules.ts (new)
│               ├── content.ts (new)
│               ├── filters.ts (new)
│               ├── settings.ts (new)
│               └── index.ts (update)
│
├── @fanslib/apps/server/
│   └── src/
│       └── modules/
│           └── api/
│               ├── posts.ts (new)
│               ├── channels.ts (new)
│               ├── tags.ts (new)
│               ├── shoots.ts (new)
│               ├── schedules.ts (new)
│               ├── snippets.ts (new)
│               ├── hashtags.ts (new)
│               ├── filter-presets.ts (new)
│               ├── settings.ts (new)
│               ├── analytics.ts (stubbed)
│               ├── reddit-poster.ts (stubbed)
│               └── automation.ts (stubbed)
│
└── @fanslib/apps/web/
    └── src/
        ├── routes/
        │   └── api/
        │       ├── media.ts (exists)
        │       ├── shoots.ts (exists)
        │       ├── posts.ts (new)
        │       ├── channels.ts (new)
        │       ├── subreddits.ts (new)
        │       ├── tag-dimensions.ts (new)
        │       ├── tag-definitions.ts (new)
        │       ├── media-tags.ts (new)
        │       ├── content-schedules.ts (new)
        │       ├── snippets.ts (new)
        │       ├── hashtags.ts (new)
        │       └── filter-presets.ts (new)
        │
        ├── lib/
        │   └── collections.ts (extend)
        │
        ├── query/
        │   ├── media.ts (exists)
        │   ├── posts.ts (new)
        │   ├── channels.ts (new)
        │   ├── tags.ts (new)
        │   ├── schedules.ts (new)
        │   ├── snippets.ts (new)
        │   ├── hashtags.ts (new)
        │   └── index.ts (update)
        │
        └── components/
            ├── media/ (exists)
            ├── posts/ (new)
            ├── channels/ (new)
            ├── tags/ (new)
            └── ... (other features)
```

---

## Next Steps

1. **Start with Phase 1**: Create database schemas for Posts, Channels, Subreddits
2. **Run migrations**: Generate and apply Drizzle migrations
3. **Create Electric endpoints**: Add shape endpoints for new tables
4. **Build tRPC routers**: Implement mutation handlers
5. **Create collections**: Wire up Electric collections in frontend
6. **Migrate components**: Start with Posts UI, then Channels

Each phase should be fully tested before moving to the next. The goal is to have a working application at every stage of migration.

---

## References

### Legacy Code Locations
- **IPC Handlers**: `@fanslib/apps/electron-legacy/src/features/*/api.ts`
- **Type Definitions**: `@fanslib/apps/electron-legacy/src/features/*/api-type.ts`
- **Entities**: `@fanslib/apps/electron-legacy/src/features/*/entity.ts`
- **Business Logic**: `@fanslib/apps/electron-legacy/src/features/*/operations.ts`

### Documentation
- [Electric SQL Docs](https://electric-sql.com)
- [TanStack Start Docs](https://tanstack.com/start)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [tRPC Docs](https://trpc.io)

---

**Last Updated:** 2025-10-11
