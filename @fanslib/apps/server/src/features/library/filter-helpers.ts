import type { z } from "zod";
import type { SelectQueryBuilder } from "typeorm";
import type { Media } from "./entity";
import type { MediaFilterSchema } from "./schemas/media-filter";
import type { Settings } from "../settings/schemas/settings";

type MediaFilters = z.infer<typeof MediaFilterSchema>;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup['items'][number];

export type FilterContext = {
  channelCooldownHours?: number;
  repostSettings?: Settings["repostSettings"];
};

export const buildFilterItemQuery = (
  item: FilterItem,
  queryBuilder: SelectQueryBuilder<Media>,
  paramIndex: number,
  include: boolean,
  context?: FilterContext,
): void => {
  const operator = include ? "" : "NOT ";

  switch (item.type) {
    case "channel":
      if (!item.id || item.id === "") {
        return;
      }
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
      if (!item.id || item.id === "") {
        return;
      }
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
      if (!item.id || item.id === "") {
        return;
      }
      queryBuilder.andWhere(
        `${operator}EXISTS (
          SELECT 1 FROM media_tag mt
          WHERE mt.mediaId = media.id
          AND mt.tagDefinitionId = :tagId${paramIndex}
        )`,
        { [`tagId${paramIndex}`]: item.id }
      );
      break;

    case "shoot":
      // Empty id means "All shoots"
      // - Include: do nothing (allow all media)
      // - Exclude: show only media NOT in any shoot
      if (!item.id || item.id === "") {
        if (!include) {
          // Exclude "All shoots" = show media not in any shoot
          queryBuilder.andWhere(
            `NOT EXISTS (
              SELECT 1 FROM shoot_media sm
              WHERE sm.media_id = media.id
            )`
          );
        }
        // Include "All shoots" = do nothing (no filter)
        return;
      }
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

    case "posted": {
      const hasPost = "EXISTS (SELECT 1 FROM post_media pm WHERE pm.mediaId = media.id)";
      const noPost = "NOT EXISTS (SELECT 1 FROM post_media pm WHERE pm.mediaId = media.id)";
      const wantsPosted = item.value === true ? include : !include;
      queryBuilder.andWhere(wantsPosted ? hasPost : noPost);
      break;
    }

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
          WHERE mt.mediaId = media.id
          AND mt.dimensionId = :dimensionId${paramIndex}
        )`,
        { [`dimensionId${paramIndex}`]: item.dimensionId }
      );
      break;

    case "repostStatus": {
      const cooldownHours = context?.channelCooldownHours
        ?? context?.repostSettings?.defaultMediaRepostCooldownHours
        ?? 504;
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - cooldownHours);
      const cutoffIso = cutoffDate.toISOString();

      const channelCondition = item.channelId
        ? `AND p.channelId = :rsChannelId${paramIndex}`
        : "";
      const channelParams = item.channelId
        ? { [`rsChannelId${paramIndex}`]: item.channelId }
        : {};

      // Subreddit-specific cooldown — uses the same channel cooldown window.
      // Each subreddit maps to its own channel row, so channelCooldownHours
      // already reflects the per-subreddit mediaRepostCooldownHours.
      const subredditOnCooldownSql = item.subredditId
        ? `EXISTS (
            SELECT 1 FROM post_media pm_sub
            JOIN post p_sub ON p_sub.id = pm_sub.postId
            WHERE pm_sub.mediaId = media.id
            AND p_sub.subredditId = :rsSubredditId${paramIndex}
            ${item.channelId ? `AND p_sub.channelId = :rsSubChannelId${paramIndex}` : ""}
            AND p_sub.date >= :rsSubCutoff${paramIndex}
          )`
        : "";
      const subredditParams = item.subredditId
        ? {
            [`rsSubredditId${paramIndex}`]: item.subredditId,
            ...(item.channelId ? { [`rsSubChannelId${paramIndex}`]: item.channelId } : {}),
            [`rsSubCutoff${paramIndex}`]: cutoffIso,
          }
        : {};

      switch (item.value) {
        case "never_posted":
          queryBuilder.andWhere(
            `${operator}NOT EXISTS (
              SELECT 1 FROM post_media pm
              JOIN post p ON p.id = pm.postId
              WHERE pm.mediaId = media.id
              ${channelCondition}
              AND p.status = 'posted'
            )`,
            channelParams,
          );
          break;

        case "on_cooldown": {
          // On cooldown if within channel cooldown OR within subreddit cooldown
          const channelOnCooldown = `EXISTS (
              SELECT 1 FROM post_media pm
              JOIN post p ON p.id = pm.postId
              WHERE pm.mediaId = media.id
              ${channelCondition}
              AND p.status = 'posted'
              AND p.date >= :rsCutoff${paramIndex}
            )`;

          if (subredditOnCooldownSql) {
            queryBuilder.andWhere(
              `${operator}(${channelOnCooldown} OR ${subredditOnCooldownSql})`,
              { ...channelParams, [`rsCutoff${paramIndex}`]: cutoffIso, ...subredditParams },
            );
          } else {
            queryBuilder.andWhere(
              `${operator}${channelOnCooldown}`,
              { ...channelParams, [`rsCutoff${paramIndex}`]: cutoffIso },
            );
          }
          break;
        }

        case "repostable": {
          // Has been posted AND all posts outside cooldown AND not on subreddit cooldown
          const channelCooldownExpired = `NOT EXISTS (
                SELECT 1 FROM post_media pm2
                JOIN post p2 ON p2.id = pm2.postId
                WHERE pm2.mediaId = media.id
                ${channelCondition.replace(/p\./g, "p2.").replace(/rsChannelId/g, "rsChannelId2_")}
                AND p2.status = 'posted'
                AND p2.date >= :rsCutoff${paramIndex}
              )`;

          const subredditNotOnCooldown = subredditOnCooldownSql
            ? `AND NOT ${subredditOnCooldownSql}`
            : "";

          queryBuilder.andWhere(
            `${operator}(
              EXISTS (
                SELECT 1 FROM post_media pm
                JOIN post p ON p.id = pm.postId
                WHERE pm.mediaId = media.id
                ${channelCondition}
                AND p.status = 'posted'
              )
              AND ${channelCooldownExpired}
              ${subredditNotOnCooldown}
            )`,
            {
              ...channelParams,
              ...(item.channelId ? { [`rsChannelId2_${paramIndex}`]: item.channelId } : {}),
              [`rsCutoff${paramIndex}`]: cutoffIso,
              ...subredditParams,
            },
          );
          break;
        }

        case "still_growing": {
          // Same SQL as repostable — plateau detection is a post-query JS step
          const channelCooldownExpired = `NOT EXISTS (
                SELECT 1 FROM post_media pm2
                JOIN post p2 ON p2.id = pm2.postId
                WHERE pm2.mediaId = media.id
                ${channelCondition.replace(/p\./g, "p2.").replace(/rsChannelId/g, "rsChannelId2_")}
                AND p2.status = 'posted'
                AND p2.date >= :rsCutoff${paramIndex}
              )`;

          const subredditNotOnCooldown = subredditOnCooldownSql
            ? `AND NOT ${subredditOnCooldownSql}`
            : "";

          queryBuilder.andWhere(
            `${operator}(
              EXISTS (
                SELECT 1 FROM post_media pm
                JOIN post p ON p.id = pm.postId
                WHERE pm.mediaId = media.id
                ${channelCondition}
                AND p.status = 'posted'
              )
              AND ${channelCooldownExpired}
              ${subredditNotOnCooldown}
            )`,
            {
              ...channelParams,
              ...(item.channelId ? { [`rsChannelId2_${paramIndex}`]: item.channelId } : {}),
              [`rsCutoff${paramIndex}`]: cutoffIso,
              ...subredditParams,
            },
          );
          break;
        }
      }
      break;
    }
  }
};

export const buildFilterGroupQuery = (
  filters: MediaFilters,
  queryBuilder: SelectQueryBuilder<Media>,
  context?: FilterContext,
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
      buildFilterItemQuery(item, queryBuilder, paramIndex++, group.include, context);
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
    case "repostStatus": {
      const labels: Record<string, string> = {
        never_posted: "Never Posted",
        repostable: "Repostable",
        on_cooldown: "On Cooldown",
        still_growing: "Still Growing",
      };
      return labels[item.value] ?? "Unknown repost status";
    }
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
