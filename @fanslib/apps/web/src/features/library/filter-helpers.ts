import { FilterPresetSchema, MediaFilterSchema } from "@fanslib/server/schemas";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup["items"][number];
type FilterPreset = typeof FilterPresetSchema.static;

export const addFilterItemToGroup = (group: FilterGroup, item: FilterItem): FilterGroup => {
  console.log("addFilterItemToGroup", group, item);
  return {
    ...group,
    items: [...group.items, item],
  };
};

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
  newItem: FilterItem
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
  filters.some((group: FilterGroup) =>
    group.items.some((item: FilterItem) => item.type === type)
  );

export const filtersFromFilterPreset = (preset: FilterPreset): MediaFilters => JSON.parse(preset.filtersJson);
