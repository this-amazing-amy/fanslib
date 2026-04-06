# PRD: Audio Track — Music Overlay with Crossfade and NLE Timeline Integration

## Problem Statement

Creators need to add background music to their video edits — time it precisely so beat drops align with visual peaks, control the mix between original and overlay audio, and preview the result before exporting. The editor currently supports only visual operations (blur, caption, crop, etc.) and has no audio editing capability. The recently-built NLE timeline with multi-track support provides the foundation, but audio operations need to integrate with its frame-based positioning model rather than the simpler offset-based approach originally envisioned.

## Solution

Add an audio track operation that lets creators overlay a music clip from the asset library onto a video. Audio operations use the same `startFrame`/`endFrame` positioning as all other timeline operations. A dedicated, visually distinct audio track auto-appears when audio is added and auto-disappears when removed. A crossfade slider controls the mix between original video audio and the overlay music. Preview playback applies simple peak normalization so volume levels approximate the final render, while the server applies full FFmpeg loudnorm at export time.

## User Stories

1. As an editor, I want to click an "Audio" tool button in the toolbar, so that I can start adding music to my video.
2. As an editor, I want to browse my uploaded audio assets in a popover picker with play-preview buttons, so that I can audition clips before selecting one.
3. As an editor, I want the selected audio to appear as a colored block on a dedicated audio track in the timeline, so that I can see where it sits relative to my video and other operations.
4. As an editor, I want to drag the audio block left and right on the timeline, so that I can align the music with specific visual moments.
5. As an editor, I want to drag the audio block past the video start (negative startFrame), so that I can skip into the middle of a song and have the beat drop align with my video's opening.
6. As an editor, I want to see a visual trim indicator (hatched/dimmed region at block start) when the audio has a negative startFrame, so that I understand which portion of the audio is being skipped.
7. As an editor, I want a crossfade slider labeled "Original ↔ Music" in the properties panel, so that I can control the balance between the video's original audio and the overlay music.
8. As an editor, I want crossfade=0 to mean original audio only and crossfade=1 to mean music only, so that the control is intuitive.
9. As an editor, I want the Remotion preview player to play my audio mix at approximately correct volume levels (peak-normalized), so that I can make creative decisions without exporting first.
10. As an editor, I want the exported render to apply proper loudness normalization (loudnorm) to both audio sources independently before mixing, so that the final output has broadcast-quality audio levels.
11. As an editor, I want the audio tool button to be hidden when I'm editing an image, so that I'm not confused by an inapplicable feature.
12. As an editor, I want the audio track to not render at all when editing an image, so that audio operations from data are silently ignored.
13. As an editor, I want the audio track to auto-appear when I add my first audio operation, so that the timeline stays clean when I'm not using audio.
14. As an editor, I want the audio track to auto-disappear when I delete my last audio operation, so that unused tracks don't clutter my workspace.
15. As an editor, I want to add multiple audio tracks (each with one audio block), so that I can layer ambient sound and music separately.
16. As an editor, I want undo/redo to work for audio add, offset change, crossfade change, and asset change, so that I can experiment freely.
17. As an editor, I want the audio block to show a music icon and the asset filename, so that I can identify which audio clip it is without opening properties.
18. As an editor, I want to trim the audio block's start and end by dragging its edges (same as other operations), so that I can use only a portion of the audio clip.
19. As an editor, I want to right-click an audio block for a context menu with "Delete", consistent with other block types.
20. As an editor, I want the I/O hotkeys to set startFrame/endFrame on a selected audio operation, consistent with other operation types.
21. As an editor, I want to change the audio asset after adding the operation (via the properties panel), so that I can swap songs without removing and re-adding the block.
22. As an editor, I want the audio block's width to accurately reflect the audio clip's duration in frames, so that the timeline is truthful.
23. As an editor, I want the properties panel to show a read-only offset display (startFrame in timecode), so that I can see the precise position.

## Implementation Decisions

### Data Model

**AudioOperation type** joins the existing Operation union with standard NLE fields:
- `type: "audio"` discriminant
- `id: string` — UUID, same as all operations
- `assetId: string` — reference to an audio Asset
- `startFrame: number` — can be negative (trims audio beginning; `startFrom = Math.abs(startFrame)` frames into the clip)
- `endFrame: number` — computed as `startFrame + audioDurationInFrames` when created; trimmable via edge drag
- `crossfade: number` — 0 (original only) to 1 (music only)

**The old `offsetFrames` field from the original issue is replaced by `startFrame`.** A negative startFrame is semantically equivalent to a negative offset — it means the audio's playback starts partway into the clip.

**Asset entity gains a `durationMs` column** (nullable integer, milliseconds). When an audio file is uploaded, the server extracts duration via ffprobe and stores it. The client reads this to compute `endFrame` when creating an audio operation.

### Track Model

**Dedicated audio tracks** are distinguished by a `trackType` field on the Track type: `"default" | "audio"`. Audio tracks:
- Are auto-created when the first audio operation is added
- Are auto-removed when the last audio operation on them is deleted
- Accept only audio operations (moveOperation and addOperation validate this)
- Render with distinct visual styling (e.g., different background color, `Music2` icon in header)
- Are hidden entirely when the source media is an image

Each audio track holds at most one audio operation. To layer multiple audio clips, the user adds additional audio tracks.

### Timeline Visualization

**OperationBlock** gets a new entry in `typeConfig`: audio uses a distinct color (e.g., `bg-error/30 border-error`) and the `Music` icon from lucide-react. Block displays icon + asset filename.

**Negative startFrame handling**: When `startFrame < 0`, the block is visually clamped to x=0 on the timeline. A hatched or dimmed overlay region is drawn on the left portion of the block (from x=0 to `|startFrame| * pixelsPerFrame`) to indicate the trimmed audio portion. The block's full width still represents the total audio duration.

### Properties Panel

A new `AudioProperties` component follows the same pattern as `WatermarkProperties`:
- Asset picker dropdown (using `useAssetsQuery("audio")`) with play-preview buttons
- Crossfade slider (0–1 range, step 0.01) labeled "Original ↔ Music"
- Read-only offset display showing startFrame as MM:SS:FF timecode

### Audio Preview (Remotion Player)

A new `AudioTrack` composition component wraps Remotion's `<Audio>`:
- `src` = audio asset URL
- `startFrom` = `startFrame < 0 ? Math.abs(startFrame) : 0` (skip into audio when negative offset)
- `volume` = `crossfade * peakNormalizationGain`
- Original video volume is set to `1 - crossfade`

**Simple peak normalization** is applied client-side via the Web Audio API: decode the audio file, find peak amplitude, compute gain to normalize to -1dBFS. This gain value is applied to the Remotion `<Audio>` volume prop. This gets ~80% of the way to matching the final render without the complexity of full loudnorm.

### Render Pipeline

The server-side render function (`remotionRenderFn`) is extended to:
1. Detect audio operations in the flattened operations list
2. Resolve audio asset file URLs (same pattern as watermark asset resolution)
3. Pass audio operation data and URL to the Remotion composition's input props
4. The composition renders the `AudioTrack` component with the resolved URL

**FFmpeg loudnorm** is applied as a post-processing step: after Remotion renders the video (with approximate audio), FFmpeg re-encodes with the `loudnorm` filter applied independently to both the original and overlay audio streams, then mixes at the crossfade ratio.

### Store Changes

- `addAudio(assetId: string, durationMs: number)` convenience method added to editorStore
  - Creates an audio track if none exists
  - Creates an AudioOperation with `startFrame: 0`, `endFrame: Math.round(durationMs / 1000 * fps)`, `crossfade: 0.5`
  - Adds the operation to the audio track
- Track management is extended: `addTrack` can accept an optional `trackType` parameter
- `moveOperation` validates that audio ops can only be moved to audio tracks and vice versa
- `removeOperationById` checks if the containing track is an audio track that is now empty, and auto-removes it

### Toolbar

Audio button uses the `Music` icon from lucide-react. It opens a popover (same pattern as the watermark tool) showing audio assets from `useAssetsQuery("audio")`. Each asset shows a play/pause toggle and the asset name. Clicking an asset calls `addAudio(asset.id, asset.durationMs)`. The button is conditionally hidden when the source media type is "image".

## Testing Decisions

Good tests for this feature verify behavior through public interfaces — they should describe what the system does, not how. Tests should survive internal refactors.

### Modules to Test

**AudioOperation frame math** — Pure functions for computing audio block position with negative startFrame clamping and trim behavior. Same pattern as the existing `block-drag.vitest.ts` tests. Test: computeMove with negative results, trim respecting audio duration bounds, visual clamping for display.

**EditorStore audio track lifecycle** — Test via the store's public API (same pattern as `editorStore.vitest.ts`):
- `addAudio` creates an audio track and operation
- Adding a second audio creates a second audio track
- Removing the last audio op auto-removes the audio track
- `moveOperation` rejects moving non-audio ops to audio tracks
- Undo/redo preserves audio track state
- Hydration handles audio operations and audio tracks

**AudioProperties component** — Render test verifying the crossfade slider and asset picker appear when an audio op is selected. Same pattern as existing `Timeline.vitest.tsx` component tests.

**Server-side audio duration extraction** — Test that uploading an audio file extracts and stores `durationMs` on the Asset entity.

**flattenTracks with audio** — Extend existing `flatten-tracks.test.ts` to verify audio operations are included in flattened output.

### Prior Art
- `editorStore.vitest.ts` — store behavior tests (45+ tests)
- `block-drag.vitest.ts` — pure function frame math tests
- `Timeline.vitest.tsx` — component render tests
- `flatten-tracks.test.ts` — server utility tests

## Out of Scope

- **Waveform visualization** on the audio block (requires Web Audio API decoding or server-side waveform generation — deferred to a follow-up)
- **Full loudnorm in preview** (server-quality normalization in the browser is too complex; simple peak normalization is used instead)
- **Audio overlap/mixing between multiple audio tracks** (when tracks overlap in time, both play additively — no intelligent crossfading between audio tracks)
- **Audio effects** (EQ, reverb, pitch shift, etc.)
- **Audio-only export** (the render pipeline always produces video output)
- **Recording audio** (microphone input)

## Further Notes

- The `offsetFrames` field from the original issue design is fully replaced by `startFrame`/`endFrame`. This means the operation shape in the issue body should be considered superseded by the adapted design here.
- The blocked-by dependency on #261 (audio asset support) is already resolved — audio upload and querying works.
- The blocked-by dependency on #248 (editor route with timeline) is resolved by the NLE timeline work in issues #292–#297.
- The `durationMs` field on Asset is nullable for backward compatibility with existing image assets which don't have a duration.
