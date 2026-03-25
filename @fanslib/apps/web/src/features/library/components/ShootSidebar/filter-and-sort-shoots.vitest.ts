import { describe, expect, test } from "vitest";
import { filterAndSortShoots } from "./filter-and-sort-shoots";

type ShootLike = { id: string; name: string; shootDate: Date };

const makeShoot = (overrides: Partial<ShootLike> & { id: string; name: string }): ShootLike => ({
  shootDate: new Date("2024-01-01"),
  ...overrides,
});

describe("filterAndSortShoots", () => {
  test("sorts by date newest-first by default", () => {
    const shoots = [
      makeShoot({ id: "a", name: "Old", shootDate: new Date("2024-01-01") }),
      makeShoot({ id: "b", name: "New", shootDate: new Date("2024-06-01") }),
      makeShoot({ id: "c", name: "Mid", shootDate: new Date("2024-03-01") }),
    ];

    const result = filterAndSortShoots(shoots, { search: "", sortBy: "date" });

    expect(result.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  test("sorts alphabetically when sortBy is alphabetical", () => {
    const shoots = [
      makeShoot({ id: "a", name: "Charlie" }),
      makeShoot({ id: "b", name: "Alpha" }),
      makeShoot({ id: "c", name: "Bravo" }),
    ];

    const result = filterAndSortShoots(shoots, { search: "", sortBy: "alphabetical" });

    expect(result.map((s) => s.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  test("filters by name case-insensitively", () => {
    const shoots = [
      makeShoot({ id: "a", name: "Spring 2024" }),
      makeShoot({ id: "b", name: "Summer 2024" }),
      makeShoot({ id: "c", name: "spring bonus" }),
    ];

    const result = filterAndSortShoots(shoots, { search: "spring", sortBy: "date" });

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id).sort()).toEqual(["a", "c"]);
  });

  test("returns empty array when no shoots match search", () => {
    const shoots = [makeShoot({ id: "a", name: "Summer" })];

    const result = filterAndSortShoots(shoots, { search: "winter", sortBy: "date" });

    expect(result).toEqual([]);
  });

  test("returns empty array for empty input", () => {
    expect(filterAndSortShoots([], { search: "", sortBy: "date" })).toEqual([]);
  });
});
