/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

const mockRefetch = vi.fn();
vi.mock("~/lib/queries/settings", () => ({
  useFanslyCredentialStatusQuery: () => ({
    data: { status: "green", lastUpdated: Date.now() - 3600_000 },
    isLoading: false,
    refetch: mockRefetch,
  }),
}));

vi.mock("~/components/ui/Tooltip", () => ({
  Tooltip: ({
    children,
    content,
  }: {
    children: React.ReactNode;
    content: React.ReactNode;
    placement?: string;
  }) => (
    <div>
      {children}
      <div data-testid="tooltip-content">{content}</div>
    </div>
  ),
}));

import { CredentialStatusBadge } from "./CredentialStatusBadge";

describe("CredentialStatusBadge", () => {
  test("renders a refresh button in the tooltip that calls refetch", async () => {
    const user = userEvent.setup();
    render(<CredentialStatusBadge />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();

    await user.click(refreshButton);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
