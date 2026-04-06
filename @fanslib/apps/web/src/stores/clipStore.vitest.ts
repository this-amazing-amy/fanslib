import { beforeEach, describe, expect, test } from "vitest";
import { useClipStore } from "./clipStore";

describe("clipStore", () => {
  beforeEach(() => {
    useClipStore.getState().reset();
  });

  test("starts with empty ranges and clip mode off", () => {
    const state = useClipStore.getState();
    expect(state.ranges).toEqual([]);
    expect(state.clipMode).toBe(false);
    expect(state.selectedRangeIndex).toBeNull();
  });

  test("toggleClipMode toggles clip mode on/off", () => {
    useClipStore.getState().toggleClipMode();
    expect(useClipStore.getState().clipMode).toBe(true);
    useClipStore.getState().toggleClipMode();
    expect(useClipStore.getState().clipMode).toBe(false);
  });

  test("addRange adds a clip range with start and end frames", () => {
    useClipStore.getState().addRange(30, 150);
    const ranges = useClipStore.getState().ranges;
    expect(ranges).toHaveLength(1);
    expect(ranges[0].startFrame).toBe(30);
    expect(ranges[0].endFrame).toBe(150);
    expect(useClipStore.getState().selectedRangeIndex).toBe(0);
  });

  test("removeRange removes by index", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().addRange(200, 300);
    useClipStore.getState().removeRange(0);
    expect(useClipStore.getState().ranges).toHaveLength(1);
    expect(useClipStore.getState().ranges[0].startFrame).toBe(200);
  });

  test("updateRange adjusts start/end of a range", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().updateRange(0, 10, 90);
    const range = useClipStore.getState().ranges[0];
    expect(range.startFrame).toBe(10);
    expect(range.endFrame).toBe(90);
  });

  test("undo reverts addRange", () => {
    useClipStore.getState().addRange(0, 100);
    expect(useClipStore.getState().ranges).toHaveLength(1);
    useClipStore.getState().undo();
    expect(useClipStore.getState().ranges).toHaveLength(0);
  });

  test("redo restores undone addRange", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().undo();
    useClipStore.getState().redo();
    expect(useClipStore.getState().ranges).toHaveLength(1);
  });

  test("getDuration returns frame count of a range", () => {
    useClipStore.getState().addRange(30, 150);
    const range = useClipStore.getState().ranges[0];
    expect(range.endFrame - range.startFrame).toBe(120);
  });

  test("selectRange sets selectedRangeIndex", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().addRange(200, 300);
    useClipStore.getState().selectRange(1);
    expect(useClipStore.getState().selectedRangeIndex).toBe(1);
  });

  test("setPeakAtFrame sets peakFrame on the range containing the playhead", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().addRange(200, 400);
    useClipStore.getState().setPeakAtFrame(50);
    expect(useClipStore.getState().ranges[0].peakFrame).toBe(50);
    expect(useClipStore.getState().ranges[1].peakFrame).toBeUndefined();
  });

  test("setPeakAtFrame does nothing when playhead is outside all ranges", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().setPeakAtFrame(150);
    expect(useClipStore.getState().ranges[0].peakFrame).toBeUndefined();
  });

  test("setPeakAtFrame updates existing peak on same range", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().setPeakAtFrame(30);
    useClipStore.getState().setPeakAtFrame(70);
    expect(useClipStore.getState().ranges[0].peakFrame).toBe(70);
  });

  test("setPeakAtFrame is undoable", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().setPeakAtFrame(50);
    expect(useClipStore.getState().ranges[0].peakFrame).toBe(50);
    useClipStore.getState().undo();
    expect(useClipStore.getState().ranges[0].peakFrame).toBeUndefined();
  });
});
