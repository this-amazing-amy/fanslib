import { beforeEach, describe, expect, test } from "vitest";
import { useEditorStore } from "./editorStore";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  test("starts with empty operations", () => {
    expect(useEditorStore.getState().operations).toEqual([]);
  });

  test("addOperation appends an operation", () => {
    const op = { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 };
    useEditorStore.getState().addOperation(op);
    expect(useEditorStore.getState().operations).toHaveLength(1);
    expect(useEditorStore.getState().operations[0]).toEqual(op);
  });

  test("removeOperation removes by index", () => {
    const op1 = { type: "watermark", assetId: "a1", x: 0.1, y: 0.1, width: 0.1, opacity: 1 };
    const op2 = { type: "watermark", assetId: "a2", x: 0.9, y: 0.9, width: 0.2, opacity: 0.5 };
    useEditorStore.getState().addOperation(op1);
    useEditorStore.getState().addOperation(op2);
    useEditorStore.getState().removeOperation(0);
    expect(useEditorStore.getState().operations).toHaveLength(1);
    expect(useEditorStore.getState().operations[0]).toEqual(op2);
  });

  test("updateOperation updates at index", () => {
    const op = { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 };
    useEditorStore.getState().addOperation(op);
    useEditorStore.getState().updateOperation(0, { ...op, opacity: 0.3 });
    expect(useEditorStore.getState().operations[0]).toEqual({ ...op, opacity: 0.3 });
  });

  test("reorderOperations moves operation from one index to another", () => {
    const ops = [
      { type: "a", id: 1 },
      { type: "b", id: 2 },
      { type: "c", id: 3 },
    ];
    ops.forEach((op) => useEditorStore.getState().addOperation(op));
    useEditorStore.getState().reorderOperations(0, 2);
    const result = useEditorStore.getState().operations;
    expect(result[0]).toEqual({ type: "b", id: 2 });
    expect(result[1]).toEqual({ type: "c", id: 3 });
    expect(result[2]).toEqual({ type: "a", id: 1 });
  });

  test("undo reverts the last operation", () => {
    const op = { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 };
    useEditorStore.getState().addOperation(op);
    expect(useEditorStore.getState().operations).toHaveLength(1);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().operations).toHaveLength(0);
  });

  test("redo restores a previously undone operation", () => {
    const op = { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 };
    useEditorStore.getState().addOperation(op);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().operations).toHaveLength(0);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().operations).toHaveLength(1);
    expect(useEditorStore.getState().operations[0]).toEqual(op);
  });

  test("new mutation after undo clears the redo stack", () => {
    const op1 = { type: "a" };
    const op2 = { type: "b" };
    useEditorStore.getState().addOperation(op1);
    useEditorStore.getState().addOperation(op2);
    useEditorStore.getState().undo(); // undo op2
    useEditorStore.getState().addOperation({ type: "c" }); // new mutation

    useEditorStore.getState().redo(); // should do nothing — redo stack cleared
    expect(useEditorStore.getState().operations).toHaveLength(2);
    expect(useEditorStore.getState().operations[1]).toEqual({ type: "c" });
  });

  test("undo on empty history does nothing", () => {
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().operations).toEqual([]);
  });

  test("redo on empty redo stack does nothing", () => {
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().operations).toEqual([]);
  });

  test("canUndo and canRedo reflect state correctly", () => {
    expect(useEditorStore.getState().canUndo).toBe(false);
    expect(useEditorStore.getState().canRedo).toBe(false);

    useEditorStore.getState().addOperation({ type: "a" });
    expect(useEditorStore.getState().canUndo).toBe(true);
    expect(useEditorStore.getState().canRedo).toBe(false);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().canUndo).toBe(false);
    expect(useEditorStore.getState().canRedo).toBe(true);
  });

  test("setSelectedOperationIndex tracks selection", () => {
    useEditorStore.getState().addOperation({ type: "a" });
    useEditorStore.getState().setSelectedOperationIndex(0);
    expect(useEditorStore.getState().selectedOperationIndex).toBe(0);
  });

  test("hydrate loads operations from existing data", () => {
    const ops = [{ type: "a" }, { type: "b" }];
    useEditorStore.getState().hydrate(ops);
    expect(useEditorStore.getState().operations).toEqual(ops);
    // History should be clean after hydration
    expect(useEditorStore.getState().canUndo).toBe(false);
  });

  describe("keyframe operations", () => {
    test("addKeyframe adds a keyframe to an operation", () => {
      useEditorStore.getState().addOperation({ type: "blur", keyframes: [] });
      useEditorStore.getState().addKeyframe(0, { frame: 0, values: { x: 10, y: 20 } });

      const op = useEditorStore.getState().operations[0] as { keyframes: unknown[] };
      expect(op.keyframes).toHaveLength(1);
    });

    test("removeKeyframe removes a keyframe by index", () => {
      useEditorStore.getState().addOperation({
        type: "blur",
        keyframes: [
          { frame: 0, values: { x: 0 } },
          { frame: 30, values: { x: 100 } },
        ],
      });
      useEditorStore.getState().removeKeyframe(0, 0);

      const op = useEditorStore.getState().operations[0] as { keyframes: unknown[] };
      expect(op.keyframes).toHaveLength(1);
    });

    test("updateKeyframe updates a keyframe at index", () => {
      useEditorStore.getState().addOperation({
        type: "blur",
        keyframes: [{ frame: 0, values: { x: 0 } }],
      });
      useEditorStore.getState().updateKeyframe(0, 0, { frame: 0, values: { x: 50 } });

      const op = useEditorStore.getState().operations[0] as {
        keyframes: { frame: number; values: { x: number } }[];
      };
      expect(op.keyframes[0].values.x).toBe(50);
    });

    test("keyframe mutations are undoable", () => {
      useEditorStore.getState().addOperation({ type: "blur", keyframes: [] });
      useEditorStore.getState().addKeyframe(0, { frame: 0, values: { x: 10 } });
      expect(useEditorStore.getState().canUndo).toBe(true);

      useEditorStore.getState().undo();
      const op = useEditorStore.getState().operations[0] as { keyframes: unknown[] };
      expect(op.keyframes).toHaveLength(0);
    });
  });
});
