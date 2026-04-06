import { useClipStore, type ClipRange } from "./clipStore";
import { useEditorStore } from "./editorStore";

type Snapshot = {
  clipRanges: ClipRange[];
  editorTracks: unknown[];
};

type UnifiedHistory = {
  capture: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
};

const undoStack: Snapshot[] = [];
const redoStack: Snapshot[] = [];

const takeSnapshot = (): Snapshot => ({
  clipRanges: [...useClipStore.getState().ranges],
  editorTracks: JSON.parse(JSON.stringify(useEditorStore.getState().tracks)),
});

const restoreSnapshot = (snapshot: Snapshot) => {
  // Restore clip ranges directly via internal state replacement
  useClipStore.setState({ ranges: snapshot.clipRanges });

  // Restore editor tracks via hydrate-like mechanism
  useEditorStore.getState().restoreTracks(snapshot.editorTracks);
};

export const unifiedHistory: UnifiedHistory = {
  capture: () => {
    undoStack.push(takeSnapshot());
    redoStack.length = 0;
  },

  undo: () => {
    const previous = undoStack.pop();
    if (!previous) return;
    redoStack.push(takeSnapshot());
    restoreSnapshot(previous);
  },

  redo: () => {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(takeSnapshot());
    restoreSnapshot(next);
  },

  canUndo: () => undoStack.length > 0,
  canRedo: () => redoStack.length > 0,

  reset: () => {
    undoStack.length = 0;
    redoStack.length = 0;
  },
};
