import { describe, expect, test } from "vitest";
import type { Media } from "@fanslib/server/schemas";
import { groupMediaByPackage, getPopulatedColumns } from "./group-media-by-package";

const makeMedia = (overrides: Partial<Media> = {}): Media => {
  const baseMedia: Media = {
    id: `media-${Math.random()}`,
    relativePath: "/test/photo.jpg",
    type: "image",
    name: "photo.jpg",
    size: 1024,
    duration: null,
    redgifsUrl: null,
    description: null,
    excluded: false,
    contentRating: null,
    package: null,
    role: null,
    category: "library",
    note: null,
    isManaged: false,
    derivedFromId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    fileCreationDate: new Date(),
    fileModificationDate: new Date(),
  };
  return {
    ...baseMedia,
    ...overrides,
    category: overrides.category ?? baseMedia.category,
    note: overrides.note ?? baseMedia.note,
  };
};

describe("groupMediaByPackage", () => {
  test("groups media by package name", () => {
    const media = [
      makeMedia({ id: "a", package: "main" }),
      makeMedia({ id: "b", package: "main" }),
      makeMedia({ id: "c", package: "bonus" }),
    ];

    const result = groupMediaByPackage(media);

    expect(result).toHaveLength(2);
    expect(result.map((g) => g.packageName).sort()).toEqual(["bonus", "main"]);

    const mainGroup = result.find((g) => g.packageName === "main");
    const allMainMedia = mainGroup?.rows.flatMap((r) => r.cells.flatMap((c) => c.media));
    expect(allMainMedia).toHaveLength(2);
  });

  test("places media in correct role × contentRating cell", () => {
    const media = [
      makeMedia({ id: "a", package: "main", role: "content", contentRating: "uc" }),
      makeMedia({ id: "b", package: "main", role: "preview", contentRating: "sg" }),
    ];

    const result = groupMediaByPackage(media);
    const pkg = result[0];
    expect(pkg).toBeDefined();

    const contentRow = pkg?.rows.find((r) => r.role === "content");
    const ucCell = contentRow?.cells.find((c) => c.contentRating === "uc");
    expect(ucCell?.media).toHaveLength(1);
    expect(ucCell?.media[0]?.id).toBe("a");

    const previewRow = pkg?.rows.find((r) => r.role === "preview");
    const sgCell = previewRow?.cells.find((c) => c.contentRating === "sg");
    expect(sgCell?.media).toHaveLength(1);
    expect(sgCell?.media[0]?.id).toBe("b");
  });

  test("content rating columns are ordered xt → uc → cn → sg → sf", () => {
    const media = [makeMedia({ package: "main", role: "content", contentRating: "sf" })];

    const result = groupMediaByPackage(media);
    const row = result[0]?.rows[0];
    expect(row).toBeDefined();

    const ratingOrder = row?.cells.slice(0, 5).map((c) => c.contentRating);
    expect(ratingOrder).toEqual(["xt", "uc", "cn", "sg", "sf"]);
  });

  test("media with null package goes into Ungrouped", () => {
    const media = [makeMedia({ id: "a", package: null })];

    const result = groupMediaByPackage(media);

    expect(result).toHaveLength(1);
    expect(result[0]?.packageName).toBe("Ungrouped");
  });

  test("media with null role uses default row label", () => {
    const media = [makeMedia({ id: "a", package: "main", role: null, contentRating: "uc" })];

    const result = groupMediaByPackage(media);
    const row = result[0]?.rows[0];

    expect(row?.role).toBe("—");
    const ucCell = row?.cells.find((c) => c.contentRating === "uc");
    expect(ucCell?.media).toHaveLength(1);
  });

  test("media with null contentRating goes into unrated column", () => {
    const media = [makeMedia({ id: "a", package: "main", role: "content", contentRating: null })];

    const result = groupMediaByPackage(media);
    const row = result[0]?.rows[0];

    const unratedCell = row?.cells.find((c) => c.contentRating === null);
    expect(unratedCell?.media).toHaveLength(1);
    expect(unratedCell?.media[0]?.id).toBe("a");
  });

  test("getPopulatedColumns returns only columns with media", () => {
    const media = [
      makeMedia({ package: "main", role: "content", contentRating: "uc" }),
      makeMedia({ package: "main", role: "preview", contentRating: "sf" }),
    ];

    const groups = groupMediaByPackage(media);
    const columns = getPopulatedColumns(groups);

    expect(columns).toEqual(["uc", "sf"]);
  });

  test("getPopulatedColumns includes null when unrated media exists", () => {
    const media = [makeMedia({ package: "main", role: "content", contentRating: null })];

    const groups = groupMediaByPackage(media);
    const columns = getPopulatedColumns(groups);

    expect(columns).toEqual([null]);
  });

  test("returns empty array for empty media input", () => {
    expect(groupMediaByPackage([])).toEqual([]);
  });

  test("getPopulatedColumns returns empty for empty groups", () => {
    expect(getPopulatedColumns([])).toEqual([]);
  });
});
