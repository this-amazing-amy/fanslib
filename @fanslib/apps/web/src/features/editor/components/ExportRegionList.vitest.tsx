/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useEditorStore } from "~/stores/editorStore";

import { ExportRegionList } from "./ExportRegionList";

afterEach(cleanup);

beforeEach(() => {
  useEditorStore.getState().reset();
});

describe("ExportRegionList", () => {
  test("shows single metadata form when no export regions", () => {
    render(<ExportRegionList />);

    // Should show metadata fields but no region header
    expect(screen.getByLabelText("Package")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByLabelText("Content Rating")).toBeInTheDocument();
    expect(screen.getByLabelText("Quality")).toBeInTheDocument();
    expect(screen.queryByText(/Region:/)).not.toBeInTheDocument();
  });

  test("shows one metadata form per region when regions exist", () => {
    const store = useEditorStore.getState();
    store.addExportRegion({ startFrame: 0, endFrame: 450 });
    store.addExportRegion({ startFrame: 500, endFrame: 900 });

    render(<ExportRegionList />);

    const packageInputs = screen.getAllByLabelText("Package");
    expect(packageInputs).toHaveLength(2);

    const roleInputs = screen.getAllByLabelText("Role");
    expect(roleInputs).toHaveLength(2);
  });

  test("region header shows frame range", () => {
    const store = useEditorStore.getState();
    store.addExportRegion({ startFrame: 0, endFrame: 450 });
    store.addExportRegion({ startFrame: 500, endFrame: 900 });

    render(<ExportRegionList />);

    expect(screen.getByText("Region: 0–450")).toBeInTheDocument();
    expect(screen.getByText("Region: 500–900")).toBeInTheDocument();
  });

  test("changing package field calls updateExportRegion", () => {
    const store = useEditorStore.getState();
    store.addExportRegion({ startFrame: 0, endFrame: 450 });
    const updateSpy = vi.spyOn(useEditorStore.getState(), "updateExportRegion");

    render(<ExportRegionList />);

    const packageInput = screen.getByLabelText("Package");
    fireEvent.change(packageInput, { target: { value: "premium" } });
    fireEvent.blur(packageInput);

    const regionId = useEditorStore.getState().exportRegions[0].id;
    expect(updateSpy).toHaveBeenCalledWith(regionId, { package: "premium" });
  });
});
