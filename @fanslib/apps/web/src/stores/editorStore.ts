import { create } from "zustand";
import { type CropOperation, normalizeCropOperation } from "~/features/editor/utils/crop-operation";

type EditorState = {
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

  // Metadata
  setSourceMediaId: (id: string) => void;
  setEditId: (id: string | null) => void;
  markClean: () => void;

  // Hydrate from existing MediaEdit
  hydrate: (operations: unknown[]) => void;

  // Reset
  reset: () => void;
};

type HistoryEntry = unknown[];

export const useEditorStore = create<EditorState>((set, get) => {
  // eslint-disable-next-line functional/no-let
  let undoStack: HistoryEntry[] = [];
  // eslint-disable-next-line functional/no-let
  let redoStack: HistoryEntry[] = [];

  const pushHistory = () => {
    undoStack.push([...get().operations]);
    redoStack = []; // Clear redo on new mutation
  };

  const updateUndoRedoFlags = () => ({
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    isDirty: true,
  });

  return {
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
      set((state) => ({
        operations: [...state.operations, stamped],
        ...updateUndoRedoFlags(),
      }));
    },

    removeOperation: (index) => {
      pushHistory();
      set((state) => {
        const sel = state.selectedOperationIndex;
        const nextSel = sel === null ? null : sel === index ? null : sel > index ? sel - 1 : sel;
        const ce = state.cropEditingOperationIndex;
        const nextCe = ce === null ? null : ce === index ? null : ce > index ? ce - 1 : ce;
        return {
          operations: state.operations.filter((_, i) => i !== index),
          selectedOperationIndex: nextSel,
          cropEditingOperationIndex: nextCe,
          ...updateUndoRedoFlags(),
        };
      });
    },

    updateOperation: (index, op) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((existing, i) => (i === index ? op : existing)),
        ...updateUndoRedoFlags(),
      }));
    },

    reorderOperations: (fromIndex, toIndex) => {
      pushHistory();
      set((state) => {
        const ops = [...state.operations];
        const [moved] = ops.splice(fromIndex, 1);
        ops.splice(toIndex, 0, moved);
        return { operations: ops, ...updateUndoRedoFlags() };
      });
    },

    removeOperationById: (id) => {
      pushHistory();
      set((state) => {
        const nextSelId = state.selectedOperationId === id ? null : state.selectedOperationId;
        const nextCeId = state.cropEditingOperationId === id ? null : state.cropEditingOperationId;
        return {
          operations: state.operations.filter((op) => (op as { id?: string }).id !== id),
          selectedOperationId: nextSelId,
          cropEditingOperationId: nextCeId,
          ...updateUndoRedoFlags(),
        };
      });
    },

    updateOperationById: (id, patch) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((op) =>
          (op as { id?: string }).id === id ? { ...(patch as object), id } : op,
        ),
        ...updateUndoRedoFlags(),
      }));
    },

    addKeyframeById: (opId, keyframe) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((op) => {
          if ((op as { id?: string }).id !== opId) return op;
          const opObj = op as { keyframes?: unknown[] };
          return { ...opObj, keyframes: [...(opObj.keyframes ?? []), keyframe] };
        }),
        ...updateUndoRedoFlags(),
      }));
    },

    removeKeyframeById: (opId, keyframeIndex) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((op) => {
          if ((op as { id?: string }).id !== opId) return op;
          const opObj = op as { keyframes?: unknown[] };
          return {
            ...opObj,
            keyframes: (opObj.keyframes ?? []).filter((_, ki) => ki !== keyframeIndex),
          };
        }),
        ...updateUndoRedoFlags(),
      }));
    },

    updateKeyframeById: (opId, keyframeIndex, keyframe) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((op) => {
          if ((op as { id?: string }).id !== opId) return op;
          const opObj = op as { keyframes?: unknown[] };
          return {
            ...opObj,
            keyframes: (opObj.keyframes ?? []).map((kf, ki) =>
              ki === keyframeIndex ? keyframe : kf,
            ),
          };
        }),
        ...updateUndoRedoFlags(),
      }));
    },

    undo: () => {
      const previous = undoStack.pop();
      if (previous === undefined) return;
      const current = [...get().operations];
      redoStack.push(current);
      set({
        operations: previous,
        canUndo: undoStack.length > 0,
        canRedo: true,
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
      });
    },

    redo: () => {
      const next = redoStack.pop();
      if (next === undefined) return;
      const current = [...get().operations];
      undoStack.push(current);
      set({
        operations: next,
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
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        selectedOperationId: id,
        cropEditingOperationIndex: state.operations.length,
        cropEditingOperationId: id,
        ...updateUndoRedoFlags(),
      }));
    },

    applyCrop: (index) => {
      const state = get();
      const raw = state.operations[index];
      if (!raw || (raw as { type?: string }).type !== "crop") return;
      const c = raw as CropOperation;
      pushHistory();
      set({
        operations: state.operations.map((o, i) => (i === index ? { ...c, applied: true } : o)),
        cropEditingOperationIndex: null,
        cropEditingOperationId: null,
        ...updateUndoRedoFlags(),
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
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        selectedOperationId: id,
        ...updateUndoRedoFlags(),
      }));
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
      };
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        selectedOperationId: id,
        ...updateUndoRedoFlags(),
      }));
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
        keyframes: [],
      };
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        selectedOperationId: id,
        ...updateUndoRedoFlags(),
      }));
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
        keyframes: [],
      };
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        selectedOperationId: id,
        ...updateUndoRedoFlags(),
      }));
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
        keyframes: [],
      };
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        selectedOperationId: id,
        ...updateUndoRedoFlags(),
      }));
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
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        selectedOperationId: id,
        ...updateUndoRedoFlags(),
      }));
    },

    addKeyframe: (opIndex, keyframe) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((op, i) => {
          if (i !== opIndex) return op;
          const opObj = op as { keyframes?: unknown[] };
          return { ...opObj, keyframes: [...(opObj.keyframes ?? []), keyframe] };
        }),
        ...updateUndoRedoFlags(),
      }));
    },

    removeKeyframe: (opIndex, keyframeIndex) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((op, i) => {
          if (i !== opIndex) return op;
          const opObj = op as { keyframes?: unknown[] };
          return {
            ...opObj,
            keyframes: (opObj.keyframes ?? []).filter((_, ki) => ki !== keyframeIndex),
          };
        }),
        ...updateUndoRedoFlags(),
      }));
    },

    updateKeyframe: (opIndex, keyframeIndex, keyframe) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.map((op, i) => {
          if (i !== opIndex) return op;
          const opObj = op as { keyframes?: unknown[] };
          return {
            ...opObj,
            keyframes: (opObj.keyframes ?? []).map((kf, ki) =>
              ki === keyframeIndex ? keyframe : kf,
            ),
          };
        }),
        ...updateUndoRedoFlags(),
      }));
    },

    setSelectedOperationIndex: (index) => {
      set({ selectedOperationIndex: index });
    },

    setSelectedOperationId: (id) => {
      set({ selectedOperationId: id });
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

    hydrate: (operations) => {
      undoStack = [];
      redoStack = [];
      const hydratedOps = operations.map((op) => {
        const normalized = normalizeCropOperation(op);
        const obj = normalized as Record<string, unknown>;
        // Assign id if missing
        if (!obj.id) {
          obj.id = crypto.randomUUID();
        }
        // Assign default startFrame if missing (skip clip/caption which already have it)
        if (obj.startFrame === undefined && obj.type !== "clip") {
          obj.startFrame = 0;
        }
        return normalized;
      });
      set({
        operations: hydratedOps,
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
