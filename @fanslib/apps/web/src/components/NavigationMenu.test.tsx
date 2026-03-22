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
  test("renders Fansly nav link pointing to /fansly/fyp", () => {
    render(<NavigationMenu isCollapsed={false} />);

    const fanslyLink = screen.getByRole("link", { name: /fansly/i });
    expect(fanslyLink).toHaveAttribute("href", "/fansly/fyp");
  });

  test("does not render Analytics or Matching nav links", () => {
    render(<NavigationMenu isCollapsed={false} />);

    expect(screen.queryByText(/analytics/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/matching/i)).not.toBeInTheDocument();
  });
});
