import { create } from "zustand";
import { type CropOperation, normalizeCropOperation } from "~/features/editor/utils/crop-operation";

type Track = {
  id: string;
  name: string;
  operations: unknown[];
};

type EditorState = {
  tracks: Track[];
  operations: unknown[];
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

  // Mutation actions (push to undo stack)
  addOperation: (op: unknown) => void;
  removeOperation: (index: number) => void;
  updateOperation: (index: number, op: unknown) => void;
  reorderOperations: (fromIndex: number, toIndex: number) => void;

  // ID-based mutation actions
  removeOperationById: (id: string) => void;
  updateOperationById: (id: string, op: unknown) => void;
  addKeyframeById: (opId: string, keyframe: unknown) => void;
  removeKeyframeById: (opId: string, keyframeIndex: number) => void;
  updateKeyframeById: (opId: string, keyframeIndex: number, keyframe: unknown) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Keyframe mutations
  addKeyframe: (opIndex: number, keyframe: unknown) => void;
  removeKeyframe: (opIndex: number, keyframeIndex: number) => void;
  updateKeyframe: (opIndex: number, keyframeIndex: number, keyframe: unknown) => void;

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

  // Track management
  addTrack: () => void;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, name: string) => void;
  moveOperation: (opId: string, targetTrackId: string) => void;

  // Derived
  flattenOperations: () => unknown[];

  // Metadata
  setSourceMediaId: (id: string) => void;
  setEditId: (id: string | null) => void;
  markClean: () => void;

  // Hydrate from existing MediaEdit
  hydrate: (data: unknown[] | { tracks: Track[] }) => void;

  // Reset
  reset: () => void;
};

type HistoryEntry = Track[];

const makeDefaultTrack = (): Track => ({
  id: crypto.randomUUID(),
  name: "Track 1",
  operations: [],
});

/** Flatten all operations from all tracks into a single ordered array */
const flattenTracks = (tracks: Track[]): unknown[] =>
  tracks.flatMap((t) => t.operations);

/**
 * Map a function over operations across all tracks, returning new tracks.
 * Useful for keyframe mutations and operation updates by index or id.
 */
const mapOperationsAcrossTracks = (
  tracks: Track[],
  fn: (op: unknown, flatIndex: number) => unknown,
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
    for (let i = 0; i < tracks.length; i++) {
      const hasOverlap = tracks[i].operations.some((op) => {
        const existing = op as { startFrame?: number; endFrame?: number };
        if (existing.startFrame == null || existing.endFrame == null) return false;
        return startFrame < existing.endFrame && endFrame > existing.startFrame;
      });
      if (!hasOverlap) return i;
    }
    // All tracks overlap – create a new one
    tracks.push({
      id: crypto.randomUUID(),
      name: `Track ${tracks.length + 1}`,
      operations: [],
    });
    return tracks.length - 1;
  };

  const pushHistory = () => {
    undoStack.push(cloneTracks(get().tracks));
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
    operations: [],
    selectedOperationIndex: null,
    selectedOperationId: null,
    cropEditingOperationIndex: null,
    cropEditingOperationId: null,
    canUndo: false,
    isDirty: false,
    sourceMediaId: null,
    editId: null,
    canRedo: false,

    addOperation: (op) => {
      pushHistory();
      const stamped = { ...(op as object), id: crypto.randomUUID() };
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
              acc.result.push({ ...t, operations: t.operations.filter((_, i) => i !== index - acc.offset) });
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
            acc.result.push({ ...t, operations: flat.slice(acc.offset, acc.offset + t.operations.length) });
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
          operations: t.operations.filter((op) => (op as { id?: string }).id !== id),
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
            (op as { id?: string }).id === id ? { ...(patch as object), id } : op,
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
            if ((op as { id?: string }).id !== opId) return op;
            const opObj = op as { keyframes?: unknown[] };
            return { ...opObj, keyframes: [...(opObj.keyframes ?? []), keyframe] };
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
            if ((op as { id?: string }).id !== opId) return op;
            const opObj = op as { keyframes?: unknown[] };
            return {
              ...opObj,
              keyframes: (opObj.keyframes ?? []).filter((_, ki) => ki !== keyframeIndex),
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
            if ((op as { id?: string }).id !== opId) return op;
            const opObj = op as { keyframes?: unknown[] };
            return {
              ...opObj,
              keyframes: (opObj.keyframes ?? []).map((kf, ki) =>
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
      redoStack.push(cloneTracks(get().tracks));
      set({
        tracks: previous,
        operations: flattenTracks(previous),
        canUndo: undoStack.length > 0,
        canRedo: true,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
      });
    },

    redo: () => {
      const next = redoStack.pop();
      if (next === undefined) return;
      undoStack.push(cloneTracks(get().tracks));
      set({
        tracks: next,
        operations: flattenTracks(next),
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
      if (!raw || (raw as { type?: string }).type !== "crop") return;
      const c = raw as CropOperation;
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
          const opObj = op as { keyframes?: unknown[] };
          return { ...opObj, keyframes: [...(opObj.keyframes ?? []), keyframe] };
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
          const opObj = op as { keyframes?: unknown[] };
          return {
            ...opObj,
            keyframes: (opObj.keyframes ?? []).filter((_, ki) => ki !== keyframeIndex),
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
          const opObj = op as { keyframes?: unknown[] };
          return {
            ...opObj,
            keyframes: (opObj.keyframes ?? []).map((kf, ki) =>
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
        const movedOp = flattenTracks(state.tracks).find(
          (op) => (op as { id?: string }).id === opId,
        );
        if (!movedOp) return { ...updateUndoRedoFlags() };
        // Remove from source, add to target
        const tracks = state.tracks.map((t) => {
          const filtered = t.operations.filter((op) => (op as { id?: string }).id !== opId);
          const ops = t.id === targetTrackId ? [...filtered, movedOp] : filtered;
          return { ...t, operations: ops };
        });
        return { tracks, operations: flattenTracks(tracks), ...updateUndoRedoFlags() };
      });
    },

    flattenOperations: () => flattenTracks(get().tracks),

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
      const tracks: Track[] = Array.isArray(data)
        ? [{
            id: crypto.randomUUID(),
            name: "Track 1",
            operations: data.map((op) => {
              const normalized = normalizeCropOperation(op);
              const obj = normalized as Record<string, unknown>;
              if (!obj.id) obj.id = crypto.randomUUID();
              if (obj.startFrame === undefined && obj.type !== "clip") obj.startFrame = 0;
              return normalized;
            }),
          }]
        : (data as { tracks: Track[] }).tracks;

      set({
        tracks,
        operations: flattenTracks(tracks),
        selectedOperationIndex: null,
        selectedOperationId: null,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
        canUndo: false,
        canRedo: false,
        isDirty: false,
      });
    },

    reset: () => {
      undoStack = [];
      redoStack = [];
      set({
        tracks: [makeDefaultTrack()],
        operations: [],
        selectedOperationIndex: null,
        selectedOperationId: null,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
        canUndo: false,
        canRedo: false,
        isDirty: false,
        sourceMediaId: null,
        editId: null,
      });
    },
  };
});
