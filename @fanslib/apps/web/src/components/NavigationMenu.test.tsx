/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: { children: React.ReactNode; to: string } & Record<string, unknown>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("jotai", () => ({
  atom: () => ({}),
  useAtom: () => [null, vi.fn()],
}));

import { NavigationMenu } from "./NavigationMenu";

describe("NavigationMenu", () => {
  test("does not render a Matching nav link", () => {
    render(<NavigationMenu isCollapsed={false} />);

    const matchingLink = screen.queryByRole("link", { name: /matching/i });
    expect(matchingLink).not.toBeInTheDocument();
  });

  test("renders Active FYP and Repost Candidates analytics links", () => {
    render(<NavigationMenu isCollapsed={false} />);

    expect(screen.getByRole("link", { name: /active fyp/i })).toHaveAttribute(
      "href",
      "/analytics/fyp/active",
    );
    expect(screen.getByRole("link", { name: /repost candidates/i })).toHaveAttribute(
      "href",
      "/analytics/fyp/repost",
    );
  });
});
