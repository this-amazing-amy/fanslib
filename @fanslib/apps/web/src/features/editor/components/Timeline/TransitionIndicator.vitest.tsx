import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { useEditorStore } from "~/stores/editorStore";
import { SegmentTrack } from "./SegmentTrack";

afterEach(cleanup);

beforeEach(() => {
  useEditorStore.getState().reset();
});

describe("TransitionIndicator", () => {
  test("renders indicator when segment has transition", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    const segments = useEditorStore.getState().segments;
    useEditorStore.getState().addTransition(segments[1].id, {
      type: "crossfade",
      durationFrames: 15,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const indicator = screen.getByTestId("transition-indicator");
    expect(indicator).toBeDefined();
  });

  test("no indicator on first segment", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const indicators = screen.queryAllByTestId("transition-indicator");
    expect(indicators).toHaveLength(0);
  });

  test("indicator has correct width based on durationFrames", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    const segments = useEditorStore.getState().segments;
    const durationFrames = 20;
    const pixelsPerFrame = 2;
    useEditorStore.getState().addTransition(segments[1].id, {
      type: "crossfade",
      durationFrames,
    });

    render(<SegmentTrack pixelsPerFrame={pixelsPerFrame} totalFrames={300} />);

    const indicator = screen.getByTestId("transition-indicator");
    // Width should be durationFrames * pixelsPerFrame
    expect(indicator.style.width).toBe(`${durationFrames * pixelsPerFrame}px`);
  });

  test("no indicator when segment has no transition", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const indicators = screen.queryAllByTestId("transition-indicator");
    expect(indicators).toHaveLength(0);
  });

  test("right-click on segment shows Add Crossfade for non-first segment without transition", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const blocks = screen.getAllByTestId("segment-block");
    // Right-click second segment
    fireEvent.contextMenu(blocks[1]);

    const menu = screen.getByTestId("segment-context-menu");
    expect(menu.textContent).toContain("Add Crossfade");
  });

  test("right-click on segment shows Remove Crossfade when transition exists", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    const segments = useEditorStore.getState().segments;
    useEditorStore.getState().addTransition(segments[1].id, {
      type: "crossfade",
      durationFrames: 15,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const blocks = screen.getAllByTestId("segment-block");
    fireEvent.contextMenu(blocks[1]);

    const menu = screen.getByTestId("segment-context-menu");
    expect(menu.textContent).toContain("Remove Crossfade");
  });

  test("right-click on first segment does NOT show Add Crossfade", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const blocks = screen.getAllByTestId("segment-block");
    // Right-click first segment
    fireEvent.contextMenu(blocks[0]);

    const menu = screen.getByTestId("segment-context-menu");
    expect(menu.textContent).not.toContain("Add Crossfade");
    expect(menu.textContent).not.toContain("Remove Crossfade");
  });

  test("clicking Add Crossfade adds transition to the segment", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const blocks = screen.getAllByTestId("segment-block");
    fireEvent.contextMenu(blocks[1]);

    const addBtn = screen.getByTestId("segment-add-crossfade-btn");
    fireEvent.click(addBtn);

    const segments = useEditorStore.getState().segments;
    expect(segments[1].transition).toBeDefined();
    expect(segments[1].transition?.type).toBe("crossfade");
  });

  test("clicking Remove Crossfade removes transition from the segment", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    const segments = useEditorStore.getState().segments;
    useEditorStore.getState().addTransition(segments[1].id, {
      type: "crossfade",
      durationFrames: 15,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={300} />);

    const blocks = screen.getAllByTestId("segment-block");
    fireEvent.contextMenu(blocks[1]);

    const removeBtn = screen.getByTestId("segment-remove-crossfade-btn");
    fireEvent.click(removeBtn);

    const updatedSegments = useEditorStore.getState().segments;
    expect(updatedSegments[1].transition).toBeUndefined();
  });

  test("indicator position is at the overlap region", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 60,
    });

    const segments = useEditorStore.getState().segments;
    const durationFrames = 30;
    const pixelsPerFrame = 2;
    useEditorStore.getState().addTransition(segments[1].id, {
      type: "crossfade",
      durationFrames,
    });

    render(<SegmentTrack pixelsPerFrame={pixelsPerFrame} totalFrames={300} />);

    const indicator = screen.getByTestId("transition-indicator");
    // Segment A: 0-90 frames. With 30-frame overlap, segment B starts at frame 60.
    // So the overlap region starts at sequenceStartFrame of segment B = 60
    const expectedLeft = 60 * pixelsPerFrame;
    expect(indicator.style.left).toBe(`${expectedLeft}px`);
  });
});
