/// <reference types="@testing-library/jest-dom" />
import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const mockUseVideoPreview = vi.fn();

vi.mock("~/hooks/useVideoPreview", () => ({
  useVideoPreview: (...args: unknown[]) => mockUseVideoPreview(...args),
}));

vi.mock("~/stores/mediaHoverStore", () => ({
  useMediaHoverStore: (
    selector: (s: { hoveredMediaId: string | null; hoveredInstanceId: string | null }) => unknown,
  ) => selector({ hoveredMediaId: "media-1", hoveredInstanceId: "instance-A" }),
}));

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

import { MediaTileVideo } from "./MediaTileVideo";

const baseMedia = {
  id: "media-1",
  name: "test-video.mp4",
  type: "video" as const,
  duration: 60,
  relativePath: "test-video.mp4",
  size: 1000,
  description: null,
  excluded: false,
  redgifsUrl: null,
  contentRating: null,
  package: null,
  role: null,
  category: "library" as const,
  note: null,
  isManaged: false,
  derivedFromId: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  fileCreationDate: new Date("2026-01-01"),
  fileModificationDate: new Date("2026-01-01"),
};

describe("MediaTileVideo", () => {
  test("video element stays hidden when preview is active but video is not ready", () => {
    mockUseVideoPreview.mockReturnValue({
      videoRef: { current: null },
      isVideoReady: false,
    });

    render(
      <MediaTileVideo media={baseMedia} withPreview withDuration={false} hoverKey="instance-A" />,
    );

    const video = document.querySelector("video");
    expect(video).toHaveClass("hidden");
  });

  test("activates preview only when hoverKey matches, not media.id", () => {
    mockUseVideoPreview.mockReturnValue({
      videoRef: { current: null },
      isVideoReady: false,
    });

    // When isVideoReady is false, video is hidden regardless — test with isVideoReady=true
    mockUseVideoPreview.mockReturnValue({
      videoRef: { current: null },
      isVideoReady: true,
    });

    const { container: containerA2 } = render(
      <MediaTileVideo media={baseMedia} withPreview withDuration={false} hoverKey="instance-A" />,
    );
    const videoA = containerA2.querySelector("video");
    expect(videoA).not.toHaveClass("hidden");

    // Render with hoverKey "instance-B" which does NOT match
    const { container: containerB } = render(
      <MediaTileVideo media={baseMedia} withPreview withDuration={false} hoverKey="instance-B" />,
    );
    const videoB = containerB.querySelector("video");
    expect(videoB).toHaveClass("hidden");
  });
});
