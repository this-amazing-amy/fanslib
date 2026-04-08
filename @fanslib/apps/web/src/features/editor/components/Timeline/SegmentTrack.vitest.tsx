import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { useEditorStore } from "~/stores/editorStore";
import { SegmentTrack } from "./SegmentTrack";

afterEach(cleanup);

beforeEach(() => {
  useEditorStore.getState().reset();
});

describe("SegmentTrack", () => {
  test("renders segment blocks when segments exist", () => {
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

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={150} />);

    const blocks = screen.getAllByTestId("segment-block");
    expect(blocks).toHaveLength(2);
  });

  test("does not render when no segments", () => {
    const { container } = render(<SegmentTrack pixelsPerFrame={2} totalFrames={900} />);
    expect(container.innerHTML).toBe("");
  });

  test("clicking block calls selectSegment", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });

    const segmentId = useEditorStore.getState().segments[0].id;

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("segment-block");
    fireEvent.pointerDown(block, { button: 0, clientX: 50, clientY: 10 });
    fireEvent.pointerUp(block, { clientX: 50, clientY: 10 });

    expect(useEditorStore.getState().selectedSegmentId).toBe(segmentId);
  });

  test("blocks have correct relative widths (longer segment = wider block)", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 30,
    });

    const pixelsPerFrame = 2;
    render(<SegmentTrack pixelsPerFrame={pixelsPerFrame} totalFrames={120} />);

    const blocks = screen.getAllByTestId("segment-block");

    // First segment: 90 frames * 2px = 180px
    expect(blocks[0].style.width).toBe("180px");
    // Second segment: 30 frames * 2px = 60px
    expect(blocks[1].style.width).toBe("60px");
  });

  test("selected block has highlight ring", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });

    const segmentId = useEditorStore.getState().segments[0].id;
    useEditorStore.getState().selectSegment(segmentId);

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("segment-block");
    expect(block.className).toContain("ring");
  });

  test("shows truncated sourceMediaId as label", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "my-source-media-id",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("segment-block");
    expect(block.textContent).toContain("my-source-media-id");
  });

  test("right-click shows context menu with Delete option", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("segment-block");
    fireEvent.contextMenu(block);

    const menu = screen.getByTestId("segment-context-menu");
    expect(menu).toBeDefined();
    expect(menu.textContent).toContain("Delete");
  });

  test("clicking Delete in context menu removes segment", () => {
    useEditorStore.getState().addSegment({
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 90,
    });

    render(<SegmentTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("segment-block");
    fireEvent.contextMenu(block);

    const deleteBtn = screen.getByTestId("segment-delete-btn");
    fireEvent.click(deleteBtn);

    expect(useEditorStore.getState().segments).toHaveLength(0);
  });
});
