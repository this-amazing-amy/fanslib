import type { FilterItem, FilterGroup, MediaFilters } from "./filter-types";

export const mergeFilterGroups = (groups: FilterGroup[]): FilterGroup[] => {
  const includeItems: FilterItem[] = [];
  const excludeItems: FilterItem[] = [];

  groups.forEach((group) => {
    if (group.include) {
      includeItems.push(...group.items);
    } else {
      excludeItems.push(...group.items);
    }
  });

  const result: FilterGroup[] = [];

  if (includeItems.length > 0) {
    result.push({ include: true, items: includeItems });
  }

  if (excludeItems.length > 0) {
    result.push({ include: false, items: excludeItems });
  }

  return result;
};

export const addFilterItemToGroup = (group: FilterGroup, item: FilterItem): FilterGroup => ({
  ...group,
  items: [...group.items, item],
});

export const removeFilterItemFromGroup = (group: FilterGroup, index: number): FilterGroup => {
  if (index < 0 || index >= group.items.length) {
    return group;
  }

  return {
    ...group,
    items: group.items.filter((_: FilterItem, i: number) => i !== index),
  };
};

export const updateFilterItemInGroup = (
  group: FilterGroup,
  index: number,
  newItem: FilterItem,
): FilterGroup => {
  if (index < 0 || index >= group.items.length) {
    return group;
  }

  return {
    ...group,
    items: group.items.map((item: FilterItem, i: number) => (i === index ? newItem : item)),
  };
};

export const isFilterGroupEmpty = (group: FilterGroup): boolean => group.items.length === 0;

export const getFilterItemsCount = (filters: MediaFilters): number =>
  filters.reduce((count: number, group: FilterGroup) => count + group.items.length, 0);

export const hasFilterType = (filters: MediaFilters, type: FilterItem["type"]): boolean =>
  filters.some((group: FilterGroup) => group.items.some((item: FilterItem) => item.type === type));
