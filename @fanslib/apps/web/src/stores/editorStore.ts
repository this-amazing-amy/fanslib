import { create } from "zustand";
import type { Operation, Track } from "@fanslib/video/types";
import type { EasingType } from "@fanslib/video/keyframes";
import { type CropOperation, normalizeCropOperation } from "~/features/editor/utils/crop-operation";
import type { Segment } from "~/features/editor/utils/sequence-engine";

type Keyframe = { frame: number; values: Record<string, number>; easing?: EasingType };

export type ExportRegion = {
  id: string;
  startFrame: number;
  endFrame: number;
  package?: string | null;
  role?: string | null;
  contentRating?: string | null;
  quality?: string | null;
};

type EditorState = {
  tracks: Track[];
  segments: Segment[];
  selectedSegmentId: string | null;
  selectedTransitionSegmentId: string | null;
  operations: Operation[];
  selectedOperationIndex: number | null;
  selectedOperationId: string | null;
  /** When set, player shows full source and crop overlay for this operation index. */
  cropEditingOperationIndex: number | null;
  cropEditingOperationId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  sourceMediaId: string | null;
  editId: string | null;
  selectedSourceId: string | null;
  pendingSourceMarkIn: number | null;

  // Export region state
  exportRegions: ExportRegion[];
  exportRegionMode: boolean;
  selectedExportRegionId: string | null;
  pendingExportMarkIn: number | null;

  // Mutation actions (push to undo stack)
  addOperation: (op: Record<string, unknown> & { id?: string }) => void;
  removeOperation: (index: number) => void;
  updateOperation: (index: number, op: Operation) => void;
  reorderOperations: (fromIndex: number, toIndex: number) => void;

  // ID-based mutation actions
  removeOperationById: (id: string) => void;
  updateOperationById: (id: string, op: Record<string, unknown>) => void;
  addKeyframeById: (opId: string, keyframe: Keyframe) => void;
  removeKeyframeById: (opId: string, keyframeIndex: number) => void;
  updateKeyframeById: (opId: string, keyframeIndex: number, keyframe: Keyframe) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Keyframe mutations
  addKeyframe: (opIndex: number, keyframe: Keyframe) => void;
  removeKeyframe: (opIndex: number, keyframeIndex: number) => void;
  updateKeyframe: (opIndex: number, keyframeIndex: number, keyframe: Keyframe) => void;

  // Crop convenience
  addCrop: () => void;
  applyCrop: (index: number) => void;
  setCropEditingOperationIndex: (index: number | null) => void;
  setCropEditingOperationId: (id: string | null) => void;

  // Caption convenience
  addCaption: () => void;

  // Blur convenience
  addBlur: () => void;

  // Emoji convenience
  addEmoji: (emoji?: string) => void;

  // Pixelate convenience
  addPixelate: () => void;

  // Zoom convenience
  addZoom: () => void;

  // Selection
  setSelectedOperationIndex: (index: number | null) => void;
  setSelectedOperationId: (id: string | null) => void;

  // Watermark convenience
  addWatermark: (assetId: string) => void;

  // Export region mutations
  toggleExportRegionMode: () => void;
  setExportMarkIn: (frame: number) => void;
  commitExportMarkOut: (frame: number) => void;
  addExportRegion: (region: Omit<ExportRegion, "id">) => void;
  removeExportRegion: (id: string) => void;
  updateExportRegion: (id: string, updates: Partial<ExportRegion>) => void;
  selectExportRegion: (id: string | null) => void;

  // Segment mutations
  addSegment: (segment: Omit<Segment, "id">) => void;
  removeSegment: (segmentId: string) => void;
  reorderSegments: (segmentId: string, newIndex: number) => void;
  trimSegmentStart: (segmentId: string, newSourceStartFrame: number) => void;
  trimSegmentEnd: (segmentId: string, newSourceEndFrame: number) => void;
  selectSegment: (segmentId: string | null) => void;
  selectTransition: (segmentId: string | null) => void;

  // Transition mutations
  addTransition: (segmentId: string, transition: { type: "crossfade"; durationFrames: number; easing?: string }) => void;
  removeTransition: (segmentId: string) => void;
  updateTransition: (segmentId: string, updates: { durationFrames?: number; easing?: string }) => void;

  // Track management
  addTrack: () => void;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, name: string) => void;
  moveOperation: (opId: string, targetTrackId: string) => void;

  // Derived
  flattenOperations: () => Operation[];

  // Source bin
  selectSource: (id: string | null) => void;
  setSourceMarkIn: (frame: number) => void;
  clearSourceMarkIn: () => void;
  commitSourceSegment: (markOutFrame: number) => void;

  // Metadata
  setSourceMediaId: (id: string) => void;
  setEditId: (id: string | null) => void;
  markClean: () => void;

  // Hydrate from existing MediaEdit (accepts JSON data from API or typed data)
  hydrate: (data: unknown[] | { tracks: unknown[]; segments?: Segment[]; exportRegions?: ExportRegion[] }) => void;
  // Restore tracks (and optionally segments) from unified history snapshot (does not touch per-store undo stacks)
  restoreTracks: (tracks: unknown[], segments?: Segment[]) => void;

  // Reset
  reset: () => void;
};

type HistoryEntry = { tracks: Track[]; segments: Segment[]; exportRegions: ExportRegion[] };

const makeDefaultTrack = (): Track => ({
  id: crypto.randomUUID(),
  name: "Track 1",
  operations: [],
});

/** Flatten all operations from all tracks into a single ordered array */
const flattenTracks = (tracks: Track[]): Operation[] => tracks.flatMap((t) => t.operations);

/**
 * Map a function over operations across all tracks, returning new tracks.
 * Useful for keyframe mutations and operation updates by index or id.
 */
const mapOperationsAcrossTracks = (
  tracks: Track[],
  fn: (op: Operation, flatIndex: number) => Operation,
): Track[] => {
  // eslint-disable-next-line functional/no-let
  let flatIdx = 0;
  return tracks.map((t) => ({
    ...t,
    operations: t.operations.map((op) => {
      const result = fn(op, flatIdx);
      flatIdx++;
      return result;
    }),
  }));
};

export const useEditorStore = create<EditorState>((set, get) => {
  // eslint-disable-next-line functional/no-let
  let undoStack: HistoryEntry[] = [];
  // eslint-disable-next-line functional/no-let
  let redoStack: HistoryEntry[] = [];

  const cloneTracks = (tracks: Track[]): Track[] =>
    tracks.map((t) => ({ ...t, operations: [...t.operations] }));

  /** Find a track where op doesn't overlap existing operations, or create a new one. */
  const findOrCreateNonOverlappingTrack = (
    tracks: Track[],
    startFrame: number,
    endFrame: number,
  ): number => {
    const idx = tracks.findIndex((track) => {
      const hasOverlap = track.operations.some((op) => {
        const sf = "startFrame" in op ? op.startFrame : undefined;
        const ef = "endFrame" in op ? op.endFrame : undefined;
        if (sf == null || ef == null) return false;
        return startFrame < ef && endFrame > sf;
      });
      return !hasOverlap;
    });
    if (idx !== -1) return idx;
    // All tracks overlap – create a new one
    tracks.push({
      id: crypto.randomUUID(),
      name: `Track ${tracks.length + 1}`,
      operations: [],
    });
    return tracks.length - 1;
  };

  const cloneSegments = (segments: Segment[]): Segment[] =>
    segments.map((s) => ({ ...s, transition: s.transition ? { ...s.transition } : undefined }));

  const cloneExportRegions = (regions: ExportRegion[]): ExportRegion[] =>
    regions.map((r) => ({ ...r }));

  const pushHistory = () => {
    const state = get();
    undoStack.push({
      tracks: cloneTracks(state.tracks),
      segments: cloneSegments(state.segments),
      exportRegions: cloneExportRegions(state.exportRegions),
    });
    redoStack = []; // Clear redo on new mutation
  };

  const updateUndoRedoFlags = () => ({
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    isDirty: true,
  });

  const initialTrack = makeDefaultTrack();

  return {
    tracks: [initialTrack],
    segments: [],
    selectedSegmentId: null,
    selectedTransitionSegmentId: null,
    operations: [],
    selectedOperationIndex: null,
    selectedOperationId: null,
    cropEditingOperationIndex: null,
    cropEditingOperationId: null,
    canUndo: false,
    isDirty: false,
    sourceMediaId: null,
    editId: null,
    selectedSourceId: null,
    pendingSourceMarkIn: null,
    canRedo: false,
    exportRegions: [],
    exportRegionMode: false,
    selectedExportRegionId: null,
    pendingExportMarkIn: null,

    addOperation: (op) => {
      pushHistory();
      const stamped = { ...op, id: op.id ?? crypto.randomUUID() } as unknown as Operation;
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        tracks[0].operations.push(stamped);
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    removeOperation: (index) => {
      pushHistory();
      set((state) => {
        const sel = state.selectedOperationIndex;
        const nextSel = sel === null ? null : sel === index ? null : sel > index ? sel - 1 : sel;
        const ce = state.cropEditingOperationIndex;
        const nextCe = ce === null ? null : ce === index ? null : ce > index ? ce - 1 : ce;
        // Remove by flat index: find which track owns the index and splice it
        const tracks = state.tracks.reduce<{ result: Track[]; offset: number; removed: boolean }>(
          (acc, t) => {
            if (!acc.removed && index < acc.offset + t.operations.length) {
              acc.result.push({
                ...t,
                operations: t.operations.filter((_, i) => i !== index - acc.offset),
              });
              acc.removed = true;
            } else {
              acc.result.push({ ...t, operations: [...t.operations] });
            }
            acc.offset += t.operations.length;
            return acc;
          },
          { result: [], offset: 0, removed: false },
        ).result;
        return {
          tracks,
          operations: flattenTracks(tracks),
          selectedOperationIndex: nextSel,
          cropEditingOperationIndex: nextCe,
          ...updateUndoRedoFlags(),
        };
      });
    },

    updateOperation: (index, op) => {
      pushHistory();
      set((state) => {
        const tracks = mapOperationsAcrossTracks(state.tracks, (existing, flatIdx) =>
          flatIdx === index ? op : existing,
        );
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    reorderOperations: (fromIndex, toIndex) => {
      pushHistory();
      set((state) => {
        const ops = flattenTracks(state.tracks);
        const flat = [...ops];
        const [moved] = flat.splice(fromIndex, 1);
        flat.splice(toIndex, 0, moved);
        // Redistribute reordered ops back into tracks preserving per-track counts
        const tracks = state.tracks.reduce<{ result: Track[]; offset: number }>(
          (acc, t) => {
            acc.result.push({
              ...t,
              operations: flat.slice(acc.offset, acc.offset + t.operations.length),
            });
            acc.offset += t.operations.length;
            return acc;
          },
          { result: [], offset: 0 },
        ).result;
        return { tracks, operations: flat, ...updateUndoRedoFlags() };
      });
    },

    removeOperationById: (id) => {
      pushHistory();
      set((state) => {
        const nextSelId = state.selectedOperationId === id ? null : state.selectedOperationId;
        const nextCeId = state.cropEditingOperationId === id ? null : state.cropEditingOperationId;
        const tracks = state.tracks.map((t) => ({
          ...t,
          operations: t.operations.filter((op) => op.id !== id),
        }));
        return {
          tracks,
          operations: flattenTracks(tracks),
          selectedOperationId: nextSelId,
          cropEditingOperationId: nextCeId,
          ...updateUndoRedoFlags(),
        };
      });
    },

    updateOperationById: (id, patch) => {
      pushHistory();
      set((state) => {
        const tracks = state.tracks.map((t) => ({
          ...t,
          operations: t.operations.map((op) =>
            op.id === id ? ({ ...patch, id } as unknown as Operation) : op,
          ),
        }));
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    addKeyframeById: (opId, keyframe) => {
      pushHistory();
      set((state) => {
        const tracks = state.tracks.map((t) => ({
          ...t,
          operations: t.operations.map((op) => {
            if (op.id !== opId) return op;
            if (!("keyframes" in op)) return op;
            return { ...op, keyframes: [...op.keyframes, keyframe] };
          }),
        }));
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    removeKeyframeById: (opId, keyframeIndex) => {
      pushHistory();
      set((state) => {
        const tracks = state.tracks.map((t) => ({
          ...t,
          operations: t.operations.map((op) => {
            if (op.id !== opId) return op;
            if (!("keyframes" in op)) return op;
            return {
              ...op,
              keyframes: op.keyframes.filter((_, ki) => ki !== keyframeIndex),
            };
          }),
        }));
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    updateKeyframeById: (opId, keyframeIndex, keyframe) => {
      pushHistory();
      set((state) => {
        const tracks = state.tracks.map((t) => ({
          ...t,
          operations: t.operations.map((op) => {
            if (op.id !== opId) return op;
            if (!("keyframes" in op)) return op;
            return {
              ...op,
              keyframes: op.keyframes.map((kf, ki) =>
                ki === keyframeIndex ? keyframe : kf,
              ),
            };
          }),
        }));
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    undo: () => {
      const previous = undoStack.pop();
      if (previous === undefined) return;
      const state = get();
      redoStack.push({
        tracks: cloneTracks(state.tracks),
        segments: cloneSegments(state.segments),
        exportRegions: cloneExportRegions(state.exportRegions),
      });
      set({
        tracks: previous.tracks,
        segments: previous.segments,
        exportRegions: previous.exportRegions,
        operations: flattenTracks(previous.tracks),
        canUndo: undoStack.length > 0,
        canRedo: true,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
      });
    },

    redo: () => {
      const next = redoStack.pop();
      if (next === undefined) return;
      const state = get();
      undoStack.push({
        tracks: cloneTracks(state.tracks),
        segments: cloneSegments(state.segments),
        exportRegions: cloneExportRegions(state.exportRegions),
      });
      set({
        tracks: next.tracks,
        segments: next.segments,
        exportRegions: next.exportRegions,
        operations: flattenTracks(next.tracks),
        canUndo: true,
        canRedo: redoStack.length > 0,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
      });
    },

    addCrop: () => {
      const id = crypto.randomUUID();
      const op: CropOperation & { id: string } = {
        type: "crop",
        id,
        x: 0.05,
        y: 0.05,
        width: 0.9,
        height: 0.9,
        applied: false,
        aspectPreset: "free",
      };
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        tracks[0].operations.push(op);
        return {
          tracks,
          operations: flattenTracks(tracks),
          selectedOperationIndex: flattenTracks(tracks).length - 1,
          selectedOperationId: id,
          cropEditingOperationIndex: flattenTracks(tracks).length - 1,
          cropEditingOperationId: id,
          ...updateUndoRedoFlags(),
        };
      });
    },

    applyCrop: (index) => {
      const state = get();
      const ops = flattenTracks(state.tracks);
      const raw = ops[index];
      if (!raw || raw.type !== "crop") return;
      const c = raw;
      pushHistory();
      set((prev) => {
        const tracks = mapOperationsAcrossTracks(prev.tracks, (o, flatIdx) =>
          flatIdx === index ? { ...c, applied: true } : o,
        );
        return {
          tracks,
          operations: flattenTracks(tracks),
          cropEditingOperationIndex: null,
          cropEditingOperationId: null,
          ...updateUndoRedoFlags(),
        };
      });
    },

    setCropEditingOperationIndex: (index) => {
      set({
        cropEditingOperationIndex: index,
        selectedOperationIndex: index,
      });
    },

    setCropEditingOperationId: (id) => {
      set({
        cropEditingOperationId: id,
        selectedOperationId: id,
      });
    },

    addCaption: () => {
      const id = crypto.randomUUID();
      const op = {
        type: "caption" as const,
        id,
        text: "Caption",
        x: 0.5,
        y: 0.8,
        fontSize: 0.05,
        color: "#ffffff",
        animation: "fade-in" as const,
        startFrame: 0,
        endFrame: 90,
      };
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        tracks[0].operations.push(op);
        const flat = flattenTracks(tracks);
        return {
          tracks,
          operations: flat,
          selectedOperationIndex: flat.length - 1,
          selectedOperationId: id,
          ...updateUndoRedoFlags(),
        };
      });
    },

    addWatermark: (assetId) => {
      const id = crypto.randomUUID();
      const op = {
        type: "watermark" as const,
        id,
        assetId,
        x: 0.5,
        y: 0.5,
        width: 0.1,
        opacity: 0.7,
        startFrame: 0,
        endFrame: 90,
      };
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        const trackIdx = findOrCreateNonOverlappingTrack(tracks, op.startFrame, op.endFrame);
        tracks[trackIdx].operations.push(op);
        const flat = flattenTracks(tracks);
        return {
          tracks,
          operations: flat,
          selectedOperationIndex: flat.length - 1,
          selectedOperationId: id,
          ...updateUndoRedoFlags(),
        };
      });
    },

    addBlur: () => {
      const id = crypto.randomUUID();
      const op = {
        type: "blur" as const,
        id,
        x: 0.4,
        y: 0.4,
        width: 0.15,
        height: 0.15,
        radius: 20,
        startFrame: 0,
        endFrame: 90,
        keyframes: [],
      };
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        const trackIdx = findOrCreateNonOverlappingTrack(tracks, op.startFrame, op.endFrame);
        tracks[trackIdx].operations.push(op);
        const flat = flattenTracks(tracks);
        return {
          tracks,
          operations: flat,
          selectedOperationIndex: flat.length - 1,
          selectedOperationId: id,
          ...updateUndoRedoFlags(),
        };
      });
    },

    addEmoji: (emoji = "⭐") => {
      const id = crypto.randomUUID();
      const op = {
        type: "emoji" as const,
        id,
        emoji,
        x: 0.5,
        y: 0.5,
        size: 0.08,
        startFrame: 0,
        endFrame: 90,
        keyframes: [],
      };
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        const trackIdx = findOrCreateNonOverlappingTrack(tracks, op.startFrame, op.endFrame);
        tracks[trackIdx].operations.push(op);
        const flat = flattenTracks(tracks);
        return {
          tracks,
          operations: flat,
          selectedOperationIndex: flat.length - 1,
          selectedOperationId: id,
          ...updateUndoRedoFlags(),
        };
      });
    },

    addPixelate: () => {
      const id = crypto.randomUUID();
      const op = {
        type: "pixelate" as const,
        id,
        x: 0.4,
        y: 0.4,
        width: 0.15,
        height: 0.15,
        pixelSize: 10,
        startFrame: 0,
        endFrame: 90,
        keyframes: [],
      };
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        const trackIdx = findOrCreateNonOverlappingTrack(tracks, op.startFrame, op.endFrame);
        tracks[trackIdx].operations.push(op);
        const flat = flattenTracks(tracks);
        return {
          tracks,
          operations: flat,
          selectedOperationIndex: flat.length - 1,
          selectedOperationId: id,
          ...updateUndoRedoFlags(),
        };
      });
    },

    addZoom: () => {
      const id = crypto.randomUUID();
      const op = {
        type: "zoom" as const,
        id,
        scale: 1.0,
        centerX: 0.5,
        centerY: 0.5,
        keyframes: [],
      };
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        tracks[0].operations.push(op);
        const flat = flattenTracks(tracks);
        return {
          tracks,
          operations: flat,
          selectedOperationIndex: flat.length - 1,
          selectedOperationId: id,
          ...updateUndoRedoFlags(),
        };
      });
    },

    addKeyframe: (opIndex, keyframe) => {
      pushHistory();
      set((state) => {
        const tracks = mapOperationsAcrossTracks(state.tracks, (op, flatIdx) => {
          if (flatIdx !== opIndex) return op;
          if (!("keyframes" in op)) return op;
          return { ...op, keyframes: [...op.keyframes, keyframe] };
        });
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    removeKeyframe: (opIndex, keyframeIndex) => {
      pushHistory();
      set((state) => {
        const tracks = mapOperationsAcrossTracks(state.tracks, (op, flatIdx) => {
          if (flatIdx !== opIndex) return op;
          if (!("keyframes" in op)) return op;
          return {
            ...op,
            keyframes: op.keyframes.filter((_, ki) => ki !== keyframeIndex),
          };
        });
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    updateKeyframe: (opIndex, keyframeIndex, keyframe) => {
      pushHistory();
      set((state) => {
        const tracks = mapOperationsAcrossTracks(state.tracks, (op, flatIdx) => {
          if (flatIdx !== opIndex) return op;
          if (!("keyframes" in op)) return op;
          return {
            ...op,
            keyframes: op.keyframes.map((kf, ki) =>
              ki === keyframeIndex ? keyframe : kf,
            ),
          };
        });
        return {
          tracks,
          operations: flattenTracks(tracks),
          ...updateUndoRedoFlags(),
        };
      });
    },

    setSelectedOperationIndex: (index) => {
      set({ selectedOperationIndex: index });
    },

    setSelectedOperationId: (id) => {
      set({ selectedOperationId: id });
    },

    toggleExportRegionMode: () => {
      set((state) => ({ exportRegionMode: !state.exportRegionMode }));
    },

    setExportMarkIn: (frame) => {
      set({ pendingExportMarkIn: frame });
    },

    commitExportMarkOut: (frame) => {
      const state = get();
      const markIn = state.pendingExportMarkIn;
      if (markIn === null) return;
      const startFrame = Math.min(markIn, frame);
      const endFrame = Math.max(markIn, frame);
      pushHistory();
      set((prev) => ({
        exportRegions: [
          ...prev.exportRegions,
          { id: crypto.randomUUID(), startFrame, endFrame },
        ],
        pendingExportMarkIn: null,
        ...updateUndoRedoFlags(),
      }));
    },

    addExportRegion: (region) => {
      pushHistory();
      set((state) => ({
        exportRegions: [
          ...state.exportRegions,
          { ...region, id: crypto.randomUUID() },
        ],
        ...updateUndoRedoFlags(),
      }));
    },

    removeExportRegion: (id) => {
      pushHistory();
      set((state) => ({
        exportRegions: state.exportRegions.filter((r) => r.id !== id),
        ...updateUndoRedoFlags(),
      }));
    },

    updateExportRegion: (id, updates) => {
      pushHistory();
      set((state) => ({
        exportRegions: state.exportRegions.map((r) =>
          r.id === id ? { ...r, ...updates, id } : r,
        ),
        ...updateUndoRedoFlags(),
      }));
    },

    selectExportRegion: (id) => {
      set({ selectedExportRegionId: id });
    },

    addSegment: (segment) => {
      pushHistory();
      set((state) => ({
        segments: [...state.segments, { ...segment, id: crypto.randomUUID() }],
        ...updateUndoRedoFlags(),
      }));
    },

    removeSegment: (segmentId) => {
      pushHistory();
      set((state) => ({
        segments: state.segments.filter((s) => s.id !== segmentId),
        ...updateUndoRedoFlags(),
      }));
    },

    reorderSegments: (segmentId, newIndex) => {
      pushHistory();
      set((state) => {
        const segments = [...state.segments];
        const fromIndex = segments.findIndex((s) => s.id === segmentId);
        if (fromIndex === -1) return { ...updateUndoRedoFlags() };
        const [moved] = segments.splice(fromIndex, 1);
        // Drop transition if moved to index 0
        const placed = newIndex === 0 ? { ...moved, transition: undefined } : moved;
        segments.splice(newIndex, 0, placed);
        return { segments, ...updateUndoRedoFlags() };
      });
    },

    trimSegmentStart: (segmentId, newSourceStartFrame) => {
      pushHistory();
      set((state) => ({
        segments: state.segments.map((s) =>
          s.id === segmentId ? { ...s, sourceStartFrame: newSourceStartFrame } : s,
        ),
        ...updateUndoRedoFlags(),
      }));
    },

    trimSegmentEnd: (segmentId, newSourceEndFrame) => {
      pushHistory();
      set((state) => ({
        segments: state.segments.map((s) =>
          s.id === segmentId ? { ...s, sourceEndFrame: newSourceEndFrame } : s,
        ),
        ...updateUndoRedoFlags(),
      }));
    },

    addTransition: (segmentId, transition) => {
      const state = get();
      const segIndex = state.segments.findIndex((s) => s.id === segmentId);
      // No-op if segment not found or is the first segment
      if (segIndex <= 0) return;
      pushHistory();
      set((prev) => ({
        segments: prev.segments.map((s) =>
          s.id === segmentId ? { ...s, transition } : s,
        ),
        ...updateUndoRedoFlags(),
      }));
    },

    removeTransition: (segmentId) => {
      pushHistory();
      set((prev) => ({
        segments: prev.segments.map((s) =>
          s.id === segmentId ? { ...s, transition: undefined } : s,
        ),
        ...updateUndoRedoFlags(),
      }));
    },

    updateTransition: (segmentId, updates) => {
      pushHistory();
      set((prev) => ({
        segments: prev.segments.map((s) => {
          if (s.id !== segmentId || !s.transition) return s;
          return { ...s, transition: { ...s.transition, ...updates } };
        }),
        ...updateUndoRedoFlags(),
      }));
    },

    selectSegment: (segmentId) => {
      set({ selectedSegmentId: segmentId, selectedTransitionSegmentId: null });
    },

    selectTransition: (segmentId) => {
      set({ selectedTransitionSegmentId: segmentId, selectedSegmentId: null });
    },

    addTrack: () => {
      pushHistory();
      set((state) => {
        const tracks = cloneTracks(state.tracks);
        tracks.push({
          id: crypto.randomUUID(),
          name: `Track ${tracks.length + 1}`,
          operations: [],
        });
        return { tracks, ...updateUndoRedoFlags() };
      });
    },

    removeTrack: (trackId) => {
      pushHistory();
      set((state) => {
        const tracks = state.tracks.filter((t) => t.id !== trackId);
        return { tracks, operations: flattenTracks(tracks), ...updateUndoRedoFlags() };
      });
    },

    renameTrack: (trackId, name) => {
      pushHistory();
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, name } : t)),
        ...updateUndoRedoFlags(),
      }));
    },

    moveOperation: (opId, targetTrackId) => {
      pushHistory();
      set((state) => {
        // Find the operation to move
        const movedOp = flattenTracks(state.tracks).find((op) => op.id === opId);
        if (!movedOp) return { ...updateUndoRedoFlags() };
        // Remove from source, add to target
        const tracks = state.tracks.map((t) => {
          const filtered = t.operations.filter((op) => op.id !== opId);
          const ops = t.id === targetTrackId ? [...filtered, movedOp] : filtered;
          return { ...t, operations: ops };
        });
        return { tracks, operations: flattenTracks(tracks), ...updateUndoRedoFlags() };
      });
    },

    flattenOperations: () => flattenTracks(get().tracks),

    selectSource: (id) => {
      set({ selectedSourceId: id, pendingSourceMarkIn: null });
    },

    setSourceMarkIn: (frame) => {
      set({ pendingSourceMarkIn: frame });
    },

    clearSourceMarkIn: () => {
      set({ pendingSourceMarkIn: null });
    },

    commitSourceSegment: (markOutFrame) => {
      const state = get();
      if (state.selectedSourceId === null) return;
      if (state.pendingSourceMarkIn === null) return;
      const markIn = state.pendingSourceMarkIn;
      const sourceStartFrame = Math.min(markIn, markOutFrame);
      const sourceEndFrame = Math.max(markIn, markOutFrame);
      get().addSegment({
        sourceMediaId: state.selectedSourceId,
        sourceStartFrame,
        sourceEndFrame,
      });
      set({ pendingSourceMarkIn: null });
    },

    setSourceMediaId: (id) => {
      set({ sourceMediaId: id });
    },

    setEditId: (id) => {
      set({ editId: id });
    },

    markClean: () => {
      set({ isDirty: false });
    },

    hydrate: (data) => {
      undoStack = [];
      redoStack = [];

      // Detect format: array = legacy flat operations, object with tracks = new format
      const isLegacy = Array.isArray(data);
      const tracks: Track[] = isLegacy
        ? [
            {
              id: crypto.randomUUID(),
              name: "Track 1",
              operations: data.map((op) => {
                const normalized = normalizeCropOperation(op);
                const obj = normalized as Record<string, unknown>;
                if (!obj.id) obj.id = crypto.randomUUID();
                if (obj.startFrame === undefined && obj.type !== "clip") obj.startFrame = 0;
                return normalized as unknown as Operation;
              }),
            },
          ]
        : (data as { tracks: Track[] }).tracks;

      const segments: Segment[] = isLegacy
        ? []
        : (data as { segments?: Segment[] }).segments ?? [];

      const exportRegions: ExportRegion[] = isLegacy
        ? []
        : (data as { exportRegions?: ExportRegion[] }).exportRegions ?? [];

      set({
        tracks,
        segments,
        exportRegions,
        operations: flattenTracks(tracks),
        selectedOperationIndex: null,
        selectedOperationId: null,
        selectedSegmentId: null,
    selectedTransitionSegmentId: null,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
        exportRegionMode: false,
        pendingExportMarkIn: null,
        canUndo: false,
        canRedo: false,
        isDirty: false,
      });
    },

    restoreTracks: (rawTracks, segments) => {
      const tracks = rawTracks as Track[];
      set({
        tracks,
        operations: flattenTracks(tracks),
        ...(segments !== undefined ? { segments } : {}),
      });
    },

    reset: () => {
      undoStack = [];
      redoStack = [];
      set({
        tracks: [makeDefaultTrack()],
        segments: [],
        selectedSegmentId: null,
    selectedTransitionSegmentId: null,
        operations: [],
        selectedOperationIndex: null,
        selectedOperationId: null,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
        exportRegions: [],
        exportRegionMode: false,
        selectedExportRegionId: null,
        pendingExportMarkIn: null,
        canUndo: false,
        canRedo: false,
        isDirty: false,
        sourceMediaId: null,
        editId: null,
        selectedSourceId: null,
        pendingSourceMarkIn: null,
      });
    },
  };
});
