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

  // Audio convenience
  addAudio: (assetId: string) => void;

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

    addAudio: (assetId) => {
      const op = {
        type: "audio" as const,
        assetId,
        offsetFrames: 0,
        crossfade: 0.5,
      };
      pushHistory();
      set((state) => ({
        operations: [...state.operations, op],
        selectedOperationIndex: state.operations.length,
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
