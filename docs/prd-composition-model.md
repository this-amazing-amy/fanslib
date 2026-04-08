# PRD: Video Editor v2 — Unified Composition Model with Sequence Timeline

## Problem Statement

The video editor is built around a single-source editing model: one source video in, overlay operations on top, one (or batch-clipped) output out. This limits the editor to promo clip extraction and censoring workflows. Creators also need to build trailers (8–15 highlight segments rearranged from a full video with crossfade transitions and music) and assemble multi-shot promos (multiple color-graded footage files combined into one output). These workflows currently require round-tripping through DaVinci Resolve, then manually renaming, uploading, and assigning outputs — losing FansLib's metadata-aware export pipeline, visual identity consistency, and library integration.

Additionally, color-graded footage (shot explicitly for promos, not extracted from a full video) has no home in the current system. It doesn't belong in the content library alongside finished deliverables, but it needs to be accessible as a building block for compositions.

## Solution

Replace the single-source editing model with a **Composition** entity — a persistent, per-shoot project that contains an ordered sequence of video segments from one or more sources, overlay/audio operation tracks, crossfade transitions, and export regions. The editor becomes shoot-level: entering from a shoot page provides a source bin of all shoot media and footage, while "quick edit" from a media item pre-populates a single full-length segment. All existing workflows (promo clips, censoring, transforms) are expressed as compositions — a censored video is a composition with one full-length segment and blur overlays; a batch clip export is a composition with one segment and multiple export regions.

A new **footage** media category stores color-graded source material per shoot, separate from the content library. Footage is uploaded through FansLib with a short note for identification and serves as building-block input for compositions.

`MediaEdit` is demoted to a render job — created at export time from a composition and export region snapshot.

## User Stories

### Composition lifecycle

1. As an editor, I want to create a new composition from a shoot page, so that I can start assembling content from that shoot's media and footage.
2. As an editor, I want to open an existing composition from the shoot page, so that I can resume editing or re-cut a previous project.
3. As an editor, I want compositions to auto-save, so that I don't lose work if I close the browser.
4. As an editor, I want to name my compositions (e.g., "Trailer v2", "Promo A/B test"), so that I can distinguish between multiple compositions in the same shoot.
5. As an editor, I want to delete a composition I no longer need, so that the shoot page stays clean.
6. As an editor, I want to see a list of all compositions for a shoot, so that I can manage my editing projects.

### Quick edit entry

7. As an editor, I want a "Quick Edit" button on a media detail page that opens the shoot-level editor with that media pre-loaded as a single full-length segment, so that simple edits (censoring, overlays) remain fast.
8. As an editor, I want the quick-edit flow to create a new composition automatically, so that I don't have to navigate to the shoot page first.

### Source bin

9. As an editor, I want to see all media and footage belonging to the shoot in a source bin panel, so that I can browse available material.
10. As an editor, I want to select a source from the bin, so that I can preview it and push segments onto the timeline.
11. As an editor, I want to deselect the source to return to sequence preview mode, so that I can see my assembled output.

### Source mode (segment creation)

12. As an editor, I want the composition preview area to show the selected source video when I select a source from the bin, so that I can scrub through it.
13. As an editor, I want to use I/O hotkeys to mark in/out points on the source, so that I can define a segment using the same muscle memory as clip marking.
14. As an editor, I want the marked segment to be pushed onto the end of my sequence timeline when I confirm it, so that I can build up a sequence incrementally.
15. As an editor, I want to push multiple segments from the same source without reselecting it, so that building a trailer from one video is fast.
16. As an editor, I want to push segments from different sources by switching my source selection, so that I can assemble multi-shot promos.

### Sequence mode (timeline editing)

17. As an editor, I want to see all my segments as blocks on a video track in the timeline, so that I can see the structure of my assembled sequence.
18. As an editor, I want segment blocks to look and behave like operation blocks (draggable, selectable, context menu), so that the interaction model is consistent.
19. As an editor, I want to drag segments to reorder them on the timeline, so that I can rearrange the sequence.
20. As an editor, I want to resize segment edges to trim their in/out points, so that I can fine-tune timing without going back to source mode.
21. As an editor, I want the composition preview to show the assembled sequence output when no source is selected, so that I can preview what I've built.
22. As an editor, I want to right-click a segment for a context menu with "Delete", consistent with operation blocks.
23. As an editor, I want undo/redo to work for all segment operations (add, reorder, trim, delete), so that I can experiment freely.

### Transitions

24. As an editor, I want hard cuts between segments by default, so that segments play back-to-back without effects.
25. As an editor, I want to add a crossfade transition between two adjacent segments (e.g., via right-click on the boundary or a toolbar tool), so that I can smooth scene changes.
26. As an editor, I want to see a visual indicator at segment boundaries where a crossfade is applied, so that I know which cuts have transitions.
27. As an editor, I want to select a transition indicator and edit its duration and easing in the properties panel, so that I can control the feel of the crossfade.
28. As an editor, I want the transition to move with its segment when I reorder, so that I don't have to reapply transitions after rearranging.
29. As an editor, I want the transition to be removed automatically if its segment becomes the first in the sequence (nothing to fade from), so that invalid state is prevented.

### Overlays on sequence timeline

30. As an editor, I want to add overlay operations (caption, blur, pixelate, emoji, zoom, watermark, audio) on the sequence timeline, so that overlays are positioned relative to the assembled output.
31. As an editor, I want overlay operations to behave exactly as they do today (draggable, trimmable, keyframeable, properties panel), so that existing workflows are preserved.
32. As an editor, I want overlay frame positions to be relative to the sequence timeline (not any individual source), so that a caption at frame 100 always appears at the same point in the assembled output regardless of how segments are arranged underneath.

### Export regions

33. As an editor, I want to mark export regions on the sequence timeline using I/O hotkeys (same as current clip marking), so that I can define which portions to export.
34. As an editor, I want no export regions to mean "export the entire timeline as one file", so that the simple case requires no extra steps.
35. As an editor, I want each export region to produce a separate output file, so that I can batch-export multiple deliverables from one composition.
36. As an editor, I want to set metadata (package, role, content rating, quality) per export region, so that different clips can have different classifications.
37. As an editor, I want export region metadata to default to sensible values (inherited from the source or shoot), so that I only need to override when something differs.
38. As an editor, I want to see export regions visually on the timeline (similar to current clip ranges), so that I know what will be exported.
39. As an editor, I want undo/redo to work for export region operations, so that I can experiment freely.

### Footage management

40. As an editor, I want to upload footage files to a shoot, so that I can import color-graded material from DaVinci Resolve.
41. As an editor, I want footage to be stored separately from the content library, so that raw ingredients don't clutter my deliverables.
42. As an editor, I want to add a short note to each footage file, so that I can identify clips without relying on cryptic filenames.
43. As an editor, I want to see footage listed on the shoot page alongside library media, so that I have a complete view of available material.
44. As an editor, I want a warning when I try to delete footage that is referenced by a composition, so that I don't accidentally break an editing project.
45. As an editor, I want footage to appear in the source bin when editing a composition for that shoot, so that I can use it as source material.

### Render and output

46. As an editor, I want to hit export and have each export region queued as a render job, so that I can batch-render multiple outputs.
47. As an editor, I want render progress feedback per export region / output file, so that I can track how far along the batch is.
48. As an editor, I want rendered outputs to land in the library with proper metadata, linked to the shoot, so that they're organized correctly.
49. As an editor, I want re-exporting from the same composition to create new files with incremental names (e.g., promo1, promo2), so that previous exports are not overwritten.
50. As an editor, I want the render pipeline to handle multi-segment sequences with crossfades and overlays, so that the output matches my timeline preview.

## Implementation Decisions

### Composition Entity

A new `Composition` entity replaces `MediaEdit` as the authoring container:
- `id` (UUID)
- `shootId` (FK → Shoot) — compositions are scoped to a single shoot
- `name` (string) — user-facing label
- `segments` (JSON array) — ordered list of Segment objects
- `tracks` (JSON array) — operation tracks (same format as current editor tracks)
- `exportRegions` (JSON array) — optional sub-ranges with per-region metadata
- `createdAt`, `updatedAt` (DateTime)

Compositions are always scoped to a single shoot. Multi-shoot compositions are out of scope.

### Segment Model

Each segment represents a time range from a source media or footage file:
- `id` (UUID)
- `sourceMediaId` (string, FK → Media) — which source this segment comes from
- `sourceStartFrame` (number) — in-point in the source
- `sourceEndFrame` (number) — out-point in the source
- `transition` (optional object) — crossfade into this segment from the previous one
  - `type`: `"crossfade"` (extensible later)
  - `durationFrames` (number) — typically 15 or 30
  - `easing` (optional EasingType)

The first segment in the sequence cannot have a transition (nothing to fade from). If a segment with a transition is moved to position 0, the transition is dropped.

### Sequence Timeline Computation

A pure function computes the sequence timeline from the ordered segments array. For each segment:
- Its **sequence start frame** is the previous segment's sequence end frame, minus the current segment's transition duration (if any) to create overlap.
- Its **sequence end frame** is its start frame plus `(sourceEndFrame - sourceStartFrame)`.
- The **total sequence duration** is the last segment's sequence end frame.

This is the core "deep module" — a set of pure functions with simple inputs (ordered segments) and simple outputs (frame positions), testable in complete isolation.

### Footage

Footage is represented as Media entities with a new `category` field: `"library" | "footage"`. Footage:
- Belongs to a shoot (via existing M2M relation)
- Is stored in a separate managed folder (`footage/` alongside `library/`)
- Has a `note` field (nullable string) for user-facing identification
- Does not have package/role/contentRating metadata (those belong to outputs, not ingredients)
- Appears in the source bin when editing compositions for its shoot
- Triggers a warning on deletion if referenced by any composition segment

### Source Bin

A new UI panel in the editor showing all media and footage for the composition's shoot. Selecting an item switches the composition preview area to **source mode**; deselecting returns to **sequence mode**.

In source mode, I/O hotkeys mark in/out points on the source. Confirming pushes a new segment onto the sequence timeline. The interaction reuses the existing mark-in/mark-out pattern from the clip store, but targets the segment model instead.

### Editor Entry Points

The editor route changes from `/library/$mediaId/edit/` to `/shoots/$shootId/compositions/$compositionId`. Two entry flows:

1. **From shoot page**: "New Composition" creates a Composition entity, navigates to the editor route. The source bin is populated from shoot media + footage. Timeline starts empty.
2. **Quick edit from media detail**: Creates a Composition with the selected media as a single full-length segment, navigates to the editor route. The source bin is populated from that media's shoot.

### Editor Store Changes

The editor store extends to manage segments alongside operation tracks:
- `segments: Segment[]` — ordered segment array
- `selectedSegmentId: string | null` — for segment selection
- Segment CRUD: `addSegment()`, `removeSegment()`, `reorderSegments()`, `trimSegmentStart()`, `trimSegmentEnd()`
- Transition management: `addTransition(segmentId)`, `removeTransition(segmentId)`, `updateTransition(segmentId, props)`
- Source mode state: `selectedSourceId`, `pendingSourceMarkIn`, `commitSourceSegment()`
- All segment mutations participate in undo/redo

Export regions replace the clip store:
- `exportRegions: ExportRegion[]` — array of `{ startFrame, endFrame, package?, role?, contentRating?, quality? }`
- Export region CRUD with undo/redo
- I/O marking workflow for creating export regions (reuses the mark-in/mark-out pattern)

### Export Region Model

Export regions are optional sub-ranges of the sequence timeline. Each region has:
- `id` (UUID)
- `startFrame`, `endFrame` — range on the sequence timeline
- `package`, `role`, `contentRating`, `quality` — per-region metadata, nullable (defaults inherited from shoot or source)

When no export regions are defined, the entire sequence timeline is treated as a single implicit export region.

### MediaEdit as Render Job

At export time, each export region produces a `MediaEdit`:
- `compositionId` (new FK → Composition) — links back to the source composition
- `type` is removed or set to a new value like `"composition"`
- `sourceMediaId` is removed (segments reference sources directly)
- Operations, segments, and transitions are snapshotted into the MediaEdit at creation time, so the render is reproducible even if the composition is later modified
- Status lifecycle remains: `queued` → `rendering` → `completed` / `failed`

### Render Pipeline Changes

The render function is extended to handle sequence compositions:
1. Receives the snapshotted segments, operations, and transition data from the MediaEdit
2. For each segment, resolves the source media file URL
3. Builds a Remotion `SequenceComposition` that:
   - Lays out segments in order on the sequence timeline
   - For each segment, renders the source video from `sourceStartFrame` to `sourceEndFrame`
   - Applies crossfade transitions (alpha blending over overlap frames)
   - Applies overlay operations (caption, blur, etc.) on the sequence timeline
   - Applies audio operations
4. Renders via Remotion's `renderMedia()`
5. Creates output Media entity linked to the shoot

### Remotion Sequence Composition

A new `SequenceComposition` component replaces `VideoComposition` for multi-segment renders:
- Receives `segments[]` with resolved source URLs and sequence-timeline positions
- Uses `useCurrentFrame()` to determine which segment(s) are active at the current frame
- During crossfade overlap, renders both segments and alpha-blends them
- Overlays (caption, blur, emoji, etc.) are rendered on top using the same components as today, but positioned relative to the sequence timeline
- Audio operations apply to the sequence timeline

For backward compatibility, single-segment compositions with no transitions can still use the existing `VideoComposition` path, or `SequenceComposition` can handle single segments as a degenerate case.

### Shoot Page Changes

The shoot page gains:
- A **Compositions section** listing all compositions for the shoot (name, creation date, segment count, export count)
- A **Footage section** showing uploaded footage with notes, upload button, delete with warning
- An **"Edit" button** that creates a new composition and navigates to the editor

### Timeline UI Changes

The timeline gains a **video track** (or "segment track") showing segment blocks. Segments:
- Use the same `OperationBlock` interaction model (drag to reorder, resize edges to trim, right-click context menu)
- Are visually distinct (different color/icon) but interact identically to operation blocks
- Show source media name or footage note for identification
- Display transition indicators at boundaries where crossfades are applied

Export regions are displayed similarly to current clip ranges — colored rectangles on a dedicated ruler or track.

## Testing Decisions

Good tests for this feature verify behavior through public interfaces — they should describe what the system does, not how. Tests should survive internal refactors.

### Pure logic (unit tests)

**Segment sequence engine** — Pure functions computing sequence timeline positions from an ordered segment array. Test: correct frame positions with no transitions, with crossfade overlaps, with mixed transition durations. Verify total duration computation. Same pattern as `block-drag.vitest.ts`.

**Export region intersection** — Given a sequence of segments and an export region (startFrame, endFrame), compute which segments and operations fall within the region and remap their frame positions. Extends the pattern from existing `clip-intersection.vitest.ts`.

**Transition math** — Crossfade overlap computation, validation (no transition on first segment), transition removal when segment moves to position 0.

**Footage deletion check** — Given a footage media ID and a list of compositions, determine if any composition references it in its segments. Pure function, no DB.

### Store tests (Vitest, following `editorStore.vitest.ts`)

**Editor store — segments** — Add segment, reorder, trim start/end edges, remove, undo/redo. Verify sequence timeline positions update correctly after mutations.

**Editor store — transitions** — Add crossfade to a segment, remove it, update duration/easing. Verify transition is dropped when segment moves to first position. Undo/redo.

**Editor store — source mode** — Select source, mark-in, commit segment push to timeline, deselect source. Verify segment is appended with correct source frame range.

**Editor store — export regions** — Add, remove, update metadata per region, undo/redo. Verify default behavior when no regions exist (whole timeline is export).

### Component tests (Vitest, following `Timeline.vitest.tsx`)

**Source bin** — Renders shoot media and footage, selection state changes, source/sequence mode toggle.

**Segment blocks on timeline** — Renders segment blocks with correct widths, source labels, drag and resize interactions.

**Transition indicators** — Renders crossfade indicator between adjacent segments, does not render on first segment.

**Export region timeline** — Renders export regions, mark-in/mark-out creation flow.

**Footage upload UI** — Upload flow renders, note field editable, delete warning when referenced.

### Server tests (Bun:test, following `flatten-tracks.test.ts`)

**Composition entity CRUD** — Create, update, fetch by shoot ID. Verify segments and tracks are persisted and retrieved correctly.

**Composition → MediaEdit export** — Given a composition and export region, verify the created MediaEdit contains the correct snapshotted segments, operations, and metadata.

**Render pipeline with segments** — Verify multi-source URL resolution, segment ordering in render input, transition data forwarded to Remotion composition.

**Footage entity** — Upload creates media with `category: "footage"`, note field persists, deletion warning fires when referenced by composition.

### Prior Art
- `editorStore.vitest.ts` — store behavior tests (45+ tests)
- `block-drag.vitest.ts` — pure function frame math tests
- `clip-intersection.vitest.ts` — export region intersection logic tests
- `Timeline.vitest.tsx` — component render tests
- `flatten-tracks.test.ts` — server utility tests
- `caption-layout.vitest.ts` — pure layout computation tests
- `coordinate-mapping.vitest.ts` — coordinate math tests

## Out of Scope

- **Multi-shoot compositions** — compositions are scoped to a single shoot. Cross-shoot assembly should be done in DaVinci Resolve.
- **Color grading** — footage arrives pre-graded from DaVinci or in-camera.
- **Parallel rendering** — export regions render sequentially. Optimize later if needed.
- **Footage scanning/import** — footage is uploaded manually, not scanned from filesystem.
- **Picture-in-picture / split screen** — the sequence is a flat assembly (segment A then B), not layered video tracks. Future consideration.
- **Blade/cut tool** — segments are created via I/O marking in source mode, not by splitting on the timeline.
- **Waveform visualization** — audio blocks display icon and filename only (deferred, same as audio PRD).
- **Migration of existing MediaEdit records** — the system starts fresh. A cleanup script may delete legacy records.

## Further Notes

- The audio track PRD (#262) is complementary — audio operations work on the sequence timeline in the same way as other overlays. No changes to the audio PRD are required beyond ensuring audio frame positions are relative to the sequence timeline.
- The `ClipStore` is superseded by the export region model in the editor store. The separate Zustand store can be removed.
- The existing `clip-intersection.ts` utility is the conceptual ancestor of the export region intersection logic, but operates on the sequence timeline rather than a single source.
- The `flattenTracks` utility remains relevant — it flattens operation tracks for the render pipeline. It may need extension to include segment data in the flattened output.
- The composition preview in sequence mode needs to handle the assembled timeline's total duration (computed from segments + transitions) rather than a single source's duration. The Remotion player's `durationInFrames` prop will be set from this computed value.
- Segment blocks and operation blocks share the same drag/resize/context-menu interaction model. Consider whether `OperationBlock` can be generalized to handle both, or whether a shared base component is warranted. The implementation should decide based on how much code is actually shared.
