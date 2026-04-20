/// <reference types="@testing-library/jest-dom" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi, beforeEach } from "vitest";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock the composition query hook
vi.mock("~/lib/queries/compositions", () => ({
  useCompositionByIdQuery: vi.fn(),
  useUpdateCompositionMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock the editor store
const mockHydrate = vi.hoisted(() => vi.fn());
const mockReset = vi.hoisted(() => vi.fn());
vi.mock("~/stores/editorStore", () => {
  const state = {
    hydrate: mockHydrate,
    reset: mockReset,
    operations: [],
    tracks: [{ id: "track-1", name: "Track 1", operations: [] }],
    segments: [],
    selectedSourceId: null,
    selectedOperationId: null,
    selectedTransitionSegmentId: null,
    selectedSegmentId: null,
    canUndo: false,
    canRedo: false,
    setSelectedOperationId: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    addCrop: vi.fn(),
    addCaption: vi.fn(),
    addBlur: vi.fn(),
    addEmoji: vi.fn(),
    addPixelate: vi.fn(),
    addZoom: vi.fn(),
    addTrack: vi.fn(),
    updateOperationById: vi.fn(),
    removeOperationById: vi.fn(),
    moveOperation: vi.fn(),
    reorderSegments: vi.fn(),
    trimSegmentStart: vi.fn(),
    trimSegmentEnd: vi.fn(),
    removeSegment: vi.fn(),
    selectSegment: vi.fn(),
    addTransition: vi.fn(),
    removeTransition: vi.fn(),
    selectTransition: vi.fn(),
    toggleExportRegionMode: vi.fn(),
    exportRegionMode: false,
    exportRegions: [],
    pendingExportMarkIn: null,
    selectedExportRegionId: null,
    setExportMarkIn: vi.fn(),
    commitExportMarkOut: vi.fn(),
    updateExportRegion: vi.fn(),
    removeExportRegion: vi.fn(),
    selectExportRegion: vi.fn(),
  };
  const store = Object.assign(
    vi.fn((selector: (s: Record<string, unknown>) => unknown) => selector(state)),
    {
      subscribe: vi.fn(() => vi.fn()),
      getState: vi.fn(() => ({ ...state, isDirty: false })),
    },
  );
  return { useEditorStore: store };
});

import { useCompositionByIdQuery } from "~/lib/queries/compositions";

// Import after mocks
import { CompositionEditor } from "./CompositionEditor";

const mockUseCompositionByIdQuery = vi.mocked(useCompositionByIdQuery);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const makeComposition = (overrides?: Record<string, unknown>) => ({
  id: "comp-1",
  shootId: "shoot-1",
  name: "My Composition",
  segments: [
    { id: "seg-1", sourceMediaId: "media-1", sourceStartFrame: 0, sourceEndFrame: 150 },
    { id: "seg-2", sourceMediaId: "media-2", sourceStartFrame: 30, sourceEndFrame: 120 },
  ],
  tracks: [{ id: "track-1", name: "Track 1", operations: [] }],
  exportRegions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CompositionEditor", () => {
  test("shows loading state initially", () => {
    mockUseCompositionByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useCompositionByIdQuery>);

    render(<CompositionEditor shootId="shoot-1" compositionId="comp-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId("composition-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading composition...")).toBeInTheDocument();
  });

  test("shows error when composition not found", () => {
    mockUseCompositionByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Composition not found"),
    } as ReturnType<typeof useCompositionByIdQuery>);

    render(<CompositionEditor shootId="shoot-1" compositionId="comp-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId("composition-error")).toBeInTheDocument();
    expect(screen.getByText("Composition not found")).toBeInTheDocument();
  });

  test("renders composition name when data loads", () => {
    const composition = makeComposition();
    mockUseCompositionByIdQuery.mockReturnValue({
      data: composition,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCompositionByIdQuery>);

    render(<CompositionEditor shootId="shoot-1" compositionId="comp-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId("composition-editor")).toBeInTheDocument();
    expect(screen.getByText("My Composition")).toBeInTheDocument();
    expect(screen.getByText(/2 segments/)).toBeInTheDocument();
  });

  test("hydrates the editor store when composition loads", async () => {
    const composition = makeComposition();
    mockUseCompositionByIdQuery.mockReturnValue({
      data: composition,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCompositionByIdQuery>);

    render(<CompositionEditor shootId="shoot-1" compositionId="comp-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockHydrate).toHaveBeenCalledWith({
        tracks: composition.tracks,
        segments: composition.segments,
      });
    });
  });

  test("does not re-hydrate when same composition refetches", async () => {
    const composition = makeComposition();
    const queryResult = {
      data: composition,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCompositionByIdQuery>;

    mockUseCompositionByIdQuery.mockImplementation(() => queryResult);

    const { rerender } = render(
      <CompositionEditor shootId="shoot-1" compositionId="comp-1" />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockHydrate).toHaveBeenCalledTimes(1);
    });

    rerender(<CompositionEditor shootId="shoot-1" compositionId="comp-1" />);

    await waitFor(() => {
      expect(mockHydrate).toHaveBeenCalledTimes(1);
    });
  });

  test("resets the store on unmount", () => {
    mockUseCompositionByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useCompositionByIdQuery>);

    const { unmount } = render(
      <CompositionEditor shootId="shoot-1" compositionId="comp-1" />,
      { wrapper: createWrapper() },
    );

    unmount();
    expect(mockReset).toHaveBeenCalled();
  });
});
