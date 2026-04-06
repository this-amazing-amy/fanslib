import { beforeEach, describe, expect, test } from "vitest";
import { useEditorStore } from "./editorStore";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  test("starts with empty operations", () => {
    expect(useEditorStore.getState().operations).toEqual([]);
  });

  test("addOperation appends an operation and stamps an id", () => {
    const op = { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 };
    useEditorStore.getState().addOperation(op);
    expect(useEditorStore.getState().operations).toHaveLength(1);
    const stored = useEditorStore.getState().operations[0] as { type: string; id: string };
    expect(stored.type).toBe("watermark");
    expect(typeof stored.id).toBe("string");
    expect(stored.id.length).toBeGreaterThan(0);
  });

  test("addOperation generates unique ids for each operation", () => {
    useEditorStore.getState().addOperation({ type: "blur" });
    useEditorStore.getState().addOperation({ type: "emoji" });
    const ops = useEditorStore.getState().operations as Array<{ id: string }>;
    expect(ops[0].id).not.toBe(ops[1].id);
  });

  test("removeOperation removes by index", () => {
    const op1 = { type: "watermark", assetId: "a1", x: 0.1, y: 0.1, width: 0.1, opacity: 1 };
    const op2 = { type: "watermark", assetId: "a2", x: 0.9, y: 0.9, width: 0.2, opacity: 0.5 };
    useEditorStore.getState().addOperation(op1);
    useEditorStore.getState().addOperation(op2);
    useEditorStore.getState().removeOperation(0);
    expect(useEditorStore.getState().operations).toHaveLength(1);
    expect(useEditorStore.getState().operations[0]).toMatchObject(op2);
  });

  test("updateOperation updates at index", () => {
    const op = { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 };
    useEditorStore.getState().addOperation(op);
    const stored = useEditorStore.getState().operations[0] as { id: string };
    useEditorStore.getState().updateOperation(0, { ...op, id: stored.id, opacity: 0.3 });
    expect(useEditorStore.getState().operations[0]).toMatchObject({ ...op, opacity: 0.3 });
  });

  test("removeOperationById removes by id and clears selection if matched", () => {
    useEditorStore.getState().addOperation({ type: "blur" });
    useEditorStore.getState().addOperation({ type: "emoji" });
    const ops = useEditorStore.getState().operations as Array<{ id: string }>;
    const blurId = ops[0].id;
    const emojiId = ops[1].id;
    useEditorStore.getState().setSelectedOperationId(blurId);
    useEditorStore.getState().removeOperationById(blurId);
    expect(useEditorStore.getState().operations).toHaveLength(1);
    expect((useEditorStore.getState().operations[0] as { id: string }).id).toBe(emojiId);
    expect(useEditorStore.getState().selectedOperationId).toBeNull();
  });

  test("removeOperationById preserves selection if different op removed", () => {
    useEditorStore.getState().addOperation({ type: "blur" });
    useEditorStore.getState().addOperation({ type: "emoji" });
    const ops = useEditorStore.getState().operations as Array<{ id: string }>;
    useEditorStore.getState().setSelectedOperationId(ops[1].id);
    useEditorStore.getState().removeOperationById(ops[0].id);
    expect(useEditorStore.getState().selectedOperationId).toBe(ops[1].id);
  });

  test("updateOperationById updates by id preserving the id", () => {
    useEditorStore.getState().addOperation({ type: "blur", radius: 20 });
    const op = useEditorStore.getState().operations[0] as { id: string; radius: number };
    useEditorStore.getState().updateOperationById(op.id, { type: "blur", radius: 50 });
    const updated = useEditorStore.getState().operations[0] as { id: string; radius: number };
    expect(updated.radius).toBe(50);
    expect(updated.id).toBe(op.id);
  });

  test("addKeyframeById adds a keyframe to an operation found by id", () => {
    useEditorStore.getState().addOperation({ type: "blur", keyframes: [] });
    const op = useEditorStore.getState().operations[0] as { id: string };
    useEditorStore.getState().addKeyframeById(op.id, { frame: 0, values: { x: 10 } });
    const updated = useEditorStore.getState().operations[0] as { keyframes: unknown[] };
    expect(updated.keyframes).toHaveLength(1);
  });

  test("reorderOperations moves operation from one index to another", () => {
    useEditorStore.getState().addOperation({ type: "a" });
    useEditorStore.getState().addOperation({ type: "b" });
    useEditorStore.getState().addOperation({ type: "c" });
    useEditorStore.getState().reorderOperations(0, 2);
    const result = useEditorStore.getState().operations as Array<{ type: string }>;
    expect(result[0].type).toBe("b");
    expect(result[1].type).toBe("c");
    expect(result[2].type).toBe("a");
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
    expect(useEditorStore.getState().operations[0]).toMatchObject(op);
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
    expect(useEditorStore.getState().operations[1]).toMatchObject({ type: "c" });
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

  test("setSelectedOperationId tracks selection by ID", () => {
    useEditorStore.getState().addOperation({ type: "a" });
    const op = useEditorStore.getState().operations[0] as { id: string };
    useEditorStore.getState().setSelectedOperationId(op.id);
    expect(useEditorStore.getState().selectedOperationId).toBe(op.id);
  });

  test("setCropEditingOperationId sets both crop editing and selection by ID", () => {
    useEditorStore.getState().addOperation({ type: "crop" });
    const op = useEditorStore.getState().operations[0] as { id: string };
    useEditorStore.getState().setCropEditingOperationId(op.id);
    expect(useEditorStore.getState().cropEditingOperationId).toBe(op.id);
    expect(useEditorStore.getState().selectedOperationId).toBe(op.id);
  });

  test("setCropEditingOperationId(null) clears crop editing", () => {
    useEditorStore.getState().addOperation({ type: "crop" });
    const op = useEditorStore.getState().operations[0] as { id: string };
    useEditorStore.getState().setCropEditingOperationId(op.id);
    useEditorStore.getState().setCropEditingOperationId(null);
    expect(useEditorStore.getState().cropEditingOperationId).toBeNull();
  });

  test("setSelectedOperationId(null) clears selection", () => {
    useEditorStore.getState().addOperation({ type: "a" });
    const op = useEditorStore.getState().operations[0] as { id: string };
    useEditorStore.getState().setSelectedOperationId(op.id);
    useEditorStore.getState().setSelectedOperationId(null);
    expect(useEditorStore.getState().selectedOperationId).toBeNull();
  });

  test("addWatermark adds a watermark operation with default values and selects it by ID", () => {
    useEditorStore.getState().addWatermark("asset-123");

    const ops = useEditorStore.getState().operations;
    expect(ops).toHaveLength(1);
    const op = ops[0] as {
      type: string;
      id: string;
      assetId: string;
      x: number;
      y: number;
      width: number;
      opacity: number;
    };
    expect(op.type).toBe("watermark");
    expect(op.assetId).toBe("asset-123");
    expect(op.x).toBe(0.5);
    expect(op.y).toBe(0.5);
    expect(op.width).toBe(0.1);
    expect(op.opacity).toBe(0.7);
    expect(typeof op.id).toBe("string");
    expect(useEditorStore.getState().selectedOperationId).toBe(op.id);
  });

  test("addWatermark is undoable", () => {
    useEditorStore.getState().addWatermark("asset-1");
    expect(useEditorStore.getState().operations).toHaveLength(1);
    expect(useEditorStore.getState().canUndo).toBe(true);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().operations).toHaveLength(0);
  });

  test("hydrate loads operations from existing data", () => {
    const ops = [{ type: "blur" }, { type: "emoji" }];
    useEditorStore.getState().hydrate(ops);
    expect(useEditorStore.getState().operations).toHaveLength(2);
    // History should be clean after hydration
    expect(useEditorStore.getState().canUndo).toBe(false);
  });

  test("hydrate assigns ids to legacy operations that lack them", () => {
    const legacyOps = [
      { type: "blur", x: 0.4, y: 0.4, width: 0.15, height: 0.15, radius: 20, keyframes: [] },
      { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 0.7 },
    ];
    useEditorStore.getState().hydrate(legacyOps);
    const ops = useEditorStore.getState().operations as Array<{ id: string; type: string }>;
    expect(typeof ops[0].id).toBe("string");
    expect(ops[0].id.length).toBeGreaterThan(0);
    expect(typeof ops[1].id).toBe("string");
    expect(ops[0].id).not.toBe(ops[1].id);
  });

  test("hydrate preserves existing ids", () => {
    const existingId = "pre-existing-id-123";
    const ops = [{ type: "blur", id: existingId, keyframes: [] }];
    useEditorStore.getState().hydrate(ops);
    const stored = useEditorStore.getState().operations[0] as { id: string };
    expect(stored.id).toBe(existingId);
  });

  test("hydrate assigns default time ranges to operations that lack them", () => {
    const legacyOps = [
      { type: "blur", x: 0.4, y: 0.4, width: 0.15, height: 0.15, radius: 20, keyframes: [] },
      { type: "caption", text: "hello", x: 0.5, y: 0.8, fontSize: 0.05, color: "#fff", animation: "fade-in", startFrame: 10, endFrame: 50 },
    ];
    useEditorStore.getState().hydrate(legacyOps);
    const ops = useEditorStore.getState().operations as Array<{ startFrame?: number; endFrame?: number }>;
    // blur had no time range — should get defaults (0, undefined)
    expect(ops[0].startFrame).toBe(0);
    // caption already had time range — should be preserved
    expect(ops[1].startFrame).toBe(10);
    expect(ops[1].endFrame).toBe(50);
  });

  test("setEditId and setSourceMediaId track metadata", () => {
    useEditorStore.getState().setSourceMediaId("media-1");
    expect(useEditorStore.getState().sourceMediaId).toBe("media-1");

    useEditorStore.getState().setEditId("edit-1");
    expect(useEditorStore.getState().editId).toBe("edit-1");
  });

  test("isDirty starts false and becomes true after mutation", () => {
    expect(useEditorStore.getState().isDirty).toBe(false);
    useEditorStore.getState().addOperation({ type: "a" });
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  test("markClean resets isDirty", () => {
    useEditorStore.getState().addOperation({ type: "a" });
    expect(useEditorStore.getState().isDirty).toBe(true);
    useEditorStore.getState().markClean();
    expect(useEditorStore.getState().isDirty).toBe(false);
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

  describe("crop operations", () => {
    test("addCrop adds a crop operation with draft rect and enters crop edit mode by ID", () => {
      useEditorStore.getState().addCrop();

      const ops = useEditorStore.getState().operations;
      expect(ops).toHaveLength(1);
      const op = ops[0] as {
        type: string;
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        applied: boolean;
      };
      expect(op.type).toBe("crop");
      expect(op.applied).toBe(false);
      expect(op.width).toBe(0.9);
      expect(op.height).toBe(0.9);
      expect(typeof op.id).toBe("string");
      expect(useEditorStore.getState().selectedOperationId).toBe(op.id);
      expect(useEditorStore.getState().cropEditingOperationId).toBe(op.id);
    });

    test("addCrop is undoable", () => {
      useEditorStore.getState().addCrop();
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().operations).toHaveLength(0);
    });
  });

  describe("caption operations", () => {
    test("addCaption adds a caption with default values", () => {
      useEditorStore.getState().addCaption();

      const ops = useEditorStore.getState().operations;
      expect(ops).toHaveLength(1);
      const op = ops[0] as {
        type: string;
        text: string;
        x: number;
        y: number;
        fontSize: number;
        color: string;
        animation: string;
        startFrame: number;
        endFrame: number;
      };
      expect(op.type).toBe("caption");
      expect(op.text).toBe("Caption");
      expect(op.x).toBe(0.5);
      expect(op.y).toBe(0.8);
      expect(op.fontSize).toBe(0.05);
      expect(op.color).toBe("#ffffff");
      expect(op.animation).toBe("fade-in");
      expect(op.startFrame).toBe(0);
      expect(op.endFrame).toBe(90);
      const opWithId = ops[0] as { id: string };
      expect(useEditorStore.getState().selectedOperationId).toBe(opWithId.id);
    });

    test("addCaption is undoable", () => {
      useEditorStore.getState().addCaption();
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().operations).toHaveLength(0);
    });
  });

  describe("blur operations", () => {
    test("addBlur adds a blur operation with sensible defaults", () => {
      useEditorStore.getState().addBlur();

      const ops = useEditorStore.getState().operations;
      expect(ops).toHaveLength(1);
      const op = ops[0] as {
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        radius: number;
        keyframes: unknown[];
      };
      expect(op.type).toBe("blur");
      expect(op.x).toBe(0.4);
      expect(op.y).toBe(0.4);
      expect(op.width).toBe(0.15);
      expect(op.height).toBe(0.15);
      expect(op.radius).toBe(20);
      expect(op.keyframes).toEqual([]);
      expect(useEditorStore.getState().selectedOperationId).toBe((useEditorStore.getState().operations[0] as { id: string }).id);
    });

    test("addBlur is undoable", () => {
      useEditorStore.getState().addBlur();
      expect(useEditorStore.getState().operations).toHaveLength(1);
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().operations).toHaveLength(0);
    });
  });

  describe("emoji operations", () => {
    test("addEmoji adds an emoji overlay with default values", () => {
      useEditorStore.getState().addEmoji();

      const ops = useEditorStore.getState().operations;
      expect(ops).toHaveLength(1);
      const op = ops[0] as {
        type: string;
        emoji: string;
        x: number;
        y: number;
        size: number;
        keyframes: unknown[];
      };
      expect(op.type).toBe("emoji");
      expect(op.emoji).toBe("⭐");
      expect(op.x).toBe(0.5);
      expect(op.y).toBe(0.5);
      expect(op.size).toBe(0.08);
      expect(op.keyframes).toEqual([]);
      expect(useEditorStore.getState().selectedOperationId).toBe((useEditorStore.getState().operations[0] as { id: string }).id);
    });

    test("addEmoji is undoable", () => {
      useEditorStore.getState().addEmoji();
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().operations).toHaveLength(0);
    });
  });

  describe("pixelate operations", () => {
    test("addPixelate adds a pixelate operation with sensible defaults", () => {
      useEditorStore.getState().addPixelate();

      const ops = useEditorStore.getState().operations;
      expect(ops).toHaveLength(1);
      const op = ops[0] as {
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        pixelSize: number;
        keyframes: unknown[];
      };
      expect(op.type).toBe("pixelate");
      expect(op.x).toBe(0.4);
      expect(op.y).toBe(0.4);
      expect(op.width).toBe(0.15);
      expect(op.height).toBe(0.15);
      expect(op.pixelSize).toBe(10);
      expect(op.keyframes).toEqual([]);
      expect(useEditorStore.getState().selectedOperationId).toBe((useEditorStore.getState().operations[0] as { id: string }).id);
    });

    test("addPixelate is undoable", () => {
      useEditorStore.getState().addPixelate();
      expect(useEditorStore.getState().operations).toHaveLength(1);
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().operations).toHaveLength(0);
    });
  });

  describe("zoom operations", () => {
    test("addZoom adds a zoom operation with default values", () => {
      useEditorStore.getState().addZoom();

      const ops = useEditorStore.getState().operations;
      expect(ops).toHaveLength(1);
      const op = ops[0] as {
        type: string;
        scale: number;
        centerX: number;
        centerY: number;
        keyframes: unknown[];
      };
      expect(op.type).toBe("zoom");
      expect(op.scale).toBe(1.0);
      expect(op.centerX).toBe(0.5);
      expect(op.centerY).toBe(0.5);
      expect(op.keyframes).toEqual([]);
      expect(useEditorStore.getState().selectedOperationId).toBe((useEditorStore.getState().operations[0] as { id: string }).id);
    });

    test("addZoom is undoable", () => {
      useEditorStore.getState().addZoom();
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().operations).toHaveLength(0);
    });
  });
});
