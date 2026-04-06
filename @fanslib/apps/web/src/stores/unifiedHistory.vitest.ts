import { beforeEach, describe, expect, test } from "vitest";
import { useClipStore } from "./clipStore";
import { useEditorStore } from "./editorStore";
import { unifiedHistory } from "./unifiedHistory";

describe("unifiedHistory — interleaved undo/redo", () => {
  beforeEach(() => {
    useClipStore.getState().reset();
    useEditorStore.getState().reset();
    unifiedHistory.reset();
  });

  test("undo removes most recent action regardless of store", () => {
    // 1. Add a clip range
    unifiedHistory.capture();
    useClipStore.getState().addRange(0, 100);

    // 2. Add a caption
    unifiedHistory.capture();
    useEditorStore.getState().addCaption();

    expect(useEditorStore.getState().operations).toHaveLength(1);
    expect(useClipStore.getState().ranges).toHaveLength(1);

    // Undo should remove the caption (most recent)
    unifiedHistory.undo();
    expect(useEditorStore.getState().operations).toHaveLength(0);
    expect(useClipStore.getState().ranges).toHaveLength(1);

    // Undo again should remove the clip
    unifiedHistory.undo();
    expect(useClipStore.getState().ranges).toHaveLength(0);
  });

  test("redo restores across interleaved actions", () => {
    unifiedHistory.capture();
    useClipStore.getState().addRange(0, 100);

    unifiedHistory.capture();
    useEditorStore.getState().addCaption();

    unifiedHistory.undo();
    unifiedHistory.undo();

    expect(useClipStore.getState().ranges).toHaveLength(0);
    expect(useEditorStore.getState().operations).toHaveLength(0);

    unifiedHistory.redo();
    expect(useClipStore.getState().ranges).toHaveLength(1);

    unifiedHistory.redo();
    expect(useEditorStore.getState().operations).toHaveLength(1);
  });

  test("new action after undo clears redo stack", () => {
    unifiedHistory.capture();
    useClipStore.getState().addRange(0, 100);

    unifiedHistory.capture();
    useEditorStore.getState().addCaption();

    unifiedHistory.undo(); // undo caption

    // New action should clear redo
    unifiedHistory.capture();
    useClipStore.getState().addRange(200, 300);

    expect(unifiedHistory.canRedo()).toBe(false);
  });

  test("canUndo and canRedo reflect state correctly", () => {
    expect(unifiedHistory.canUndo()).toBe(false);
    expect(unifiedHistory.canRedo()).toBe(false);

    unifiedHistory.capture();
    useClipStore.getState().addRange(0, 100);

    expect(unifiedHistory.canUndo()).toBe(true);
    expect(unifiedHistory.canRedo()).toBe(false);

    unifiedHistory.undo();

    expect(unifiedHistory.canUndo()).toBe(false);
    expect(unifiedHistory.canRedo()).toBe(true);
  });
});
