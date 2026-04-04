/// <reference types="@testing-library/jest-dom" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vitest";

vi.mock("~/features/analytics/components/QueueStatusBar", () => ({
  QueueStatusBar: () => null,
}));

vi.mock("~/lib/queries/analytics", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useActiveFypPostsQuery: vi.fn(),
    useRepostCandidatesQuery: vi.fn(),
  };
});

import { useActiveFypPostsQuery, useRepostCandidatesQuery } from "~/lib/queries/analytics";
import { FanslyFypRoute } from "./-fyp-page";

const mockUseActiveFypPostsQuery = vi.mocked(useActiveFypPostsQuery);
const mockUseRepostCandidatesQuery = vi.mocked(useRepostCandidatesQuery);

const emptyQuery = {
  data: [] as unknown[],
  isLoading: false,
};

const renderFyp = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <FanslyFypRoute />
    </QueryClientProvider>,
  );
};

describe("FanslyFypRoute", () => {
  beforeEach(() => {
    mockUseActiveFypPostsQuery.mockReturnValue(
      emptyQuery as ReturnType<typeof useActiveFypPostsQuery>,
    );
    mockUseRepostCandidatesQuery.mockReturnValue(
      emptyQuery as ReturnType<typeof useRepostCandidatesQuery>,
    );
  });

  test("renders a single sort control at the top of the page", () => {
    renderFyp();
    expect(screen.getAllByRole("button", { name: "Sort by" })).toHaveLength(1);
  });

  test("sort control lists all three metrics", () => {
    renderFyp();
    const nativeSelect = document.querySelector(
      '[data-testid="hidden-select-container"] select',
    ) as HTMLSelectElement | null;
    if (nativeSelect === null) {
      throw new Error("expected native select");
    }
    const values = [...nativeSelect.options].map((o) => o.value).filter((v) => v !== "");
    expect(values).toEqual(["views", "engagementPercent", "engagementSeconds"]);
  });

  test("changing sort updates both analytics queries", async () => {
    renderFyp();
    const user = userEvent.setup();

    expect(mockUseActiveFypPostsQuery).toHaveBeenCalledWith("engagementSeconds");
    expect(mockUseRepostCandidatesQuery).toHaveBeenCalledWith("engagementSeconds");

    const nativeSelect = document.querySelector(
      '[data-testid="hidden-select-container"] select',
    ) as HTMLSelectElement | null;
    if (nativeSelect === null) {
      throw new Error("expected native select");
    }
    await user.selectOptions(nativeSelect, "engagementPercent");

    expect(mockUseActiveFypPostsQuery).toHaveBeenLastCalledWith("engagementPercent");
    expect(mockUseRepostCandidatesQuery).toHaveBeenLastCalledWith("engagementPercent");
  });
});
