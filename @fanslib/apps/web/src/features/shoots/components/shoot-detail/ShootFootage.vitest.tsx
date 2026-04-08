/// <reference types="@testing-library/jest-dom" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { Media } from "@fanslib/server/schemas";

vi.mock("~/lib/queries/library", () => ({
  useUpdateMediaMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteMediaMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("~/lib/media-urls", () => ({
  getMediaThumbnailUrl: (id: string) => `/api/media/${id}/thumbnail`,
}));

vi.mock("~/lib/config", () => ({
  backendBaseUrl: "http://localhost:3000",
}));

import { ShootFootage } from "./ShootFootage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const makeMedia = (overrides: Partial<Media> = {}): Media => ({
  id: `media-${Math.random().toString(36).slice(2)}`,
  relativePath: "/test/clip.mp4",
  type: "video",
  name: "clip.mp4",
  size: 1024,
  duration: 60,
  redgifsUrl: null,
  description: null,
  category: "footage",
  note: null,
  excluded: false,
  contentRating: null,
  package: null,
  role: null,
  isManaged: false,
  derivedFromId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  fileCreationDate: new Date(),
  fileModificationDate: new Date(),
  ...overrides,
});

describe("ShootFootage", () => {
  test("renders empty state when footage array is empty", () => {
    render(<ShootFootage shootId="shoot-1" footage={[]} />, { wrapper });
    expect(screen.getByText("No footage uploaded")).toBeInTheDocument();
  });

  test("renders footage filenames when data exists", () => {
    const footage = [
      makeMedia({ id: "f1", name: "scene-01.mp4" }),
      makeMedia({ id: "f2", name: "scene-02.mp4" }),
    ];
    render(<ShootFootage shootId="shoot-1" footage={footage} />, { wrapper });
    expect(screen.getByText("scene-01.mp4")).toBeInTheDocument();
    expect(screen.getByText("scene-02.mp4")).toBeInTheDocument();
  });

  test("renders upload button", () => {
    render(<ShootFootage shootId="shoot-1" footage={[]} />, { wrapper });
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });
});
