import { create } from "zustand";

export type ClipRange = {
  startFrame: number;
  endFrame: number;
};

type ClipState = {
  ranges: ClipRange[];
  clipMode: boolean;
  selectedRangeIndex: number | null;
  canUndo: boolean;
  canRedo: boolean;

  toggleClipMode: () => void;
  addRange: (startFrame: number, endFrame: number) => void;
  removeRange: (index: number) => void;
  updateRange: (index: number, startFrame: number, endFrame: number) => void;
  selectRange: (index: number | null) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
};

type HistoryEntry = ClipRange[];

export const useClipStore = create<ClipState>((set, get) => {
  // eslint-disable-next-line functional/no-let
  let undoStack: HistoryEntry[] = [];
  // eslint-disable-next-line functional/no-let
  let redoStack: HistoryEntry[] = [];

  const pushHistory = () => {
    undoStack.push([...get().ranges]);
    redoStack = [];
  };

  return {
    ranges: [],
    clipMode: false,
    selectedRangeIndex: null,
    canUndo: false,
    canRedo: false,

    toggleClipMode: () => {
      set((state) => ({ clipMode: !state.clipMode }));
    },

    addRange: (startFrame, endFrame) => {
      pushHistory();
      set((state) => ({
        ranges: [...state.ranges, { startFrame, endFrame }],
        selectedRangeIndex: state.ranges.length,
        canUndo: true,
        canRedo: false,
      }));
    },

    removeRange: (index) => {
      pushHistory();
      set((state) => ({
        ranges: state.ranges.filter((_, i) => i !== index),
        selectedRangeIndex:
          state.selectedRangeIndex === index ? null : state.selectedRangeIndex,
        canUndo: true,
        canRedo: false,
      }));
    },

    updateRange: (index, startFrame, endFrame) => {
      pushHistory();
      set((state) => ({
        ranges: state.ranges.map((r, i) =>
          i === index ? { startFrame, endFrame } : r,
        ),
        canUndo: true,
        canRedo: false,
      }));
    },

    selectRange: (index) => {
      set({ selectedRangeIndex: index });
    },

    undo: () => {
      const previous = undoStack.pop();
      if (previous === undefined) return;
      redoStack.push([...get().ranges]);
      set({
        ranges: previous,
        canUndo: undoStack.length > 0,
        canRedo: true,
      });
    },

    redo: () => {
      const next = redoStack.pop();
      if (next === undefined) return;
      undoStack.push([...get().ranges]);
      set({
        ranges: next,
        canUndo: true,
        canRedo: redoStack.length > 0,
      });
    },

    reset: () => {
      undoStack = [];
      redoStack = [];
      set({
        ranges: [],
        clipMode: false,
        selectedRangeIndex: null,
        canUndo: false,
        canRedo: false,
      });
    },
  };
});
