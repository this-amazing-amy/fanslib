/// <reference types="@testing-library/jest-dom" />
import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("~/hooks/useSfwMode", () => ({
  useSfwMode: () => ({
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    getBlurClassName: (cls: string) => cls,
  }),
}));

vi.mock("~/lib/media-urls", () => ({
  getMediaFileUrl: (id: string) => `/api/media/${id}/file`,
  getMediaThumbnailUrl: (id: string) => `/api/media/${id}/thumbnail`,
}));

vi.mock("~/lib/queries/tags", () => ({
  useMediaTagsQuery: () => ({ data: [] }),
}));

import { MediaTileLite } from "./MediaTileLite";

const baseMedia = {
  id: "media-1",
  name: "test-video.mp4",
  type: "video" as const,
  duration: 60,
};

describe("MediaTileLite", () => {
  test("video element stays hidden when preview is active but video has not loaded", () => {
    render(<MediaTileLite media={baseMedia} isActivePreview />);

    const video = document.querySelector("video");
    expect(video).toHaveClass("hidden");
  });
});
