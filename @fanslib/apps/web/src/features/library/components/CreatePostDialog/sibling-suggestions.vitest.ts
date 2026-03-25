import { describe, expect, test } from "vitest";
import { getSiblingSuggestionMediaId } from "./sibling-suggestions";

type MediaLike = { id: string; package: string | null };

describe("getSiblingSuggestionMediaId", () => {
  test("returns a media id when all selected media share the same non-null package", () => {
    const media: MediaLike[] = [
      { id: "a", package: "main" },
      { id: "b", package: "main" },
    ];

    const result = getSiblingSuggestionMediaId(media);

    expect(result).toBe("a");
  });

  test("returns null when no media is selected", () => {
    expect(getSiblingSuggestionMediaId([])).toBeNull();
  });

  test("returns null when media has null package", () => {
    const media: MediaLike[] = [{ id: "a", package: null }];

    expect(getSiblingSuggestionMediaId(media)).toBeNull();
  });

  test("returns null when media spans multiple packages", () => {
    const media: MediaLike[] = [
      { id: "a", package: "main" },
      { id: "b", package: "bonus" },
    ];

    expect(getSiblingSuggestionMediaId(media)).toBeNull();
  });

  test("returns null when some media has null package and others don't", () => {
    const media: MediaLike[] = [
      { id: "a", package: "main" },
      { id: "b", package: null },
    ];

    expect(getSiblingSuggestionMediaId(media)).toBeNull();
  });

  test("returns media id for single media with non-null package", () => {
    const media: MediaLike[] = [{ id: "solo", package: "main" }];

    expect(getSiblingSuggestionMediaId(media)).toBe("solo");
  });
});
