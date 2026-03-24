/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: { children: React.ReactNode; to: string; params?: Record<string, string> } & Record<string, unknown>) => (
    <a href={params ? to.replace("$id", params.id ?? "") : to} {...props}>
      {children}
    </a>
  ),
}));

// Mutable mock state
const mockState = {
  linkedSchedules: [] as Array<{ id: string; name: string; emoji: string | null; color: string | null; type: string; postsPerTimeframe: number | null; preferredDays: null; preferredTimes: null; mediaFilters: null; scheduleChannels: never[] }>,
  allSchedules: [] as Array<{ id: string; name: string; emoji: string | null; color: string | null; type: string; postsPerTimeframe: number | null; preferredDays: null; preferredTimes: null; mediaFilters: null; scheduleChannels: never[] }>,
  isLoadingLinked: false,
};

const mockLinkMutateAsync = vi.fn();
const mockUnlinkMutateAsync = vi.fn();

vi.mock("~/lib/queries/content-schedules", () => ({
  useContentSchedulesByChannelQuery: () => ({
    data: mockState.linkedSchedules,
    isLoading: mockState.isLoadingLinked,
  }),
  useContentSchedulesQuery: () => ({
    data: mockState.allSchedules,
    isLoading: false,
  }),
  useLinkChannelToScheduleMutation: () => ({
    mutateAsync: mockLinkMutateAsync,
    isPending: false,
  }),
  useUnlinkChannelFromScheduleMutation: () => ({
    mutateAsync: mockUnlinkMutateAsync,
    isPending: false,
  }),
}));

// Mock ContentScheduleBadge for simpler assertions
vi.mock("~/components/ContentScheduleBadge", () => ({
  ContentScheduleBadge: ({ name, emoji }: { name: string; emoji?: string | null }) => (
    <span data-testid={`schedule-badge-${name}`}>
      {emoji} {name}
    </span>
  ),
}));

import { ChannelScheduleLinker } from "./ChannelScheduleLinker";

const makeSchedule = (id: string, name: string, emoji: string | null = null) => ({
  id,
  name,
  emoji,
  color: "#6366f1",
  type: "daily" as const,
  postsPerTimeframe: 1,
  preferredDays: null as null,
  preferredTimes: null as null,
  mediaFilters: null as null,
  scheduleChannels: [] as never[],
});

describe("ChannelScheduleLinker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.linkedSchedules = [
      makeSchedule("sched-1", "Daily Posts", "📅"),
      makeSchedule("sched-2", "Weekly Recap", "📰"),
    ];
    mockState.allSchedules = [
      ...mockState.linkedSchedules,
      makeSchedule("sched-3", "Monthly Special", "🎉"),
    ];
    mockState.isLoadingLinked = false;
  });

  test("shows linked schedule badges for the channel", () => {
    render(<ChannelScheduleLinker channelId="chan-1" />);

    expect(screen.getByTestId("schedule-badge-Daily Posts")).toBeInTheDocument();
    expect(screen.getByTestId("schedule-badge-Weekly Recap")).toBeInTheDocument();
  });

  test("shows empty state when no schedules are linked", () => {
    mockState.linkedSchedules = [];

    render(<ChannelScheduleLinker channelId="chan-1" />);

    expect(screen.getByText(/no schedules linked/i)).toBeInTheDocument();
  });

  test("badge links navigate to /schedules/:id", () => {
    render(<ChannelScheduleLinker channelId="chan-1" />);

    const link = screen.getByTestId("schedule-badge-Daily Posts").closest("a");
    expect(link).toHaveAttribute("href", "/schedules/sched-1");
  });

  test("link schedule dropdown shows only unlinked schedules", async () => {
    render(<ChannelScheduleLinker channelId="chan-1" />);

    const linkBtn = screen.getByRole("button", { name: /link schedule/i });
    await userEvent.click(linkBtn);

    // Should show "Monthly Special" (unlinked) in dropdown
    const dropdownBadges = screen.getAllByTestId("schedule-badge-Monthly Special");
    expect(dropdownBadges.length).toBeGreaterThanOrEqual(1);

    // "Daily Posts" and "Weekly Recap" should only appear once (as linked badges, not in dropdown)
    expect(screen.getAllByTestId("schedule-badge-Daily Posts")).toHaveLength(1);
    expect(screen.getAllByTestId("schedule-badge-Weekly Recap")).toHaveLength(1);
  });

  test("selecting from dropdown calls link mutation", async () => {
    mockLinkMutateAsync.mockResolvedValue({});

    render(<ChannelScheduleLinker channelId="chan-1" />);

    const linkBtn = screen.getByRole("button", { name: /link schedule/i });
    await userEvent.click(linkBtn);

    const badge = screen.getByTestId("schedule-badge-Monthly Special");
    const option = badge.closest("button") ?? badge;
    await userEvent.click(option);

    expect(mockLinkMutateAsync).toHaveBeenCalledWith({
      scheduleId: "sched-3",
      channelId: "chan-1",
    });
  });

  test("link button shows even in empty state", async () => {
    mockState.linkedSchedules = [];

    render(<ChannelScheduleLinker channelId="chan-1" />);

    expect(screen.getByText(/no schedules linked/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /link schedule/i })).toBeInTheDocument();
  });

  test("unlink button calls unlink mutation for that schedule", async () => {
    render(<ChannelScheduleLinker channelId="chan-1" />);

    const unlinkBtn = screen.getByRole("button", { name: /unlink daily posts/i });

    await userEvent.click(unlinkBtn);

    expect(mockUnlinkMutateAsync).toHaveBeenCalledWith({
      scheduleId: "sched-1",
      channelId: "chan-1",
    });
  });
});
