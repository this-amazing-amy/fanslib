import { create } from "zustand";

type EditorState = {
  operations: unknown[];
  selectedOperationIndex: number | null;
  canUndo: boolean;
  canRedo: boolean;

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

  // Blur convenience
  addBlur: () => void;

  // Zoom convenience
  addZoom: () => void;

  // Selection
  setSelectedOperationIndex: (index: number | null) => void;

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
  });

  return {
    operations: [],
    selectedOperationIndex: null,
    canUndo: false,
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

    hydrate: (operations) => {
      undoStack = [];
      redoStack = [];
      set({
        operations: [...operations],
        selectedOperationIndex: null,
        canUndo: false,
        canRedo: false,
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
      });
    },
  };
});
