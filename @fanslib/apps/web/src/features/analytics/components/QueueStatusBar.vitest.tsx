/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("~/lib/queries/analytics", () => ({
  useQueueStateQuery: vi.fn(),
  useFetchFanslyDataMutation: vi.fn(),
  useClearNextFetchMutation: vi.fn(),
}));

import { useQueueStateQuery, useFetchFanslyDataMutation, useClearNextFetchMutation } from "~/lib/queries/analytics";
import { QueueStatusBar } from "./QueueStatusBar";

const mockUseQueueStateQuery = vi.mocked(useQueueStateQuery);
const mockUseFetchFanslyDataMutation = vi.mocked(useFetchFanslyDataMutation);
const mockUseClearNextFetchMutation = vi.mocked(useClearNextFetchMutation);

const defaultMutationReturn = {
  mutate: vi.fn(),
  isPending: false,
  error: null,
  variables: undefined,
  isError: false,
  isIdle: true,
  isSuccess: false,
  reset: vi.fn(),
  mutateAsync: vi.fn(),
  status: "idle" as const,
  data: undefined,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  context: undefined,
  submittedAt: 0,
};

// oxlint-disable-next-line typescript/no-explicit-any
const mockQuery = (overrides: { data: any; isLoading: boolean }) =>
  mockUseQueueStateQuery.mockReturnValue(overrides as ReturnType<typeof useQueueStateQuery>);

describe("QueueStatusBar", () => {
  beforeEach(() => {
    // oxlint-disable-next-line typescript/no-explicit-any
    mockUseFetchFanslyDataMutation.mockReturnValue(defaultMutationReturn as any);
    // oxlint-disable-next-line typescript/no-explicit-any
    mockUseClearNextFetchMutation.mockReturnValue(defaultMutationReturn as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders pending count from queue data", () => {
    mockQuery({
      data: {
        totalPending: 5,
        nextFetchAt: new Date(Date.now() + 90 * 60_000).toISOString(),
        items: [],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    expect(screen.getByText(/5 pending/)).toBeInTheDocument();
  });

  test("renders relative time to next fetch", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T12:00:00Z"));

    mockQuery({
      data: {
        totalPending: 3,
        nextFetchAt: "2026-03-22T13:30:00Z",
        items: [],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    expect(screen.getByText(/next in 1h 30m/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  test("does not render when loading", () => {
    mockQuery({ data: undefined, isLoading: true });

    const { container } = render(<QueueStatusBar />);
    expect(container.firstChild).toBeNull();
  });

  test("clicking status bar opens the drawer", async () => {
    mockQuery({
      data: {
        totalPending: 2,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-1",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "Test caption",
            thumbnailUrl: "thumbnail://media-1",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();

    expect(screen.queryByText("Fetch Queue")).not.toBeInTheDocument();

    await user.click(screen.getByText(/2 pending/));

    expect(screen.getByText("Fetch Queue")).toBeInTheDocument();
  });

  test("clicking the sheet backdrop closes the queue", async () => {
    mockQuery({
      data: {
        totalPending: 2,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();

    await user.click(screen.getByText(/2 pending/));
    expect(screen.getByText("Fetch Queue")).toBeInTheDocument();

    const backdrops = [...document.querySelectorAll("div")].filter(
      (el) =>
        typeof el.className === "string" &&
        el.className.includes("bg-black/50") &&
        el.className.includes("inset-0"),
    );
    const backdrop = backdrops[0];
    if (backdrop === undefined) {
      throw new Error("Expected sheet backdrop in document");
    }
    await user.click(backdrop);
    expect(screen.queryByText("Fetch Queue")).not.toBeInTheDocument();
  });

  test("drawer renders queue items with caption", async () => {
    mockQuery({
      data: {
        totalPending: 2,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-1",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "First item caption",
            thumbnailUrl: "thumbnail://media-1",
            overdue: false,
          },
          {
            postMediaId: "pm-2",
            nextFetchAt: new Date(Date.now() + 120_000).toISOString(),
            caption: "Second item caption",
            thumbnailUrl: "thumbnail://media-2",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/2 pending/));

    expect(screen.getByText("First item caption")).toBeInTheDocument();
    expect(screen.getByText("Second item caption")).toBeInTheDocument();
  });

  test("overdue items have distinct visual treatment", async () => {
    mockQuery({
      data: {
        totalPending: 2,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-1",
            nextFetchAt: new Date(Date.now() - 60_000).toISOString(),
            caption: "Overdue item",
            thumbnailUrl: "thumbnail://media-1",
            overdue: true,
          },
          {
            postMediaId: "pm-2",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "Normal item",
            thumbnailUrl: "thumbnail://media-2",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/2 pending/));

    const overdueItem = screen.getByText("Overdue item").closest("li");
    expect(overdueItem).toHaveClass("bg-warning/10");

    expect(screen.getByText(/overdue/)).toBeInTheDocument();
  });

  test("drawer has a close button that closes it", async () => {
    mockQuery({
      data: {
        totalPending: 1,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();

    await user.click(screen.getByText(/1 pending/));
    expect(screen.getByText("Fetch Queue")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Close fetch queue"));
    expect(screen.queryByText("Fetch Queue")).not.toBeInTheDocument();
  });

  test("each queue item has a Fetch Now button", async () => {
    mockQuery({
      data: {
        totalPending: 2,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-1",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "First item",
            thumbnailUrl: "thumbnail://media-1",
            overdue: false,
          },
          {
            postMediaId: "pm-2",
            nextFetchAt: new Date(Date.now() + 120_000).toISOString(),
            caption: "Second item",
            thumbnailUrl: "thumbnail://media-2",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/2 pending/));

    const fetchButtons = screen.getAllByRole("button", { name: "Fetch Now" });
    expect(fetchButtons).toHaveLength(2);
  });

  test("clicking Fetch Now calls mutation with correct postMediaId", async () => {
    const mockMutate = vi.fn();
    // oxlint-disable-next-line typescript/no-explicit-any
    mockUseFetchFanslyDataMutation.mockReturnValue({ ...defaultMutationReturn, mutate: mockMutate } as any);

    mockQuery({
      data: {
        totalPending: 1,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-42",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "Test item",
            thumbnailUrl: "thumbnail://media-42",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/1 pending/));
    await user.click(screen.getByRole("button", { name: "Fetch Now" }));

    expect(mockMutate).toHaveBeenCalledWith({ postMediaId: "pm-42" });
  });

  test("button shows loading state when fetch is pending for that item", async () => {
    mockUseFetchFanslyDataMutation.mockReturnValue({
      ...defaultMutationReturn,
      isPending: true,
      variables: { postMediaId: "pm-1" },
      // oxlint-disable-next-line typescript/no-explicit-any
    } as any);

    mockQuery({
      data: {
        totalPending: 2,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-1",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "Fetching item",
            thumbnailUrl: "thumbnail://media-1",
            overdue: false,
          },
          {
            postMediaId: "pm-2",
            nextFetchAt: new Date(Date.now() + 120_000).toISOString(),
            caption: "Other item",
            thumbnailUrl: "thumbnail://media-2",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/2 pending/));

    // The item being fetched should show "Fetching..." instead of "Fetch Now"
    expect(screen.getByText("Fetching...")).toBeInTheDocument();
    // The other item should still show "Fetch Now"
    expect(screen.getByRole("button", { name: "Fetch Now" })).toBeInTheDocument();
  });

  test("shows error message when fetch fails", async () => {
    mockUseFetchFanslyDataMutation.mockReturnValue({
      ...defaultMutationReturn,
      isError: true,
      error: new Error("Network error"),
      variables: { postMediaId: "pm-1" },
      // oxlint-disable-next-line typescript/no-explicit-any
    } as any);

    mockQuery({
      data: {
        totalPending: 1,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-1",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "Failed item",
            thumbnailUrl: "thumbnail://media-1",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/1 pending/));

    expect(screen.getByText("Fetch failed")).toBeInTheDocument();
  });

  test("drawer stays open after successful fetch", async () => {
    const mockMutate = vi.fn();
    // oxlint-disable-next-line typescript/no-explicit-any
    mockUseFetchFanslyDataMutation.mockReturnValue({ ...defaultMutationReturn, mutate: mockMutate } as any);

    mockQuery({
      data: {
        totalPending: 1,
        nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
        items: [
          {
            postMediaId: "pm-1",
            nextFetchAt: new Date(Date.now() + 60_000).toISOString(),
            caption: "Test item",
            thumbnailUrl: "thumbnail://media-1",
            overdue: false,
          },
        ],
      },
      isLoading: false,
    });

    render(<QueueStatusBar />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/1 pending/));
    await user.click(screen.getByRole("button", { name: "Fetch Now" }));

    // Drawer heading should still be visible
    expect(screen.getByText("Fetch Queue")).toBeInTheDocument();
  });
});
