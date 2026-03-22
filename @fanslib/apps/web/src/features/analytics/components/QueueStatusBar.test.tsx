/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("~/lib/queries/analytics", () => ({
  useQueueStateQuery: vi.fn(),
}));

import { useQueueStateQuery } from "~/lib/queries/analytics";
import { QueueStatusBar } from "./QueueStatusBar";

const mockUseQueueStateQuery = vi.mocked(useQueueStateQuery);

// oxlint-disable-next-line typescript/no-explicit-any
const mockQuery = (overrides: { data: any; isLoading: boolean }) =>
  mockUseQueueStateQuery.mockReturnValue(overrides as ReturnType<typeof useQueueStateQuery>);

describe("QueueStatusBar", () => {
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

  test("clicking status bar again closes the drawer", async () => {
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

    await user.click(screen.getByText(/2 pending/));
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

    await user.click(screen.getByLabelText("Close drawer"));
    expect(screen.queryByText("Fetch Queue")).not.toBeInTheDocument();
  });
});
