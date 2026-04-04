/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("~/lib/queries/analytics", () => ({
  useRepostCandidatesQuery: vi.fn(),
}));

vi.mock("~/lib/queries/channels", () => ({
  useChannelsQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock("~/lib/queries/library", () => ({
  useMediaQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("~/features/library/components/CreatePostDialog", () => ({
  CreatePostDialog: () => null,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    className,
    "aria-label": ariaLabel,
    children,
  }: {
    to: string;
    params?: { postId: string };
    className?: string;
    "aria-label"?: string;
    children?: React.ReactNode;
  }) => {
    const href = params?.postId != null ? to.replace(/\$postId/g, params.postId) : to;
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  },
}));

import { useRepostCandidatesQuery } from "~/lib/queries/analytics";
import { RepostCandidatesPage } from "./RepostCandidatesPage";

const mockUseRepostCandidatesQuery = vi.mocked(useRepostCandidatesQuery);

const sampleDatapoints = [
  { timestamp: 1_000_000, views: 100, interactionTime: 5_000 },
  { timestamp: 2_000_000, views: 250, interactionTime: 12_000 },
  { timestamp: 3_000_000, views: 500, interactionTime: 25_000 },
];

const makeCandidates = () => [
  {
    mediaId: "media-1",
    postId: "post-1",
    caption: "First candidate",
    totalViews: 500,
    averageEngagementPercent: 35.2,
    averageEngagementSeconds: 45,
    timesPosted: 2,
    datapoints: sampleDatapoints,
  },
  {
    mediaId: "media-2",
    postId: "post-2",
    caption: "Second candidate",
    totalViews: 800,
    averageEngagementPercent: 60.1,
    averageEngagementSeconds: 90,
    timesPosted: 1,
    datapoints: sampleDatapoints,
  },
];

// oxlint-disable-next-line typescript/no-explicit-any
const mockQuery = (overrides: { data: any; isLoading: boolean }) =>
  mockUseRepostCandidatesQuery.mockReturnValue(
    overrides as ReturnType<typeof useRepostCandidatesQuery>,
  );

const sortProps = { sortBy: "engagementSeconds" as const };

describe("RepostCandidatesPage", () => {
  test("shows loading state while data is fetching", () => {
    mockQuery({ data: undefined, isLoading: true });

    render(<RepostCandidatesPage {...sortProps} />);
    expect(screen.getByText("Loading repostables...")).toBeInTheDocument();
  });

  test("shows empty state when no candidates", () => {
    mockQuery({ data: [], isLoading: false });

    render(<RepostCandidatesPage {...sortProps} />);
    expect(screen.getByText("No repostables found")).toBeInTheDocument();
  });

  test("passes sortBy to the repostables query", () => {
    mockQuery({ data: [], isLoading: false });

    const { rerender } = render(<RepostCandidatesPage sortBy="engagementSeconds" />);
    expect(mockUseRepostCandidatesQuery).toHaveBeenCalledWith("engagementSeconds");

    rerender(<RepostCandidatesPage sortBy="views" />);
    expect(mockUseRepostCandidatesQuery).toHaveBeenLastCalledWith("views");
  });

  test("renders candidate cards with stats and times-posted", () => {
    mockQuery({ data: makeCandidates(), isLoading: false });

    render(<RepostCandidatesPage {...sortProps} />);
    expect(screen.getByText("First candidate")).toBeInTheDocument();
    expect(screen.getByText("Second candidate")).toBeInTheDocument();
    expect(screen.getByLabelText("Posted 2 times")).toBeInTheDocument();
    expect(screen.getByLabelText("Posted 1 time")).toBeInTheDocument();
  });

  test("displays all three stat values on each card", () => {
    mockQuery({ data: makeCandidates(), isLoading: false });

    render(<RepostCandidatesPage {...sortProps} />);
    // First candidate stats
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("35.2%")).toBeInTheDocument();
    expect(screen.getByText("45.0s")).toBeInTheDocument();
    // Second candidate stats
    expect(screen.getByText("800")).toBeInTheDocument();
    expect(screen.getByText("60.1%")).toBeInTheDocument();
    expect(screen.getByText("1m 30.0s")).toBeInTheDocument();
  });

  test("renders a create-post button on each candidate card", () => {
    mockQuery({ data: makeCandidates(), isLoading: false });

    render(<RepostCandidatesPage {...sortProps} />);
    expect(screen.getAllByRole("button", { name: "Create post" })).toHaveLength(2);
  });

  test("renders inline sparklines when datapoints are present", () => {
    mockQuery({ data: makeCandidates(), isLoading: false });

    const { container } = render(<RepostCandidatesPage {...sortProps} />);
    expect(container.querySelectorAll(".recharts-line-curve")).toHaveLength(2);
  });
});
