import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi, afterEach } from "vitest";
import { useEditorStore } from "~/stores/editorStore";

// Mock the composition mutation
const mockMutateAsync = vi.fn();
vi.mock("~/lib/queries/compositions", () => ({
  useUpdateCompositionMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

import { useCompositionAutoSave } from "./useCompositionAutoSave";

describe("useCompositionAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useEditorStore.getState().reset();
    mockMutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test("marks dirty when store segments change", () => {
    renderHook(() => useCompositionAutoSave("comp-1"));

    expect(useEditorStore.getState().isDirty).toBe(false);

    act(() => {
      useEditorStore.getState().addSegment({
        sourceMediaId: "media-1",
        sourceStartFrame: 0,
        sourceEndFrame: 150,
      });
    });

    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  test("calls save after debounce period", async () => {
    renderHook(() => useCompositionAutoSave("comp-1"));

    act(() => {
      useEditorStore.getState().addOperation({ type: "blur" });
    });

    // Before debounce fires, no save yet
    expect(mockMutateAsync).not.toHaveBeenCalled();

    // Advance past the debounce period
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: "comp-1",
      body: {
        segments: useEditorStore.getState().segments,
        tracks: useEditorStore.getState().tracks,
      },
    });
  });

  test("rapid changes coalesce into single save", async () => {
    renderHook(() => useCompositionAutoSave("comp-1"));

    // Make multiple rapid changes
    act(() => {
      useEditorStore.getState().addOperation({ type: "blur" });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      useEditorStore.getState().addOperation({ type: "emoji" });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      useEditorStore.getState().addOperation({ type: "caption" });
    });

    // Still hasn't saved (debounce resets each time)
    expect(mockMutateAsync).not.toHaveBeenCalled();

    // Now wait for full debounce period after last change
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  test("marks clean after successful save", async () => {
    renderHook(() => useCompositionAutoSave("comp-1"));

    act(() => {
      useEditorStore.getState().addOperation({ type: "blur" });
    });

    expect(useEditorStore.getState().isDirty).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  test("does not save when compositionId is null", async () => {
    renderHook(() => useCompositionAutoSave(null));

    act(() => {
      useEditorStore.getState().addOperation({ type: "blur" });
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test("surfaces error state on save failure", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCompositionAutoSave("comp-1"));

    act(() => {
      useEditorStore.getState().addOperation({ type: "blur" });
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.lastSaveError).toBe("Network error");
    // isDirty should remain true on failure
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  test("saveNow triggers immediate save", async () => {
    const { result } = renderHook(() => useCompositionAutoSave("comp-1"));

    act(() => {
      useEditorStore.getState().addOperation({ type: "blur" });
    });

    await act(async () => {
      result.current.saveNow();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  test("cleans up subscription on unmount", async () => {
    const { unmount } = renderHook(() => useCompositionAutoSave("comp-1"));

    unmount();

    act(() => {
      useEditorStore.getState().addOperation({ type: "blur" });
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
