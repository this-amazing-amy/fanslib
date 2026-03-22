/// <reference types="@testing-library/jest-dom" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

// Mock the analytics query hook
vi.mock("~/lib/queries/analytics", () => ({
  usePostMediaAnalyticsQuery: vi.fn(),
  useFetchFanslyDataMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock MediaPreview to avoid settings query dependency
vi.mock("~/components/MediaPreview", () => ({
  MediaPreview: () => <div data-testid="media-preview" />,
}));

// Mock visx chart components to avoid rendering complexities in tests
vi.mock("@visx/responsive", () => ({
  ParentSize: ({ children }: { children: (args: { width: number }) => React.ReactNode }) =>
    children({ width: 600 }),
}));

vi.mock("@visx/xychart", () => ({
  XYChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  AreaSeries: () => null,
  Axis: () => null,
  Grid: () => null,
  Tooltip: () => null,
  buildChartTheme: () => ({}),
}));

import { usePostMediaAnalyticsQuery } from "~/lib/queries/analytics";

// Import after mocks
import { PostDetailAnalytics } from "./PostDetailAnalytics";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockUsePostMediaAnalyticsQuery = vi.mocked(usePostMediaAnalyticsQuery);

const makePost = (overrides?: Partial<Parameters<typeof PostDetailAnalytics>[0]["post"]>) => ({
  id: "post-1",
  channel: { typeId: "fansly" as const, id: "ch-1", name: "test", createdAt: new Date() },
  postMedia: [
    {
      id: "pm-1",
      fanslyStatisticsId: "stats-1",
      media: { id: "m-1", type: "image" as const, hash: "abc", width: 100, height: 100 },
    },
  ],
  ...overrides,
});

const sampleDatapoints = [
  { timestamp: 1700000000000, views: 10, interactionTime: 5000 },
  { timestamp: 1700086400000, views: 25, interactionTime: 15000 },
  { timestamp: 1700172800000, views: 50, interactionTime: 30000 },
];

describe("PostDetailAnalytics metric toggle", () => {
  test("renders metric toggle with three options", () => {
    mockUsePostMediaAnalyticsQuery.mockReturnValue({
      data: { datapoints: sampleDatapoints, postDate: "2023-11-14" },
      isLoading: false,
    } as ReturnType<typeof usePostMediaAnalyticsQuery>);

    render(<PostDetailAnalytics post={makePost() as Parameters<typeof PostDetailAnalytics>[0]["post"]} />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: "Views" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Engagement %" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Engagement Time" })).toBeInTheDocument();
  });

  test("Views is the default selected metric", () => {
    mockUsePostMediaAnalyticsQuery.mockReturnValue({
      data: { datapoints: sampleDatapoints, postDate: "2023-11-14" },
      isLoading: false,
    } as ReturnType<typeof usePostMediaAnalyticsQuery>);

    render(<PostDetailAnalytics post={makePost() as Parameters<typeof PostDetailAnalytics>[0]["post"]} />, { wrapper: createWrapper() });

    const viewsButton = screen.getByRole("button", { name: "Views" });
    expect(viewsButton.className).toContain("btn-primary");
  });

  test("clicking a different metric button switches the selection", async () => {
    mockUsePostMediaAnalyticsQuery.mockReturnValue({
      data: { datapoints: sampleDatapoints, postDate: "2023-11-14" },
      isLoading: false,
    } as ReturnType<typeof usePostMediaAnalyticsQuery>);

    render(<PostDetailAnalytics post={makePost() as Parameters<typeof PostDetailAnalytics>[0]["post"]} />, { wrapper: createWrapper() });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Engagement %" }));

    expect(screen.getByRole("button", { name: "Engagement %" }).className).toContain("btn-primary");
    expect(screen.getByRole("button", { name: "Views" }).className).not.toContain("btn-primary");
  });

  test("chart heading updates when metric changes", async () => {
    mockUsePostMediaAnalyticsQuery.mockReturnValue({
      data: { datapoints: sampleDatapoints, postDate: "2023-11-14" },
      isLoading: false,
    } as ReturnType<typeof usePostMediaAnalyticsQuery>);

    render(<PostDetailAnalytics post={makePost() as Parameters<typeof PostDetailAnalytics>[0]["post"]} />, { wrapper: createWrapper() });
    const user = userEvent.setup();

    expect(screen.getByText("Views Over Time")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Engagement %" }));
    expect(screen.getByText("Engagement % Over Time")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Engagement Time" }));
    expect(screen.getByText("Engagement Time (s) Over Time")).toBeInTheDocument();
  });

  test("shows loading state while data is being fetched", () => {
    mockUsePostMediaAnalyticsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof usePostMediaAnalyticsQuery>);

    render(<PostDetailAnalytics post={makePost() as Parameters<typeof PostDetailAnalytics>[0]["post"]} />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
  });

  test("shows empty state with fetch button when no data available", () => {
    mockUsePostMediaAnalyticsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof usePostMediaAnalyticsQuery>);

    render(<PostDetailAnalytics post={makePost() as Parameters<typeof PostDetailAnalytics>[0]["post"]} />, { wrapper: createWrapper() });

    expect(screen.getByText("No analytics data available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fetch Analytics" })).toBeInTheDocument();
  });
});
