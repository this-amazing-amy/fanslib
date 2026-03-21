/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

vi.mock("~/lib/queries/analytics", () => ({
  useRepostCandidatesQuery: vi.fn(),
}));

import { useRepostCandidatesQuery } from "~/lib/queries/analytics";
import { RepostCandidatesPage } from "./RepostCandidatesPage";

const mockUseRepostCandidatesQuery = vi.mocked(useRepostCandidatesQuery);

const makeCandidates = () => [
  {
    mediaId: "media-1",
    caption: "First candidate",
    totalViews: 500,
    averageEngagementPercent: 35.2,
    averageEngagementSeconds: 45,
    timesPosted: 2,
  },
  {
    mediaId: "media-2",
    caption: "Second candidate",
    totalViews: 800,
    averageEngagementPercent: 60.1,
    averageEngagementSeconds: 90,
    timesPosted: 1,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockQuery = (overrides: { data: any; isLoading: boolean }) =>
  mockUseRepostCandidatesQuery.mockReturnValue(overrides as ReturnType<typeof useRepostCandidatesQuery>);

describe("RepostCandidatesPage", () => {
  test("shows loading state while data is fetching", () => {
    mockQuery({ data: undefined, isLoading: true });

    render(<RepostCandidatesPage />);
    expect(screen.getByText("Loading repost candidates...")).toBeInTheDocument();
  });

  test("shows empty state when no candidates", () => {
    mockQuery({ data: [], isLoading: false });

    render(<RepostCandidatesPage />);
    expect(screen.getByText("No repost candidates found")).toBeInTheDocument();
  });

  test("renders candidate cards with stats and times-posted", () => {
    mockQuery({ data: makeCandidates(), isLoading: false });

    render(<RepostCandidatesPage />);
    expect(screen.getByText("First candidate")).toBeInTheDocument();
    expect(screen.getByText("Second candidate")).toBeInTheDocument();
    expect(screen.getByText("2×")).toBeInTheDocument();
    expect(screen.getByText("1×")).toBeInTheDocument();
  });

  test("displays sort toggle with three options", () => {
    mockQuery({ data: [], isLoading: false });

    render(<RepostCandidatesPage />);
    expect(screen.getByText("Views")).toBeInTheDocument();
    expect(screen.getByText("Engagement %")).toBeInTheDocument();
    expect(screen.getByText("Engagement Time")).toBeInTheDocument();
  });

  test("switching sort refetches with new sort parameter", async () => {
    mockQuery({ data: [], isLoading: false });

    render(<RepostCandidatesPage />);
    const user = userEvent.setup();

    await user.click(screen.getByText("Engagement Time"));

    expect(mockUseRepostCandidatesQuery).toHaveBeenCalledWith("engagementSeconds");
  });

  test("displays all three stat values on each card", () => {
    mockQuery({ data: makeCandidates(), isLoading: false });

    render(<RepostCandidatesPage />);
    // First candidate stats
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("35.2%")).toBeInTheDocument();
    expect(screen.getByText("45s")).toBeInTheDocument();
    // Second candidate stats
    expect(screen.getByText("800")).toBeInTheDocument();
    expect(screen.getByText("60.1%")).toBeInTheDocument();
    expect(screen.getByText("1m 30s")).toBeInTheDocument();
  });
});
