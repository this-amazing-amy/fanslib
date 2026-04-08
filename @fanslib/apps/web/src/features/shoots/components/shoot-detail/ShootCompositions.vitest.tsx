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
  useNavigate: () => vi.fn(),
}));

const mockCompositionsQuery = {
  data: undefined as unknown[] | undefined,
  isLoading: false,
  error: null as Error | null,
};

vi.mock("~/lib/queries/compositions", () => ({
  useCompositionsByShootQuery: () => mockCompositionsQuery,
  useCreateCompositionMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateCompositionMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteCompositionMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

import { ShootCompositions } from "./ShootCompositions";

describe("ShootCompositions", () => {
  test("renders empty state when no compositions", () => {
    mockCompositionsQuery.data = [];
    mockCompositionsQuery.isLoading = false;
    mockCompositionsQuery.error = null;

    render(<ShootCompositions shootId="shoot-1" />);

    expect(screen.getByText("No compositions yet")).toBeInTheDocument();
  });

  test("renders composition names when data exists", () => {
    mockCompositionsQuery.data = [
      {
        id: "comp-1",
        shootId: "shoot-1",
        name: "Main Edit",
        segments: [],
        tracks: [],
        exportRegions: [],
        createdAt: "2026-03-15T12:00:00Z",
        updatedAt: "2026-03-15T12:00:00Z",
      },
      {
        id: "comp-2",
        shootId: "shoot-1",
        name: "Alternate Cut",
        segments: [{ id: "s1" }, { id: "s2" }],
        tracks: [],
        exportRegions: [],
        createdAt: "2026-03-16T12:00:00Z",
        updatedAt: "2026-03-16T12:00:00Z",
      },
    ];
    mockCompositionsQuery.isLoading = false;
    mockCompositionsQuery.error = null;

    render(<ShootCompositions shootId="shoot-1" />);

    expect(screen.getByText("Main Edit")).toBeInTheDocument();
    expect(screen.getByText("Alternate Cut")).toBeInTheDocument();
  });

  test('renders "New Composition" button', () => {
    mockCompositionsQuery.data = [];
    mockCompositionsQuery.isLoading = false;
    mockCompositionsQuery.error = null;

    render(<ShootCompositions shootId="shoot-1" />);

    expect(screen.getByRole("button", { name: /new composition/i })).toBeInTheDocument();
  });
});
