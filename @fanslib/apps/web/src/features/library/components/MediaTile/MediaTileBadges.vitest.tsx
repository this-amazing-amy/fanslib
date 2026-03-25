/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { MediaTag } from "@fanslib/server/schemas";
import { MediaTileBadges } from "./MediaTileBadges";

const makeStickerTag = (overrides: Partial<MediaTag> = {}): MediaTag => ({
  id: 1,
  mediaId: "media-1",
  tagDefinitionId: 10,
  dimensionId: 1,
  dimensionName: "mood",
  dataType: "categorical",
  tagValue: "happy",
  tagDisplayName: "Happy",
  color: "#ff0000",
  stickerDisplay: "short",
  shortRepresentation: "H",
  numericValue: null,
  booleanValue: null,
  confidence: null,
  source: "manual",
  assignedAt: new Date(),
  ...overrides,
});

describe("MediaTileBadges", () => {
  test("shows content rating badge when contentRating is set", () => {
    render(<MediaTileBadges contentRating="xt" role={null} tags={[]} />);

    expect(screen.getByText("XT")).toBeInTheDocument();
  });

  test("shows role badge when role is set", () => {
    render(<MediaTileBadges contentRating={null} role="solo" tags={[]} />);

    expect(screen.getByText("solo")).toBeInTheDocument();
  });

  test("shows both badges when contentRating and role are set", () => {
    render(<MediaTileBadges contentRating="sg" role="b/g" tags={[]} />);

    expect(screen.getByText("SG")).toBeInTheDocument();
    expect(screen.getByText("b/g")).toBeInTheDocument();
  });

  test.each([
    ["xt", "bg-red-500"],
    ["uc", "bg-orange-500"],
    ["cn", "bg-yellow-500"],
    ["sg", "bg-green-500"],
    ["sf", "bg-blue-500"],
  ] as const)("content rating %s has color class %s", (rating, colorClass) => {
    render(<MediaTileBadges contentRating={rating} role={null} tags={[]} />);

    const badge = screen.getByText(rating.toUpperCase());
    expect(badge.closest("[data-testid='content-rating-badge']")).toHaveClass(colorClass);
  });

  test("falls back to tag badges when neither contentRating nor role is set", () => {
    const tags = [makeStickerTag()];
    render(<MediaTileBadges contentRating={null} role={null} tags={tags} />);

    // Should show tag display name (via shortRepresentation)
    expect(screen.getByText("H")).toBeInTheDocument();
    // Should NOT show any content rating badge
    expect(screen.queryByTestId("content-rating-badge")).not.toBeInTheDocument();
  });

  test("renders nothing when no contentRating, no role, and no displayable tags", () => {
    const { container } = render(<MediaTileBadges contentRating={null} role={null} tags={[]} />);

    expect(container.innerHTML).toBe("");
  });

  test("does not show tag badges when role is set without contentRating", () => {
    const tags = [makeStickerTag()];
    render(<MediaTileBadges contentRating={null} role="solo" tags={tags} />);

    expect(screen.getByText("solo")).toBeInTheDocument();
    expect(screen.queryByText("H")).not.toBeInTheDocument();
  });

  test("does not show tag badges when contentRating is set", () => {
    const tags = [makeStickerTag()];
    render(<MediaTileBadges contentRating="xt" role={null} tags={tags} />);

    expect(screen.getByText("XT")).toBeInTheDocument();
    // Tag badge text should NOT appear
    expect(screen.queryByText("H")).not.toBeInTheDocument();
  });
});
