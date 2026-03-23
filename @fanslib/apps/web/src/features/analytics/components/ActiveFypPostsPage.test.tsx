/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

const mockMutate = vi.fn();

vi.mock("~/lib/queries/analytics", () => ({
  useActiveFypPostsQuery: vi.fn(),
}));

vi.mock("~/lib/queries/posts", () => ({
  useRemoveFromFypMutation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
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
    const href =
      params?.postId != null ? to.replace(/\$postId/g, params.postId) : to;
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  },
}));

import { useActiveFypPostsQuery } from "~/lib/queries/analytics";
import { ActiveFypPostsPage } from "./ActiveFypPostsPage";

const mockUseActiveFypPostsQuery = vi.mocked(useActiveFypPostsQuery);

const sampleDatapoints = [
  { timestamp: 1000, views: 0, interactionTime: 0 },
  { timestamp: 2000, views: 50, interactionTime: 5000 },
  { timestamp: 3000, views: 100, interactionTime: 10000 },
];

const makePosts = () => [
  {
    postMediaId: "pm-1",
    postId: "post-1",
    fanslyPostId: "fansly-post-111",
    mediaId: "media-1",
    caption: "First post",
    totalViews: 100,
    averageEngagementPercent: 20.0,
    averageEngagementSeconds: 30,
    datapoints: sampleDatapoints,
  },
  {
    postMediaId: "pm-2",
    postId: "post-2",
    fanslyPostId: null,
    mediaId: "media-2",
    caption: "Second post",
    totalViews: 200,
    averageEngagementPercent: 40.5,
    averageEngagementSeconds: 90,
    datapoints: sampleDatapoints,
  },
];

// oxlint-disable-next-line typescript/no-explicit-any
const mockQuery = (overrides: { data: any; isLoading: boolean }) =>
  mockUseActiveFypPostsQuery.mockReturnValue(overrides as ReturnType<typeof useActiveFypPostsQuery>);

const sortProps = { sortBy: "engagementSeconds" as const };

describe("ActiveFypPostsPage", () => {
  test("shows loading state while data is fetching", () => {
    mockQuery({ data: undefined, isLoading: true });

    render(<ActiveFypPostsPage {...sortProps} />);
    expect(screen.getByText("Loading poor performers...")).toBeInTheDocument();
  });

  test("shows empty state when no posts", () => {
    mockQuery({ data: [], isLoading: false });

    render(<ActiveFypPostsPage {...sortProps} />);
    expect(screen.getByText("No poor performers found")).toBeInTheDocument();
  });

  test("passes sortBy to the active posts query", () => {
    mockQuery({ data: [], isLoading: false });

    const { rerender } = render(<ActiveFypPostsPage sortBy="engagementSeconds" />);
    expect(mockUseActiveFypPostsQuery).toHaveBeenCalledWith("engagementSeconds");

    rerender(<ActiveFypPostsPage sortBy="views" />);
    expect(mockUseActiveFypPostsQuery).toHaveBeenLastCalledWith("views");
  });

  test("renders post cards with stats when data is loaded", () => {
    mockQuery({ data: makePosts(), isLoading: false });

    render(<ActiveFypPostsPage {...sortProps} />);
    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.getByText("Second post")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  test("remove flow opens dialog and confirms mutation with post ID", async () => {
    mockQuery({ data: makePosts(), isLoading: false });

    render(<ActiveFypPostsPage {...sortProps} />);
    const user = userEvent.setup();

    const removeButtons = screen.getAllByRole("button", { name: "Stop FYP promotion" });
    await user.click(removeButtons[0]);

    expect(screen.getByRole("heading", { name: "Remove FYP promotion" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /fansly\.com\/post\/fansly-post-111/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "I removed it on Fansly — confirm" }),
    );

    expect(mockMutate).toHaveBeenCalledWith(
      "post-1",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
