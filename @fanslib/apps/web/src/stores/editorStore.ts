import { create } from "zustand";

type EditorState = {
  operations: unknown[];
  selectedOperationIndex: number | null;
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

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Keyframe mutations
  addKeyframe: (opIndex: number, keyframe: unknown) => void;
  removeKeyframe: (opIndex: number, keyframeIndex: number) => void;
  updateKeyframe: (opIndex: number, keyframeIndex: number, keyframe: unknown) => void;

  // Crop convenience
  addCrop: (aspectRatio?: string) => void;

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
    canUndo: false,
    isDirty: false,
    sourceMediaId: null,
    editId: null,
    canRedo: false,

    addOperation: (op) => {
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        ...updateUndoRedoFlags(),
      }));
    },

    removeOperation: (index) => {
      pushHistory();
      set((state) => ({
        operations: state.operations.filter((_, i) => i !== index),
        selectedOperationIndex:
          state.selectedOperationIndex === index ? null : state.selectedOperationIndex,
        ...updateUndoRedoFlags(),
      }));
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

    undo: () => {
      const previous = undoStack.pop();
      if (previous === undefined) return;
      const current = [...get().operations];
      redoStack.push(current);
      set({
        operations: previous,
        canUndo: undoStack.length > 0,
        canRedo: true,
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
      });
    },

    addCrop: (aspectRatio = "16:9") => {
      const op = {
        type: "crop" as const,
        aspectRatio,
        centerX: 0.5,
        centerY: 0.5,
      };
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
        ...updateUndoRedoFlags(),
      }));
    },

    addCaption: () => {
      const op = {
        type: "caption" as const,
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
        ...updateUndoRedoFlags(),
      }));
    },

    addWatermark: (assetId) => {
      const op = {
        type: "watermark" as const,
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
        ...updateUndoRedoFlags(),
      }));
    },

    addBlur: () => {
      const op = {
        type: "blur" as const,
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
        ...updateUndoRedoFlags(),
      }));
    },

    addEmoji: (emoji = "⭐") => {
      const op = {
        type: "emoji" as const,
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
        ...updateUndoRedoFlags(),
      }));
    },

    addPixelate: () => {
      const op = {
        type: "pixelate" as const,
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
        ...updateUndoRedoFlags(),
      }));
    },

    addZoom: () => {
      const op = {
        type: "zoom" as const,
        scale: 1.0,
        centerX: 0.5,
        centerY: 0.5,
        keyframes: [],
      };
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
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
      set({
        operations: [...operations],
        selectedOperationIndex: null,
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
        canUndo: false,
        canRedo: false,
        isDirty: false,
        sourceMediaId: null,
        editId: null,
      });
    },
  };
});
