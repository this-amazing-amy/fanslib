import type { FilterGroup, FilterItem, MediaFilters } from "@fanslib/types";
import type { SelectQueryBuilder } from "typeorm";
import type { Media } from "./entity";

export const buildFilterItemQuery = (
  item: FilterItem,
  queryBuilder: SelectQueryBuilder<Media>,
  paramIndex: number,
  include: boolean
): void => {
  const operator = include ? "" : "NOT ";

  switch (item.type) {
    case "channel":
      queryBuilder.andWhere(
        `${operator}EXISTS (
          SELECT 1 FROM post_media pm
          JOIN post p ON p.id = pm.postId
          WHERE pm.mediaId = media.id
          AND p.channelId = :channelId${paramIndex}
        )`,
        { [`channelId${paramIndex}`]: item.id }
      );
      break;

    case "subreddit":
      queryBuilder.andWhere(
        `${operator}EXISTS (
          SELECT 1 FROM post_media pm
          JOIN post p ON p.id = pm.postId
          WHERE pm.mediaId = media.id
          AND p.subredditId = :subredditId${paramIndex}
          AND p.status = 'posted'
        )`,
        { [`subredditId${paramIndex}`]: item.id }
      );
      break;

    case "tag":
      queryBuilder.andWhere(
        `${operator}EXISTS (
          SELECT 1 FROM media_tag mt
          WHERE mt.media_id = media.id
          AND mt.tag_definition_id = :tagId${paramIndex}
        )`,
        { [`tagId${paramIndex}`]: item.id }
      );
      break;

    case "shoot":
      queryBuilder.andWhere(
        `${operator}EXISTS (
          SELECT 1 FROM shoot_media sm
          WHERE sm.media_id = media.id
          AND sm.shoot_id = :shootId${paramIndex}
        )`,
        { [`shootId${paramIndex}`]: item.id }
      );
      break;

    case "filename":
      if (include) {
        queryBuilder.andWhere("LOWER(media.name) LIKE LOWER(:filename" + paramIndex + ")", {
          [`filename${paramIndex}`]: `%${item.value}%`,
        });
      } else {
        queryBuilder.andWhere("LOWER(media.name) NOT LIKE LOWER(:filename" + paramIndex + ")", {
          [`filename${paramIndex}`]: `%${item.value}%`,
        });
      }
      break;

    case "caption":
      queryBuilder.andWhere(
        `${operator}EXISTS (
          SELECT 1 FROM post_media pm
          JOIN post p ON p.id = pm.postId
          WHERE pm.mediaId = media.id
          AND LOWER(p.caption) LIKE LOWER(:caption${paramIndex})
        )`,
        { [`caption${paramIndex}`]: `%${item.value}%` }
      );
      break;

    case "posted":
      if (item.value === true) {
        if (include) {
          queryBuilder.andWhere("postMedia.id IS NOT NULL");
        } else {
          queryBuilder.andWhere("postMedia.id IS NULL");
        }
      } else {
        if (include) {
          queryBuilder.andWhere("postMedia.id IS NULL");
        } else {
          queryBuilder.andWhere("postMedia.id IS NOT NULL");
        }
      }
      break;

    case "mediaType":
      if (include) {
        queryBuilder.andWhere("media.type = :mediaType" + paramIndex, {
          [`mediaType${paramIndex}`]: item.value,
        });
      } else {
        queryBuilder.andWhere("media.type != :mediaType" + paramIndex, {
          [`mediaType${paramIndex}`]: item.value,
        });
      }
      break;

    case "createdDateStart":
      if (include) {
        queryBuilder.andWhere("media.fileCreationDate >= :startDate" + paramIndex, {
          [`startDate${paramIndex}`]: item.value,
        });
      } else {
        queryBuilder.andWhere("media.fileCreationDate < :startDate" + paramIndex, {
          [`startDate${paramIndex}`]: item.value,
        });
      }
      break;

    case "createdDateEnd":
      if (include) {
        queryBuilder.andWhere("media.fileCreationDate <= :endDate" + paramIndex, {
          [`endDate${paramIndex}`]: item.value,
        });
      } else {
        queryBuilder.andWhere("media.fileCreationDate > :endDate" + paramIndex, {
          [`endDate${paramIndex}`]: item.value,
        });
      }
      break;

    case "dimensionEmpty":
      queryBuilder.andWhere(
        `${operator}EXISTS (
          SELECT 1 FROM media_tag mt
          WHERE mt.media_id = media.id
          AND mt.dimensionId = :dimensionId${paramIndex}
        )`,
        { [`dimensionId${paramIndex}`]: item.dimensionId }
      );
      break;
  }
};

export const buildFilterGroupQuery = (
  filters: MediaFilters,
  queryBuilder: SelectQueryBuilder<Media>
): void => {
  if (filters?.length === 0) {
    return;
  }

  // eslint-disable-next-line functional/no-let
  let paramIndex = 0;

  filters.forEach((group: FilterGroup) => {
    if (group.items.length === 0) {
      return;
    }

    group.items.forEach((item: FilterItem) => {
      buildFilterItemQuery(item, queryBuilder, paramIndex++, group.include);
    });
  });
};

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

export const filterItemToString = (item: FilterItem): string => {
  switch (item.type) {
    case "channel":
      return `Channel: ${item.id}`;
    case "subreddit":
      return `Subreddit: ${item.id}`;
    case "tag":
      return `Tag: ${item.id}`;
    case "shoot":
      return `Shoot: ${item.id}`;
    case "filename":
      return `Filename: "${item.value}"`;
    case "caption":
      return `Caption: "${item.value}"`;
    case "posted":
      return item.value ? "Posted" : "Unposted";
    case "mediaType":
      return `Media type: ${item.value === "image" ? "Image" : "Video"}`;
    case "createdDateStart":
      return `Created after: ${item.value.toLocaleDateString()}`;
    case "createdDateEnd":
      return `Created before: ${item.value.toLocaleDateString()}`;
    case "dimensionEmpty":
      return `Missing tags from dimension: ${item.dimensionId}`;
    default:
      return "Unknown filter";
  }
};

export const filterGroupToString = (group: FilterGroup): string => {
  if (group.items.length === 0) {
    return "";
  }

  const prefix = group.include ? "Include" : "Exclude";
  const itemStrings = group.items.map(filterItemToString);

  if (itemStrings.length === 1) {
    return `${prefix}: ${itemStrings[0]}`;
  }

  return `${prefix}: ${itemStrings.join(", ")}`;
};

export const mediaFiltersToString = (filters: MediaFilters): string => {
  if (filters?.length === 0) {
    return "No filters";
  }

  const groupStrings = filters.filter((group: FilterGroup) => group.items.length > 0).map(filterGroupToString);

  return groupStrings.join(" | ");
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

export const getFilterItemsCount = (filters: MediaFilters): number => filters.reduce((count: number, group: FilterGroup) => count + group.items.length, 0);

export const hasFilterType = (filters: MediaFilters, type: FilterItem["type"]): boolean => filters.some((group: FilterGroup) => group.items.some((item: FilterItem) => item.type === type));

// Legacy filter format support
type LegacyFilter = {
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
