import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { useEditorStore } from "~/stores/editorStore";
import { ExportRegionTrack } from "./ExportRegionTrack";

afterEach(cleanup);

beforeEach(() => {
  useEditorStore.getState().reset();
});

describe("ExportRegionTrack", () => {
  test("renders region blocks when in export mode with regions", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().addExportRegion({ startFrame: 0, endFrame: 450 });
    useEditorStore.getState().addExportRegion({ startFrame: 500, endFrame: 700 });

    render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);

    const blocks = screen.getAllByTestId("export-region-block");
    expect(blocks).toHaveLength(2);
  });

  test("doesn't render when export mode is off", () => {
    useEditorStore.getState().addExportRegion({ startFrame: 0, endFrame: 450 });

    const { container } = render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);
    expect(container.innerHTML).toBe("");
  });

  test("clicking region calls selectExportRegion", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().addExportRegion({ startFrame: 0, endFrame: 450 });

    const regionId = useEditorStore.getState().exportRegions[0].id;

    render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("export-region-block");
    fireEvent.click(block);

    expect(useEditorStore.getState().selectedExportRegionId).toBe(regionId);
  });

  test("pending mark-in shows indicator", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().setExportMarkIn(100);

    render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);

    const indicator = screen.getByTestId("pending-mark-in-indicator");
    expect(indicator).toBeDefined();
    // 100 frames * 2 px/frame = 200px
    expect(indicator.style.left).toBe("200px");
  });

  test("selected region has highlight ring", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().addExportRegion({ startFrame: 0, endFrame: 450 });

    const regionId = useEditorStore.getState().exportRegions[0].id;
    useEditorStore.getState().selectExportRegion(regionId);

    render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("export-region-block");
    expect(block.className).toContain("ring");
  });

  test("region shows frame range label", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().addExportRegion({ startFrame: 0, endFrame: 450 });

    render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);

    const block = screen.getByTestId("export-region-block");
    expect(block.textContent).toContain("0-450");
  });

  test("blocks have correct positioning and width", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().addExportRegion({ startFrame: 100, endFrame: 400 });

    const pixelsPerFrame = 2;
    render(<ExportRegionTrack pixelsPerFrame={pixelsPerFrame} totalFrames={900} />);

    const block = screen.getByTestId("export-region-block");
    // width: (400-100)*2 = 600px, left: 100*2 = 200px
    expect(block.style.width).toBe("600px");
    expect(block.style.left).toBe("200px");
  });

  test("Delete key removes selected region", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().addExportRegion({ startFrame: 0, endFrame: 450 });
    const regionId = useEditorStore.getState().exportRegions[0].id;
    useEditorStore.getState().selectExportRegion(regionId);

    render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);

    fireEvent.keyDown(document, { key: "Delete" });

    expect(useEditorStore.getState().exportRegions).toHaveLength(0);
  });

  test("Escape deselects region", () => {
    useEditorStore.getState().toggleExportRegionMode();
    useEditorStore.getState().addExportRegion({ startFrame: 0, endFrame: 450 });
    const regionId = useEditorStore.getState().exportRegions[0].id;
    useEditorStore.getState().selectExportRegion(regionId);

    render(<ExportRegionTrack pixelsPerFrame={2} totalFrames={900} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(useEditorStore.getState().selectedExportRegionId).toBeNull();
  });
});
