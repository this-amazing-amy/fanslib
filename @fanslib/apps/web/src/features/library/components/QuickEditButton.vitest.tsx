/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockCreateComposition = vi.fn();
const mockUpdateComposition = vi.fn();
vi.mock("~/lib/queries/compositions", () => ({
  useCreateCompositionMutation: () => ({
    mutateAsync: mockCreateComposition,
    isPending: false,
  }),
  useUpdateCompositionMutation: () => ({
    mutateAsync: mockUpdateComposition,
    isPending: false,
  }),
}));

import type { Media } from "@fanslib/server/schemas";
import { QuickEditButton } from "./QuickEditButton";

afterEach(cleanup);

beforeEach(() => {
  mockNavigate.mockClear();
  mockCreateComposition.mockClear();
  mockUpdateComposition.mockClear();
});

type Shoot = { id: string; name: string };

const makeMedia = (overrides: Partial<Media> & { shoots?: Shoot[] } = {}): Media & {
  shoots: Shoot[];
} => ({
  id: "media-1",
  relativePath: "/test/video.mp4",
  type: "video",
  name: "video.mp4",
  size: 1024,
  duration: 60,
  redgifsUrl: null,
  description: null,
  excluded: false,
  contentRating: null,
  package: null,
  role: null,
  isManaged: false,
  category: "library" as const,
  note: null,
  derivedFromId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  fileCreationDate: new Date(),
  fileModificationDate: new Date(),
  shoots: [{ id: "shoot-1", name: "Test Shoot" }],
  ...overrides,
});

describe("QuickEditButton", () => {
  test("renders button when media has a shoot", () => {
    render(<QuickEditButton media={makeMedia()} />);

    expect(screen.getByRole("button", { name: /quick edit/i })).toBeInTheDocument();
  });

  test("does not render when media has no shoots", () => {
    const { container } = render(<QuickEditButton media={makeMedia({ shoots: [] })} />);

    expect(container.innerHTML).toBe("");
  });

  test("clicking creates composition and navigates", async () => {
    const user = userEvent.setup();
    mockCreateComposition.mockResolvedValue({ id: "comp-1" });
    mockUpdateComposition.mockResolvedValue({});

    render(<QuickEditButton media={makeMedia()} />);

    await user.click(screen.getByRole("button", { name: /quick edit/i }));

    expect(mockCreateComposition).toHaveBeenCalledWith({
      shootId: "shoot-1",
      name: "Quick Edit",
    });

    expect(mockUpdateComposition).toHaveBeenCalledWith({
      id: "comp-1",
      body: {
        segments: [
          expect.objectContaining({
            sourceMediaId: "media-1",
            sourceStartFrame: 0,
            sourceEndFrame: 1800,
          }),
        ],
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/shoots/$shootId/compositions/$compositionId",
      params: { shootId: "shoot-1", compositionId: "comp-1" },
    });
  });
});
