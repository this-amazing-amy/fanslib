/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vitest";

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

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("~/stores/mediaHoverStore", () => ({
  useMediaHoverStore: () => vi.fn(),
}));

vi.mock("~/stores/mediaSelectionStore", () => ({
  useMediaSelectionStore: () => vi.fn(),
}));

vi.mock("~/contexts/MediaDragContext", () => ({
  useMediaDrag: () => ({
    startMediaDrag: vi.fn(),
    endMediaDrag: vi.fn(),
  }),
}));

import type { Media } from "@fanslib/server/schemas";
import { SiblingStrip } from "./SiblingStrip";

const makeSibling = (overrides: Partial<Media> = {}): Media => ({
  id: `media-${Date.now()}-${Math.random()}`,
  relativePath: "/test/photo.jpg",
  type: "image",
  name: "photo.jpg",
  size: 1024,
  duration: null,
  redgifsUrl: null,
  description: null,
  excluded: false,
  contentRating: null,
  package: "main",
  role: null,
  isManaged: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  fileCreationDate: new Date(),
  fileModificationDate: new Date(),
  ...overrides,
});

describe("SiblingStrip", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders nothing when siblings is empty", () => {
    const { container } = render(<SiblingStrip siblings={[]} />);

    expect(container.innerHTML).toBe("");
  });

  test("renders an image per sibling", () => {
    const siblings = [
      makeSibling({ id: "sib-1", name: "one.jpg" }),
      makeSibling({ id: "sib-2", name: "two.jpg" }),
    ];

    render(<SiblingStrip siblings={siblings} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
  });

  test("clicking a sibling navigates to its media detail page", async () => {
    const user = userEvent.setup();
    const siblings = [makeSibling({ id: "nav-target", name: "target.jpg" })];

    render(<SiblingStrip siblings={siblings} />);

    await user.click(screen.getByRole("img", { name: "target.jpg" }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/content/library/media/$mediaId",
      params: { mediaId: "nav-target" },
    });
  });

  test("shows content rating and role badges on sibling tiles", () => {
    const siblings = [
      makeSibling({ id: "badge-sib", contentRating: "uc", role: "content" }),
    ];

    render(<SiblingStrip siblings={siblings} />);

    expect(screen.getByText("UC")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
