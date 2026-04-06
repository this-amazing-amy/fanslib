/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useClipStore } from "~/stores/clipStore";
import { useEditorStore } from "~/stores/editorStore";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ history: { back: vi.fn() } }),
}));

vi.mock("~/lib/queries/assets", () => ({
  useAssetsQuery: () => ({ data: [] }),
}));

vi.mock("./ExportDialog", () => ({
  ExportDialog: () => null,
}));

import { EditorToolbar } from "./EditorToolbar";

afterEach(cleanup);

beforeEach(() => {
  useClipStore.getState().reset();
  useEditorStore.getState().reset();
});

const TRANSFORM_TOOL_LABELS = [
  "Crop",
  "Caption",
  "Watermark",
  "Blur region",
  "Emoji overlay",
  "Pixelate",
  "Zoom",
];

describe("EditorToolbar — transform tools alongside clip regions", () => {
  test("transform tool buttons remain enabled when clip ranges exist", () => {
    useClipStore.getState().addRange(0, 100);
    expect(useClipStore.getState().ranges).toHaveLength(1);

    render(<EditorToolbar mediaId="test-media" />);

    TRANSFORM_TOOL_LABELS.forEach((label) => {
      const button = screen.getByRole("button", { name: label });
      expect(button).not.toBeDisabled();
    });
  });

  test("transform tool buttons remain enabled when clip mode is active", () => {
    useClipStore.getState().toggleClipMode();
    expect(useClipStore.getState().clipMode).toBe(true);

    render(<EditorToolbar mediaId="test-media" />);

    TRANSFORM_TOOL_LABELS.forEach((label) => {
      const button = screen.getByRole("button", { name: label });
      expect(button).not.toBeDisabled();
    });
  });

  test("undo/redo buttons not disabled by clip state when history exists", () => {
    useEditorStore.getState().addCaption();
    expect(useEditorStore.getState().canUndo).toBe(true);

    useClipStore.getState().toggleClipMode();
    useClipStore.getState().addRange(0, 100);

    render(<EditorToolbar mediaId="test-media" />);

    const undoBtn = screen.getByRole("button", { name: "Undo" });
    expect(undoBtn).not.toBeDisabled();
  });

  test("scissors button shows primary variant when clip mode active", () => {
    useClipStore.getState().toggleClipMode();

    render(<EditorToolbar mediaId="test-media" />);

    const scissorsBtn = screen.getByRole("button", { name: "Clip mode" });
    expect(scissorsBtn.className).toContain("primary");
  });

  test("scissors button shows ghost variant when clip mode inactive", () => {
    render(<EditorToolbar mediaId="test-media" />);

    const scissorsBtn = screen.getByRole("button", { name: "Clip mode" });
    expect(scissorsBtn.className).toContain("ghost");
  });
});
