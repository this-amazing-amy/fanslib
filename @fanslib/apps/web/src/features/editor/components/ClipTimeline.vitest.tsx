/// <reference types="@testing-library/jest-dom" />
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useClipStore } from "~/stores/clipStore";
import { ClipTimeline } from "./ClipTimeline";

afterEach(cleanup);

beforeEach(() => {
  useClipStore.getState().reset();
});

const defaultProps = {
  totalFrames: 900,
  fps: 30,
  onSeek: vi.fn(),
};

describe("ClipTimeline — clip region selection", () => {
  test("clicking a clip region selects it in the store", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().addRange(200, 400);
    // addRange auto-selects the last added, so clear selection
    useClipStore.getState().selectRange(null);

    render(<ClipTimeline {...defaultProps} />);

    // Click the first range item in the range list
    const rangeItem = screen.getByText("Range 1");
    fireEvent.click(rangeItem.closest("[class*=cursor-pointer]") as HTMLElement);

    expect(useClipStore.getState().selectedRangeIndex).toBe(0);
  });

  test("selected clip region has a distinct visual ring", () => {
    useClipStore.getState().addRange(0, 100);
    // addRange selects the range automatically
    expect(useClipStore.getState().selectedRangeIndex).toBe(0);

    const { container } = render(<ClipTimeline {...defaultProps} />);

    // The timeline bar clip region should have ring classes
    const clipRegion = container.querySelector(".ring-2.ring-primary");
    expect(clipRegion).toBeTruthy();
  });

  test("clicking empty space on timeline bar deselects the selected clip region", () => {
    useClipStore.getState().addRange(100, 200);
    expect(useClipStore.getState().selectedRangeIndex).toBe(0);

    render(<ClipTimeline {...defaultProps} />);

    // Click the timeline bar background (not on a clip region)
    const timelineBar = screen.getByTestId("clip-timeline-bar");
    fireEvent.click(timelineBar);

    expect(useClipStore.getState().selectedRangeIndex).toBeNull();
  });

  test("pressing Escape deselects the selected clip region", () => {
    useClipStore.getState().addRange(0, 100);
    expect(useClipStore.getState().selectedRangeIndex).toBe(0);

    render(<ClipTimeline {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(useClipStore.getState().selectedRangeIndex).toBeNull();
  });

  test("only one clip region can be selected at a time", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().addRange(200, 400);
    useClipStore.getState().selectRange(0);

    render(<ClipTimeline {...defaultProps} />);

    // Click the second range
    const rangeItem = screen.getByText("Range 2");
    fireEvent.click(rangeItem.closest("[class*=cursor-pointer]") as HTMLElement);

    expect(useClipStore.getState().selectedRangeIndex).toBe(1);
  });
});

describe("ClipTimeline — delete clip regions", () => {
  beforeEach(() => {
    useClipStore.getState().reset();
  });

  test("pressing Backspace removes the selected clip region", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().addRange(200, 400);
    useClipStore.getState().selectRange(0);

    render(<ClipTimeline {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Backspace" });

    expect(useClipStore.getState().ranges).toHaveLength(1);
    expect(useClipStore.getState().ranges[0].startFrame).toBe(200);
    expect(useClipStore.getState().selectedRangeIndex).toBeNull();
  });

  test("pressing Delete removes the selected clip region", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().selectRange(0);

    render(<ClipTimeline {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Delete" });

    expect(useClipStore.getState().ranges).toHaveLength(0);
    expect(useClipStore.getState().selectedRangeIndex).toBeNull();
  });

  test("pressing Backspace with no selection does nothing", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().selectRange(null);

    render(<ClipTimeline {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Backspace" });

    expect(useClipStore.getState().ranges).toHaveLength(1);
  });

  test("deletion is undoable", () => {
    useClipStore.getState().addRange(0, 100);
    useClipStore.getState().selectRange(0);

    render(<ClipTimeline {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Delete" });
    expect(useClipStore.getState().ranges).toHaveLength(0);

    useClipStore.getState().undo();
    expect(useClipStore.getState().ranges).toHaveLength(1);
  });

  test("close button visible on selected clip region", () => {
    useClipStore.getState().addRange(0, 100);
    // addRange auto-selects

    const { container } = render(<ClipTimeline {...defaultProps} />);

    const closeBtn = container.querySelector("[data-testid='clip-close-btn-0']");
    expect(closeBtn).toBeTruthy();
  });
});
