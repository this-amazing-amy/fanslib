/// <reference types="@testing-library/jest-dom" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the shoot query hook
vi.mock("~/lib/queries/shoots", () => ({
  useShootQuery: vi.fn(),
}));

// Mock the editor store
const mockSelectSource = vi.fn();
let mockSelectedSourceId: string | null = null;

vi.mock("~/stores/editorStore", () => ({
  useEditorStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ selectedSourceId: mockSelectedSourceId, selectSource: mockSelectSource }),
  ),
}));

import { useShootQuery } from "~/lib/queries/shoots";

// Import after mocks
import { SourceBin } from "./SourceBin";

const mockUseShootQuery = vi.mocked(useShootQuery);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const makeShootData = () => ({
  id: "shoot-1",
  name: "Test Shoot",
  media: [
    { id: "media-1", name: "clip-a.mp4", category: "library" as const, note: null },
    { id: "media-2", name: "clip-b.mp4", category: "library" as const, note: null },
    { id: "media-3", name: "footage-1.mp4", category: "footage" as const, note: "Wide angle establishing shot" },
    { id: "media-4", name: "footage-2.mp4", category: "footage" as const, note: null },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectedSourceId = null;
});

describe("SourceBin", () => {
  test("renders media names from shoot", () => {
    const shoot = makeShootData();
    mockUseShootQuery.mockReturnValue({
      data: shoot,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useShootQuery>);

    render(<SourceBin shootId="shoot-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("clip-a.mp4")).toBeInTheDocument();
    expect(screen.getByText("clip-b.mp4")).toBeInTheDocument();
    expect(screen.getByText("footage-1.mp4")).toBeInTheDocument();
    expect(screen.getByText("footage-2.mp4")).toBeInTheDocument();
  });

  test("renders footage with notes", () => {
    const shoot = makeShootData();
    mockUseShootQuery.mockReturnValue({
      data: shoot,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useShootQuery>);

    render(<SourceBin shootId="shoot-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Wide angle establishing shot")).toBeInTheDocument();
  });

  test("renders section headings", () => {
    const shoot = makeShootData();
    mockUseShootQuery.mockReturnValue({
      data: shoot,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useShootQuery>);

    render(<SourceBin shootId="shoot-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Media")).toBeInTheDocument();
    // "Footage" appears as both heading and badges; just verify it's present
    expect(screen.getAllByText("Footage").length).toBeGreaterThanOrEqual(1);
  });

  test("clicking a source calls selectSource", async () => {
    const shoot = makeShootData();
    mockUseShootQuery.mockReturnValue({
      data: shoot,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useShootQuery>);

    render(<SourceBin shootId="shoot-1" />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByText("clip-a.mp4"));
    expect(mockSelectSource).toHaveBeenCalledWith("media-1");
  });

  test("clicking selected source calls selectSource(null)", async () => {
    mockSelectedSourceId = "media-1";
    const shoot = makeShootData();
    mockUseShootQuery.mockReturnValue({
      data: shoot,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useShootQuery>);

    render(<SourceBin shootId="shoot-1" />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByText("clip-a.mp4"));
    expect(mockSelectSource).toHaveBeenCalledWith(null);
  });

  test("renders footage badge for footage items", () => {
    const shoot = makeShootData();
    mockUseShootQuery.mockReturnValue({
      data: shoot,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useShootQuery>);

    render(<SourceBin shootId="shoot-1" />, { wrapper: createWrapper() });

    // Footage items should have a "Footage" badge
    const badges = screen.getAllByText("Footage");
    // "Footage" heading + 2 footage badges
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });
});
