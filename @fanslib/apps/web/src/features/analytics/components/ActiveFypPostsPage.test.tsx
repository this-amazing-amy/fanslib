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

import { useActiveFypPostsQuery } from "~/lib/queries/analytics";
import { ActiveFypPostsPage } from "./ActiveFypPostsPage";

const mockUseActiveFypPostsQuery = vi.mocked(useActiveFypPostsQuery);

const makePosts = () => [
  {
    postMediaId: "pm-1",
    postId: "post-1",
    mediaId: "media-1",
    caption: "First post",
    totalViews: 100,
    averageEngagementPercent: 20.0,
    averageEngagementSeconds: 30,
  },
  {
    postMediaId: "pm-2",
    postId: "post-2",
    mediaId: "media-2",
    caption: "Second post",
    totalViews: 200,
    averageEngagementPercent: 40.5,
    averageEngagementSeconds: 90,
  },
];

// oxlint-disable-next-line typescript/no-explicit-any
const mockQuery = (overrides: { data: any; isLoading: boolean }) =>
  mockUseActiveFypPostsQuery.mockReturnValue(overrides as ReturnType<typeof useActiveFypPostsQuery>);

describe("ActiveFypPostsPage", () => {
  test("shows loading state while data is fetching", () => {
    mockQuery({ data: undefined, isLoading: true });

    render(<ActiveFypPostsPage />);
    expect(screen.getByText("Loading active posts...")).toBeInTheDocument();
  });

  test("shows empty state when no posts", () => {
    mockQuery({ data: [], isLoading: false });

    render(<ActiveFypPostsPage />);
    expect(screen.getByText("No active FYP posts found")).toBeInTheDocument();
  });

  test("renders post cards with stats when data is loaded", () => {
    mockQuery({ data: makePosts(), isLoading: false });

    render(<ActiveFypPostsPage />);
    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.getByText("Second post")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  test("displays sort toggle with three options", () => {
    mockQuery({ data: [], isLoading: false });

    render(<ActiveFypPostsPage />);
    expect(screen.getByText("Views")).toBeInTheDocument();
    expect(screen.getByText("Engagement %")).toBeInTheDocument();
    expect(screen.getByText("Engagement Time")).toBeInTheDocument();
  });

  test("switching sort refetches with new sort parameter", async () => {
    mockQuery({ data: [], isLoading: false });

    render(<ActiveFypPostsPage />);
    const user = userEvent.setup();

    await user.click(screen.getByText("Engagement %"));

    expect(mockUseActiveFypPostsQuery).toHaveBeenCalledWith("engagementPercent");
  });

  test("remove button calls mutation with post ID", async () => {
    mockQuery({ data: makePosts(), isLoading: false });

    render(<ActiveFypPostsPage />);
    const user = userEvent.setup();

    const removeButtons = screen.getAllByText("Remove");
    await user.click(removeButtons[0]);

    expect(mockMutate).toHaveBeenCalledWith("post-1");
  });
});
