# Captioning Page: Display All Media Items

## Overview

The captioning page currently only displays the first media item from a post, but users need to see ALL media items associated with a post to write accurate and comprehensive captions. This spec addresses the gap between the current single-media display and the desired multi-media display behavior.

## Problem Statement

**Current State:**
The `CaptionItem` component in the captioning workflow (`@fanslib/apps/web/src/features/pipeline/components/CaptioningStep/CaptionItem.tsx`) only displays the first media item from a post's media collection:

```typescript
const firstMedia = item.post.postMedia?.[0]?.media;
```

This creates significant usability issues:
- Users cannot see all media in a multi-media post while writing captions
- Captions may be inaccurate or incomplete because users don't have full context
- The behavior is inconsistent with other parts of the application (PostDetailPage, PostPreview) which show all media items

**Desired State:**
The captioning page should display ALL media items associated with a post, similar to how:
- `PostDetailMedia` component displays all media in a grid layout
- `PostPreview` component shows all media tiles
- `PostDetailPage` provides full visibility of all post media

**User Impact:**
Content creators need to see all media in a post to:
- Write captions that reference all images/videos in the set
- Ensure consistency across multi-media posts
- Avoid missing content that should be captioned
- Make informed decisions about caption content based on the complete visual context

## Current Implementation Analysis

### CaptionItem Component (Current State)

**Location:** `@fanslib/apps/web/src/features/pipeline/components/CaptioningStep/CaptionItem.tsx`

**Current Behavior:**
1. Extracts only the first media item: `const firstMedia = item.post.postMedia?.[0]?.media`
2. Displays single media in a fixed-width container (max-w-xs)
3. Shows video with `MediaView` controls, images with `MediaTileLite`
4. Fetches tags only for the first media item
5. Displays tags alongside the single media item

**Current Layout:**
```
+------------------------------------------+
| [Single Media]  [Tags]                   |
|                                          |
| [Caption Textarea]                       |
| [Action Buttons]                         |
+------------------------------------------+
```

### Data Structure (Already Supports Multiple Media)

The `CaptionQueueItemSchema` (from `fetch-caption-queue.ts`) already includes ALL media:

```typescript
postMedia: t.Array(PostMediaWithMediaAndShootsSchema)
```

The backend query correctly fetches all `postMedia` with relations and ordering:

```typescript
relations: {
  postMedia: {
    media: {
      shoots: true,
    },
  },
  // ... other relations
},
order: {
  date: "ASC",
  postMedia: {
    order: "ASC",  // Media items are ordered
  },
},
```

**Key Finding:** The data is already available - the frontend just needs to display it.

### Reference Implementation: PostDetailMedia

**Location:** `@fanslib/apps/web/src/features/posts/components/post-detail/PostDetailMedia.tsx`

**How it Works:**
1. Iterates over ALL `post.postMedia` items
2. Displays media in a responsive grid: `grid grid-cols-1 sm:grid-cols-2 gap-4`
3. Each media item shows:
   - Full media preview with controls
   - Hover overlay with action buttons (link, reveal in finder, delete)
   - Drag support for each item
4. Includes "Add Media" button at the end

**Layout:**
```
+----------------------+  +----------------------+
| [Media 1]           |  | [Media 2]           |
| (hover: actions)    |  | (hover: actions)    |
+----------------------+  +----------------------+
+----------------------+  +----------------------+
| [Media 3]           |  | [Add Media Button]  |
| (hover: actions)    |  |                     |
+----------------------+  +----------------------+
```

### Reference Implementation: PostPreview

**Location:** `@fanslib/apps/web/src/features/posts/components/PostPreview/PostPreview.tsx`

**How it Works:**
1. Maps over all `post.postMedia` items
2. Displays as horizontal row of thumbnails
3. Uses `MediaTile` component with consistent sizing (`size-24`)
4. Shows all media in compact preview format

## User Stories

**As a content creator:**
- I want to see all media items when writing a caption so that I can reference the complete content
- I want to quickly identify which media items are in the post so I can write accurate descriptions
- I want the same visibility in the captioning workflow that I have in the post detail page

**As a user managing multi-media posts:**
- I want to see the order of media items so my caption can reference them sequentially (e.g., "first photo shows X, second photo shows Y")
- I want to see all video thumbnails so I know what content I'm captioning without opening each separately
- I want to see media tags for ALL items in the post, not just the first one

## Functional Requirements

### Display All Media Items

1. **Must display ALL media items** from `item.post.postMedia` array, not just the first item
2. **Must maintain media order** as defined by the `order` field in `PostMedia` entity
3. **Must support both images and videos** with appropriate rendering for each type
4. **Must be responsive** and adapt to different screen sizes

### Media Presentation

1. **Grid Layout**: Display media in a grid similar to `PostDetailMedia` (responsive columns)
2. **Media Preview**: Use appropriate components:
   - Videos: `MediaView` with controls
   - Images: `MediaTileLite` or `MediaView` depending on interaction needs
3. **Aspect Ratio**: Maintain consistent sizing across media items (consider square aspect ratio for consistency)
4. **Interaction**: Each media item should support:
   - View/play functionality
   - Link to full media detail page
   - Reveal in Finder functionality (if available)

### Tag Display

1. **Show tags for all media items**, not just the first
2. **Options for tag display:**
   - Option A: Show tags for all media (may become cluttered)
   - Option B: Show tags only for the first media item (current behavior)
   - Option C: Show aggregated/unique tags across all media items
   - Option D: Show tags per media item (requires more complex layout)

**Recommendation:** Start with Option C (aggregated unique tags) for simplicity, with Option D as a future enhancement

### Layout Considerations

1. **Maintain caption workflow efficiency** - don't make the interface significantly larger/more complex
2. **Keep the caption textarea prominent** as the primary action area
3. **Balance media visibility with screen real estate** - possibly use compact grid for 2+ items
4. **Preserve existing functionality**: related captions, linked posts, snippet/hashtag buttons

## Acceptance Criteria

### Core Display Requirements

- [ ] When a post has 1 media item, it displays the single media (same as current behavior)
- [ ] When a post has 2+ media items, ALL items are visible in the caption interface
- [ ] Media items appear in the correct order as defined by `postMedia[].order`
- [ ] Both images and videos render correctly with appropriate controls
- [ ] The interface remains usable on standard laptop screen sizes (1280px+ width)

### Visual Requirements

- [ ] Media items are displayed in a grid layout (responsive: 1 column on mobile, 2+ columns on larger screens)
- [ ] Each media item has a consistent size/aspect ratio
- [ ] Video controls are functional and visible
- [ ] Media quality is sufficient for captioning context (thumbnails acceptable, full resolution not required)

### Tag Display Requirements

- [ ] Media tags are visible and useful for caption context
- [ ] Tag display doesn't create excessive clutter
- [ ] Tags maintain current styling (badge format with colors)

### Interaction Requirements

- [ ] Users can view/play each media item directly from the caption interface
- [ ] Link to media detail page is available for each media item
- [ ] Reveal in Finder button works for each media item (if applicable)
- [ ] Caption textarea remains easily accessible and doesn't require excessive scrolling
- [ ] Snippet selector and hashtag button functionality is preserved

### Performance Requirements

- [ ] Loading all media items doesn't cause noticeable performance degradation
- [ ] Tag queries are efficient (consider batching or preloading for multiple media items)
- [ ] Interface remains responsive during media rendering

## User Experience Requirements

### Primary Workflow

The captioning workflow should remain efficient and streamlined:
1. User sees the expanded caption item with all media visible
2. User reviews all media in the post
3. User writes caption with full context
4. User saves and advances to next item

### Visual Hierarchy

Priority order (top to bottom):
1. Post metadata (date, time, channel, schedule) - collapsed by default
2. **All media items** - prominently displayed
3. Media tags - visible but not dominant
4. Caption textarea - primary interaction area
5. Caption utilities (snippet selector, hashtag button)
6. Caption sync controls
7. Action buttons (Skip, Save & Next)
8. Related captions panel (right column on larger screens)

### Responsive Behavior

- **Small screens (<640px)**: Single column layout, stack all media vertically
- **Medium screens (640px-1024px)**: 2-column media grid
- **Large screens (1024px+)**: 2-column media grid with related captions panel on the right

### Error States

- If media fails to load: Show placeholder with error indicator
- If no media items exist: Show empty state message (edge case, shouldn't happen in caption queue)

## Business Rules & Constraints

### Data Constraints

1. Posts in the caption queue always have at least one media item (enforced by business logic)
2. Media order is significant and must be preserved
3. Some media items may not have tags (display gracefully)
4. Video duration and other metadata should be shown when available

### Performance Constraints

1. Media thumbnails should load quickly (server provides optimized thumbnails)
2. Tag queries should not block media rendering
3. Consider lazy loading for posts with many media items (5+ items)

### Permission Constraints

1. "Reveal in Finder" functionality requires server access (may not work in all deployment contexts)
2. Media file access requires proper path resolution

## Integration Points

### Existing Components to Reuse

1. **MediaView** - Used for video playback with controls
2. **MediaTileLite** - Used for image thumbnails in current implementation
3. **MediaTile** - Alternative option, used in PostPreview and library views
4. **TagBadge** - Used for displaying media tags
5. **RevealInFinderButton** - Used in PostDetailMedia for file system access

### Queries to Leverage

1. **useMediaTagsQuery** - Currently fetches tags for first media only
   - May need to batch query for multiple media IDs
   - Or fetch tags for all media in the post via a new query
2. **useCaptionQueueQuery** - Already returns all media data, no changes needed

### Context Providers

All existing context providers remain unchanged:
- MediaSelectionProvider
- LinkedPostsContext
- MediaDragProvider (parent level)

## Proposed Solution

### High-Level Approach

1. Replace single media display with a grid layout that maps over all `item.post.postMedia`
2. Display each media item using appropriate component (MediaView for videos, MediaTileLite for images)
3. Aggregate tags from all media items for display
4. Adjust layout to accommodate multiple media while maintaining caption textarea prominence

### Technical Implementation

#### Component Structure

```typescript
// In CaptionItem component

// 1. Get all media items instead of just first
const allMedia = item.post.postMedia.map(pm => pm.media);

// 2. Fetch tags for all media (aggregated approach)
const mediaIds = allMedia.map(m => m.id);
// Option: Use existing query in a loop (simple but multiple requests)
// Option: Create new query that accepts multiple IDs (more efficient)

// 3. Aggregate unique tags across all media
const allTags = [...]; // Deduplicated tags from all media items

// 4. Render grid of media items
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {item.post.postMedia.map((postMedia) => (
    <div key={postMedia.id} className="aspect-square">
      {postMedia.media.type === "video" ? (
        <MediaView media={postMedia.media} controls />
      ) : (
        <MediaTileLite media={postMedia.media} />
      )}
      {/* Optional: Per-media action buttons like PostDetailMedia */}
    </div>
  ))}
</div>
```

#### Layout Changes

Replace current single-media layout:

```typescript
// CURRENT (lines 253-278 in CaptionItem.tsx)
<div className="flex gap-4 items-start">
  <div className="w-full aspect-square max-w-xs flex-shrink-0">
    {/* Single media */}
  </div>
  <div className="flex flex-wrap gap-2 pt-2">
    {/* Tags for first media only */}
  </div>
</div>
```

With new multi-media grid layout:

```typescript
// PROPOSED
<div className="space-y-4">
  {/* Media Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {item.post.postMedia.map((postMedia) => (
      <div 
        key={postMedia.id}
        className="aspect-square rounded-lg overflow-hidden bg-base-300 group relative"
      >
        {postMedia.media.type === "video" ? (
          <MediaView media={postMedia.media} controls />
        ) : (
          <MediaTileLite media={postMedia.media} />
        )}
        
        {/* Optional: Hover actions like PostDetailMedia */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Link to="/content/library/media/$mediaId" params={{ mediaId: postMedia.media.id }}>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <RevealInFinderButton relativePath={postMedia.media.relativePath} />
        </div>
      </div>
    ))}
  </div>

  {/* Aggregated Tags */}
  {aggregatedTags.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {aggregatedTags
        .filter((tag) => tag.stickerDisplay && tag.stickerDisplay !== "none")
        .map((tag) => (
          <TagBadge key={tag.id} tag={...} size="md" />
        ))}
    </div>
  )}
</div>
```

#### Tag Aggregation Strategy

**Simple Approach (Initial Implementation):**
```typescript
// Query tags for the first media item only (current behavior)
// Show these tags below all media items
// This maintains current performance while showing all media

const firstMedia = item.post.postMedia?.[0]?.media;
const { data: mediaTagsData } = useMediaTagsQuery({ 
  mediaId: firstMedia?.id ?? "" 
});
```

**Enhanced Approach (Future Enhancement):**
```typescript
// Fetch tags for all media items
const allMediaTags = await Promise.all(
  item.post.postMedia.map(pm => 
    fetchMediaTags({ mediaId: pm.media.id })
  )
);

// Deduplicate tags by tagDefinitionId
const uniqueTags = deduplicateBy(allMediaTags.flat(), 'tagDefinitionId');
```

### CSS/Styling Considerations

1. Use responsive grid with Tailwind: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2`
2. Maintain aspect-square for consistent sizing
3. Use gap-4 for spacing between media items
4. Consider max height for media grid to prevent excessive scrolling
5. Ensure caption textarea remains visible without scrolling on typical screens

### Testing Scenarios

1. **Single media post**: Should display similar to current behavior
2. **Two media post**: Should display in grid layout (2 columns on medium+ screens)
3. **Three+ media post**: Should display all media in grid, potentially scrollable
4. **Mixed media types**: Post with both images and videos should render correctly
5. **Tags across multiple media**: Tags should display appropriately (not duplicated, properly aggregated)
6. **Responsive layout**: Grid should adapt to screen size (1 col on mobile, 2 cols on desktop)

## Out of Scope

The following are explicitly NOT included in this specification:

1. **Reordering media** within the caption interface - media order is set elsewhere
2. **Adding/removing media** from posts in the caption interface - use PostDetailPage for this
3. **Editing media** (cropping, filters, etc.) - not part of captioning workflow
4. **Individual captions per media** - this is a post-level caption feature
5. **Per-media tag editing** - tags are managed in the library/media detail pages
6. **Fansly statistics per media** - analytics belong in PostDetailPage
7. **Media drag-and-drop reordering** - not needed for captioning workflow

## Success Metrics

### Qualitative Metrics

- Users can write more accurate captions with full media context
- Reduction in caption editing after initial creation
- Positive user feedback about visibility improvements

### Quantitative Metrics (if tracking available)

- Time to complete captioning workflow (should not increase significantly)
- Number of "Save & Next" actions vs "Skip" actions (better visibility may reduce skips)
- Frequency of navigating to PostDetailPage from caption interface (should decrease)

## Implementation Notes

### Phase 1: Core Multi-Media Display (MVP)

1. Update `CaptionItem` component to map over all `item.post.postMedia` items
2. Replace single media container with responsive grid layout
3. Render all media items using existing components (MediaView for videos, MediaTileLite for images)
4. Keep existing tag display (first media only) to maintain performance
5. Test responsive behavior and adjust grid sizing

**Files to Change:**
- `@fanslib/apps/web/src/features/pipeline/components/CaptioningStep/CaptionItem.tsx`

**Backend Changes:**
- None required (data already available)

### Phase 2: Enhanced Tag Display (Future)

1. Create or enhance query to fetch tags for multiple media IDs efficiently
2. Implement tag aggregation logic (deduplicate by tagDefinitionId)
3. Update UI to show aggregated tags below media grid
4. Consider showing tag source (which media items have which tags) if useful

### Phase 3: Interaction Enhancements (Future)

1. Add hover actions to media items (link to detail, reveal in finder)
2. Implement lazy loading for posts with many media items (5+ items)
3. Add keyboard shortcuts for navigating between media items
4. Consider lightbox/modal for viewing full-size media

## Risk Assessment

### Low Risk
- Displaying multiple media items - data is already available
- Grid layout implementation - well-established patterns exist
- Component reuse - existing components are suitable

### Medium Risk
- Performance with many media items - may need lazy loading or optimization
- Tag aggregation complexity - deduplication logic needs careful testing
- Responsive layout - needs testing across various screen sizes
- User preference for layout - some users may prefer different arrangements

### Mitigation Strategies
1. Start with simple implementation (Phase 1) and iterate based on user feedback
2. Add performance monitoring for posts with many media items
3. Provide responsive design that works across common screen sizes
4. Test with realistic data (posts with 2-10 media items)
5. Keep existing tag display initially to avoid complexity/performance issues

## Questions for Clarification

1. **Tag Display Preference**: Should we show tags for all media (aggregated) or just first media initially?
   - Recommendation: Start with first media only (current behavior) to minimize scope
   
2. **Maximum Media Items**: Is there a practical limit to media items per post? Should we handle large sets differently?
   - Consider lazy loading or pagination for 5+ items
   
3. **Action Buttons**: Should each media item have action buttons (link, reveal in finder) like PostDetailMedia?
   - Recommendation: Add in Phase 2 if users need quick access to media details
   
4. **Grid Column Count**: Should we use 2 columns on desktop or allow 3+ for better space utilization?
   - Recommendation: Start with 2 columns max to maintain large preview sizes

## References

### Related Components
- `PostDetailMedia.tsx` (lines 76-121) - Grid layout with all media
- `PostPreview.tsx` (lines 318-333) - Horizontal media tiles
- `CaptionItem.tsx` (lines 54, 253-278) - Current single media display

### Data Structures
- `CaptionQueueItemSchema` - Contains all `postMedia` with media and shoots
- `PostMedia` entity - Has `order` field for sequencing
- `fetch-caption-queue.ts` (lines 120-141) - Query includes all postMedia with ordering

### Related Issues
- None identified yet - this is the initial spec

## Appendix: Current vs. Proposed UI Comparison

### Current UI (Single Media)
```
┌─────────────────────────────────────────────────────────┐
│ Post Header (collapsed)                                 │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐  [Tags]                                │
│ │   Media 1   │                                         │
│ │   (only)    │                                         │
│ └─────────────┘                                         │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ Caption Textarea                                 │    │
│ │                                                  │    │
│ └─────────────────────────────────────────────────┘    │
│ [Caption Tools] [Sync Controls]                        │
│ [Skip] [Save & Next]                                   │
└─────────────────────────────────────────────────────────┘
```

### Proposed UI (Multi-Media)
```
┌─────────────────────────────────────────────────────────┐
│ Post Header (collapsed)                                 │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐                       │
│ │   Media 1   │  │   Media 2   │                       │
│ │             │  │             │                       │
│ └─────────────┘  └─────────────┘                       │
│ ┌─────────────┐  ┌─────────────┐                       │
│ │   Media 3   │  │   Media 4   │                       │
│ │             │  │             │                       │
│ └─────────────┘  └─────────────┘                       │
│                                                         │
│ [Aggregated Tags]                                       │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ Caption Textarea                                 │    │
│ │                                                  │    │
│ └─────────────────────────────────────────────────┘    │
│ [Caption Tools] [Sync Controls]                        │
│ [Skip] [Save & Next]                                   │
└─────────────────────────────────────────────────────────┘
```

### Responsive Layout (Mobile)
```
┌──────────────────────┐
│ Post Header          │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │    Media 1       │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │    Media 2       │ │
│ └──────────────────┘ │
│ [Tags]               │
│ ┌──────────────────┐ │
│ │ Caption Textarea │ │
│ └──────────────────┘ │
│ [Tools]              │
│ [Buttons]            │
└──────────────────────┘
```
