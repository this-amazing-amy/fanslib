type ShootLike = { id: string; name: string; shootDate: Date };

type FilterAndSortOptions = {
  search: string;
  sortBy: "date" | "alphabetical";
};

export const filterAndSortShoots = <T extends ShootLike>(
  shoots: T[],
  options: FilterAndSortOptions,
): T[] => {
  const filtered = options.search
    ? shoots.filter((s) => s.name.toLowerCase().includes(options.search.toLowerCase()))
    : shoots;

  return [...filtered].sort((a, b) => {
    if (options.sortBy === "alphabetical") {
      return a.name.localeCompare(b.name);
    }
    return new Date(b.shootDate).getTime() - new Date(a.shootDate).getTime();
  });
};
