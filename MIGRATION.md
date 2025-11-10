# Schema Co-location & Types Package Removal Migration

## Overview

This migration refactors the codebase to:
1. **Co-locate schemas** with server operations (using Elysia TypeBox)
2. **Replace client API layer** with Eden Treaty for type-safe API calls
3. **Delete the types package** entirely (types inferred from server)

## Quick Start - Copy/Paste Templates

### Server Operation Template (with path params)
```typescript
import { t } from "elysia";

// ALWAYS add ParamsSchema for routes with :id
export const GetFooByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const GetFooByIdResponseSchema = t.Object({
  // ... response fields
});

export const getFooById = async (id: string): Promise<typeof GetFooByIdResponseSchema.static> => {
  // implementation
};
```

### Add to Central Schemas Export
```typescript
// In @fanslib/apps/server/src/schemas.ts
export {
  GetFooByIdRequestParamsSchema,
  GetFooByIdResponseSchema,
} from './features/foos/operations/foo/fetch-by-id';
```

### Client Hook Template
```typescript
import type {
  GetFooByIdRequestParamsSchema,
  UpdateFooRequestParamsSchema,
  UpdateFooRequestBodySchema,
} from '@fanslib/server/schemas';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eden } from '../api/eden';

// Query with params
export const useFooQuery = (params: typeof GetFooByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['foo', params.id],
    queryFn: async () => {
      const result = await eden.api.foos({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

// Mutation with params + body
type UpdateFooParams = typeof UpdateFooRequestParamsSchema.static & {
  updates: typeof UpdateFooRequestBodySchema.static;
};

export const useUpdateFooMutation = () =>
  useMutation({
    mutationFn: async ({ id, updates }: UpdateFooParams) => {
      const result = await eden.api.foos({ id }).patch(updates);
      return result.data;
    },
  });
```

## Reference Implementation

The `library/media` feature has been fully migrated and serves as the complete reference:

### Server Side
- **Schemas folder**: `@fanslib/apps/server/src/features/library/schemas/`
  - `media-filter.ts` - Reusable filter schema
  - `media-sort.ts` - Reusable sort schema
- **Entity schema**: `@fanslib/apps/server/src/features/library/entity.ts`
  - `MediaSchema` co-located with database entity
- **Operation schemas**: All operations have ParamsSchema, BodySchema, ResponseSchema
  - `@fanslib/apps/server/src/features/library/operations/media/fetch-by-id.ts`
  - `@fanslib/apps/server/src/features/library/operations/media/update.ts`
  - etc.
- **Central exports**: `@fanslib/apps/server/src/schemas.ts`
  - All media schemas exported from one place
- **Route file**: `@fanslib/apps/server/src/features/library/routes.ts`
  - Imports schemas from operations
  - Applies schemas to route handlers

### Client Side
- **Query hooks**: `@fanslib/apps/web/src/lib/queries/media.ts`
  - All hooks use `@fanslib/server/schemas` imports
  - Proper param types with `typeof Schema.static`
  - Eden Treaty calls with function params
- **URL helpers**: `@fanslib/apps/web/src/lib/media-urls.ts`
  - Separate file for static URL generation
- **No API file**: Old `lib/api/media.ts` completely deleted

## Migration Instructions

### For Each Feature - Server Side

1. **Create schema structure**:
   ```bash
   mkdir -p @fanslib/apps/server/src/features/[feature]/schemas
   ```

2. **Convert Effect Schema → Elysia TypeBox**:
   - Find schemas in `@fanslib/libraries/types/src/features/[feature]/`
   - Convert syntax:
     - `S.String` → `t.String()`
     - `S.Number` → `t.Number()`
     - `S.Boolean` → `t.Boolean()`
     - `S.Array(...)` → `t.Array(...)`
     - `S.Struct({...})` → `t.Object({...})`
     - `S.optional(...)` → `t.Optional(...)`
     - `S.Union(...)` → `t.Union(...)`
     - `S.Literal(...)` → `t.Literal(...)`

3. **Create request/response schemas** in operation files:
   ```typescript
   import { t } from 'elysia'

  
   export const CreateFooBodySchema = t.Object({
     name: t.String(),
     // ... other fields
   })

   // and/or
   export const CreateFooQuerySchema = ...
   // and/or
   export const CreateFooParamsSchema = ...

   export const CreateFooResponseSchema = t.Object({
     id: t.String(),
     name: t.String(),
     // ... other fields
   })
   ```

4. **Co-locate entity schemas** with entity files if needed

5. **Update route file**:
   ```typescript
   import { CreateFooRequestSchema, CreateFooResponseSchema } from './operations/foo/create'

   .post('/', async ({ body }) => {
     return await createFoo(body)
   }, {
     body: CreateFooBodySchema,
     params: CreateFooParamsSchema,
     query: CreateFooQuerySchema,
     response: CreateFooResponseSchema
   })
   ```

6. **Test endpoint**: Verify with curl/Postman

### For Each Feature - Client Side

**IMPORTANT**: Follow the media feature as the reference implementation!

1. **Add ParamsSchema to server operations** (for routes with `:id`):
   ```typescript
   // In server operation file (e.g., fetch-by-id.ts, update.ts, delete.ts)
   export const GetFooByIdRequestParamsSchema = t.Object({
     id: t.String(),
   });

   export const getFoo = async (id: string) => { ... }
   ```

2. **Add schemas to central export** (`@fanslib/apps/server/src/schemas.ts`):
   ```typescript
   export {
     GetFooByIdRequestParamsSchema,
     GetFooByIdResponseSchema,
   } from './features/foos/operations/foo/fetch-by-id';

   export {
     UpdateFooRequestParamsSchema,
     UpdateFooRequestBodySchema,
     UpdateFooResponseSchema,
   } from './features/foos/operations/foo/update';
   ```

3. **Import schemas from central export** in client:
   ```typescript
   // In client: @fanslib/apps/web/src/lib/queries/foos.ts
   import type {
     GetFooByIdRequestParamsSchema,
     UpdateFooRequestParamsSchema,
     UpdateFooRequestBodySchema,
   } from '@fanslib/server/schemas';
   ```

4. **Use proper param types in hooks**:
   ```typescript
   // Query hook with params
   export const useFooQuery = (params: typeof GetFooByIdRequestParamsSchema.static) =>
     useQuery({
       queryKey: ['foo', params.id],
       queryFn: async () => {
         const result = await eden.api.foos({ id: params.id }).get();
         return result.data;
       },
       enabled: !!params.id,
     });

   // Mutation hook with params + body
   type UpdateFooParams = typeof UpdateFooRequestParamsSchema.static & {
     updates: typeof UpdateFooRequestBodySchema.static;
   };

   export const useUpdateFooMutation = () =>
     useMutation({
       mutationFn: async ({ id, updates }: UpdateFooParams) => {
         const result = await eden.api.foos({ id }).patch(updates);
         return result.data;
       },
     });
   ```

5. **Replace Eden calls** (use function params, NOT bracket indexing):
   ```typescript
   // CORRECT - Use function with params object
   eden.api.foos({ id }).get()
   eden.api.foos({ id }).patch(body)
   eden.api.foos({ id }).delete()

   // WRONG - Don't use bracket indexing with strings
   eden.api.foos[id].get() // ❌ TypeScript error!
   ```

6. **Handle URL helpers separately**:
   ```typescript
   // If feature has URL helpers (like media), create a separate utils file
   // e.g., @fanslib/apps/web/src/lib/foo-urls.ts
   export const getFooFileUrl = (id: string) => `/api/foos/${id}/file`;
   ```

7. **Delete old API file** after all usages migrated

## Migration Checklist

### Phase 1: Server Schema Migration

- [x] **Posts Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 8 endpoints

- [x] **Channels Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 6 endpoints

- [x] **Subreddits Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 6 endpoints (including last-post-dates)

- [x] **Tags Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations (dimensions, definitions, media tags)
  - [x] Update routes.ts
  - [ ] Test all 20+ endpoints

- [x] **Hashtags Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 9 endpoints

- [x] **Shoots Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 5 endpoints

- [x] **Content Schedules Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 6 endpoints

- [x] **Filter Presets Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 5 endpoints

- [x] **Snippets Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [x] Remove incrementUsage operation (no server route)
  - [ ] Test all 7 endpoints

- [x] **Settings Feature**
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 6 endpoints (credentials + settings)

- [x] **Postpone Feature** (api-postpone)
  - [x] Create schemas folder
  - [x] Convert all schemas from types package
  - [x] Add schemas to operations
  - [x] Update routes.ts
  - [ ] Test all 4 endpoints

- [x] **Analytics Feature**
  - [x] Create schemas folder
  - [x] Convert complex types using t.Intersect (ActionableInsight, FanslyPostWithAnalytics, etc.)
  - [x] Add schemas to operations (insights, fetch-posts, fetch-hashtags, fetch-time)
  - [x] Update routes.ts with proper validation for all endpoints
  - [ ] Test all 8 endpoints
  - Note: Successfully migrated complex nested types using t.Intersect and t.Union

- [x] **Media Feature (Remaining)**
  - [x] Add schemas for getMediaById
  - [x] Add schemas for updateMedia
  - [x] Add schemas for deleteMedia
  - [x] Add schemas for findAdjacentMedia
  - [x] Add schemas for scan operations
  - [x] Update routes.ts
  - [ ] Test all remaining endpoints

### Phase 2: Client Migration

- [ ] **Posts Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/posts.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Channels Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/channels.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Subreddits Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/subreddits.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Tags Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/tags.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Hashtags Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/hashtags.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Shoots Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/shoots.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Content Schedules Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/content-schedules.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Filter Presets Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/filter-presets.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Snippets Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/snippets.ts` to Eden
  - [ ] Remove incrementUsage function
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Settings Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/settings.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Postpone Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/postpone.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [ ] **Analytics Client**
  - [ ] Migrate `@fanslib/apps/web/src/lib/api/analytics.ts` to Eden
  - [ ] Update all query/mutation files
  - [ ] Test UI functionality
  - [ ] Delete old API file

- [x] **Media Client**
  - [x] Migrated all queries/mutations to Eden Treaty
  - [x] Added ParamsSchema to all media operations (GetMediaByIdRequestParamsSchema, etc.)
  - [x] Created `@fanslib/server/schemas.ts` central export for all schemas
  - [x] Updated package.json exports for clean schema imports (`@fanslib/server/schemas`)
  - [x] Imported types from server schemas in all client hooks
  - [x] Updated useScan hook to use Eden directly with server types
  - [x] Created `media-urls.ts` utility for URL helpers
  - [x] Updated all components to use URL utility functions
  - [x] Deleted `lib/api/media.ts` entirely
  - [ ] Test UI functionality

### Phase 3: Types Package Cleanup

- [ ] Delete types package: `rm -rf @fanslib/libraries/types`
- [ ] Remove from workspace: Update root `package.json` workspaces
- [ ] Remove from dependencies: Update server/web `package.json`
- [ ] Search for remaining imports: `grep -r "@fanslib/types" @fanslib/apps/`
- [ ] Fix any remaining import errors

### Phase 4: Verification

- [ ] Run type check in server: `cd @fanslib/apps/server && bunx tsc --noEmit`
- [ ] Run type check in web: `cd @fanslib/apps/web && bunx tsc --noEmit`
- [ ] Test critical flows:
  - [ ] Media gallery and filtering
  - [ ] Posts CRUD
  - [ ] Channels CRUD
  - [ ] Tag management
  - [ ] Settings updates
- [ ] Run build: `bun run build`
- [ ] Fix any runtime errors

## Common Issues & Solutions

### Issue: "Cannot find module '@fanslib/types'"
**Solution**: Update imports to use Eden inferred types or local schemas

### Issue: JSON query parameters not working
**Solution**: Ensure Eden client handles JSON serialization, check Superjson config

### Issue: Date serialization broken
**Solution**: Verify Superjson is configured in Eden client (already done in `eden.ts`)

### Issue: Type inference not working
**Solution**: Ensure route schemas are properly typed and exported

## Key Patterns & Learnings from Media Migration

### Server-Side Patterns

1. **ParamsSchema for ALL path parameters**:
   - Every operation with `/:id` MUST have a `RequestParamsSchema`
   - Pattern: `GetFooByIdRequestParamsSchema`, `UpdateFooRequestParamsSchema`, etc.
   - Always export these schemas alongside body/query/response schemas

2. **Central schema exports** (`@fanslib/apps/server/src/schemas.ts`):
   - Export ALL schemas from one place for clean client imports
   - Group by feature, include params, body, query, and response schemas
   - Update this file as you migrate each feature

3. **Package.json exports**:
   - Add `"./schemas": { "types": "./src/schemas.ts" }` to server package.json
   - Enables clean imports: `import { FooSchema } from '@fanslib/server/schemas'`

### Client-Side Patterns

1. **Hook parameter types**:
   - Use `params: typeof FooRequestParamsSchema.static` for path params
   - Use `body?: typeof FooBodySchema.static` for request bodies
   - Combine with intersection types when needed

2. **Eden Treaty syntax**:
   - ✅ `eden.api.foos({ id }).get()` - Function call with params object
   - ❌ `eden.api.foos[id].get()` - Bracket indexing (doesn't work with strings)
   - Always unwrap data: `const result = await eden.api.foos.post(); return result.data;`

3. **URL helpers**:
   - Keep pure string template functions separate (e.g., `media-urls.ts`)
   - Don't use Eden for static URL generation
   - Pattern: `export const getFooUrl = (id: string) => \`/api/foos/${id}/file\``

4. **Import organization**:
   - Always import types from `@fanslib/server/schemas`
   - Never import from deep paths like `@fanslib/server/src/features/...`
   - Group all schema imports together at the top

### Complete Migration Checklist per Feature

- [ ] **Server**: Add `RequestParamsSchema` to all operations with `:id`
- [ ] **Server**: Export all schemas in `src/schemas.ts`
- [ ] **Client**: Import schemas from `@fanslib/server/schemas`
- [ ] **Client**: Update hooks to use proper param types
- [ ] **Client**: Use Eden Treaty with function params (not bracket indexing)
- [ ] **Client**: Extract URL helpers to separate utils file
- [ ] **Client**: Delete old API file
- [ ] **Test**: Verify all endpoints work

## Notes

- **Skip**: `automation.ts` and `reddit-poster.ts` (handle separately later)
- **Delete**: `snippets.incrementUsage` functionality (no server endpoint)
- **Effect Schema**: Completely replaced with Elysia TypeBox
- **Breaking Changes**: All imports from types package will break (expected)

## Progress Tracking

**Phase 1 Server**: ✅ 13/13 features complete (100%)
- Posts, Media, Channels, Subreddits, Hashtags, Shoots, Tags
- Content Schedules, Filter Presets, Snippets, Settings
- Postpone, Analytics
**Phase 2 Client**: ✅ 1/13 features complete (8%)
- ✅ Media (queries/mutations migrated to Eden)
**Phase 3 Cleanup**: 0/5 tasks complete
**Phase 4 Verification**: 0/7 tasks complete

**Total Progress**: 14/38 major tasks complete (37%)
