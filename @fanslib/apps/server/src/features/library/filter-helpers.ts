import type { SelectQueryBuilder } from "typeorm";
import type { Media } from "./entity";
import type { FilterItem, FilterGroup, MediaFilters, FilterContext } from "./filter-types";
import { buildRepostStatusFilter } from "./filter-repost-status";

export type { FilterContext } from "./filter-types";

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
        { [`channelId${paramIndex}`]: item.id },
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
        { [`subredditId${paramIndex}`]: item.id },
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
        { [`tagId${paramIndex}`]: item.id },
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
            )`,
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
        { [`shootId${paramIndex}`]: item.id },
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
        { [`caption${paramIndex}`]: `%${item.value}%` },
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
        { [`dimensionId${paramIndex}`]: item.dimensionId },
      );
      break;

    case "excluded":
      queryBuilder.andWhere(
        include
          ? `media.excluded = :excludedVal${paramIndex}`
          : `media.excluded != :excludedVal${paramIndex}`,
        { [`excludedVal${paramIndex}`]: item.value ? 1 : 0 },
      );
      break;

    case "repostStatus":
      buildRepostStatusFilter(item, queryBuilder, paramIndex, include, context);
      break;
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

// Re-export all functions from submodules for backwards compatibility
export { filterItemToString, filterGroupToString, mediaFiltersToString } from "./filter-display";
export {
  mergeFilterGroups,
  addFilterItemToGroup,
  removeFilterItemFromGroup,
  updateFilterItemInGroup,
  isFilterGroupEmpty,
  getFilterItemsCount,
  hasFilterType,
} from "./filter-group-ops";
export {
  isLegacyFilter,
  convertLegacyFilterToGroups,
  sanitizeFilterInput,
  type LegacyFilter,
} from "./filter-legacy";
