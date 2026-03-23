import type { FilterItem, FilterGroup, MediaFilters } from "./filter-types";

// Legacy filter format support
export type LegacyFilter = {
  search?: string;
  caption?: string;
  excludeShoots?: string[];
  shootId?: string;
  [key: string]: unknown;
};

export const isLegacyFilter = (filter: unknown): filter is LegacyFilter => {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
    return false;
  }

  const obj = filter as Record<string, unknown>;
  return (
    typeof obj.search === "string" ||
    typeof obj.caption === "string" ||
    Array.isArray(obj.excludeShoots) ||
    typeof obj.shootId === "string"
  );
};

export const convertLegacyFilterToGroups = (legacyFilter: LegacyFilter): MediaFilters => {
  const filterGroups: FilterGroup[] = [];
  const includeItems: FilterItem[] = [];
  const excludeItems: FilterItem[] = [];

  // Convert search property
  if (
    legacyFilter.search &&
    typeof legacyFilter.search === "string" &&
    legacyFilter.search.trim()
  ) {
    includeItems.push({
      type: "filename",
      value: legacyFilter.search.trim(),
    });
  }

  // Convert caption property
  if (
    legacyFilter.caption &&
    typeof legacyFilter.caption === "string" &&
    legacyFilter.caption.trim()
  ) {
    includeItems.push({
      type: "caption",
      value: legacyFilter.caption.trim(),
    });
  }

  // Convert shootId property (single shoot to include)
  if (legacyFilter.shootId && typeof legacyFilter.shootId === "string") {
    includeItems.push({
      type: "shoot",
      id: legacyFilter.shootId,
    });
  }

  // Convert excludeShoots property
  if (Array.isArray(legacyFilter.excludeShoots)) {
    legacyFilter.excludeShoots.forEach((shootId) => {
      if (typeof shootId === "string" && shootId.trim()) {
        excludeItems.push({
          type: "shoot",
          id: shootId,
        });
      }
    });
  }

  // Create filter groups
  if (includeItems.length > 0) {
    filterGroups.push({ include: true, items: includeItems });
  }

  if (excludeItems.length > 0) {
    filterGroups.push({ include: false, items: excludeItems });
  }

  return filterGroups;
};

export const sanitizeFilterInput = (filter: unknown): MediaFilters => {
  if (!filter) {
    return [];
  }

  // Handle empty object
  if (
    typeof filter === "object" &&
    !Array.isArray(filter) &&
    Object.keys(filter as object).length === 0
  ) {
    return [];
  }

  // Handle legacy filter format
  if (isLegacyFilter(filter)) {
    return convertLegacyFilterToGroups(filter);
  }

  if (Array.isArray(filter)) {
    return filter;
  }

  return [];
};
