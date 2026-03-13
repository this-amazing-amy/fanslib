/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { z } from "zod";
import { db } from "../../../../lib/db";
import { paginatedResponseSchema } from "../../../../lib/pagination";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";
import { buildFilterGroupQuery, type FilterContext } from "../../filter-helpers";
import { MediaFilterSchema } from "../../schemas/media-filter";
import { MediaSortSchema } from "../../schemas/media-sort";
import { Channel } from "../../../channels/entity";
import { getRecentlyPostedMediaIds } from "./get-recently-posted-media-ids";
import { getMergedFiltersForSlot } from "../../../content-schedules/operations/get-merged-filters";
import { loadSettings } from "../../../settings/operations/setting/load";

export const FetchAllMediaRequestBodySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  filters: MediaFilterSchema.optional(),
  sort: MediaSortSchema.optional(),
  excludeMediaIds: z.array(z.string()).optional(),
  channelId: z.string().optional(),
  scheduleId: z.string().optional(),
  applyRepostCooldown: z.boolean().optional(),
  autoApplyFilters: z.boolean().optional(),
});

export const FetchAllMediaResponseSchema = paginatedResponseSchema(MediaSchema);

const hasRepostStatusFilter = (filters?: z.infer<typeof MediaFilterSchema>): boolean =>
  filters?.some((group) => group.items.some((item) => item.type === "repostStatus")) ?? false;

const buildFilterContext = async (
  channelId?: string,
): Promise<FilterContext> => {
  const settings = await loadSettings();
  const context: FilterContext = {
    repostSettings: settings.repostSettings,
  };

  if (channelId) {
    const database = await db();
    const channel = await database.manager.findOne(Channel, {
      where: { id: channelId },
    });
    if (channel?.mediaRepostCooldownHours) {
      context.channelCooldownHours = channel.mediaRepostCooldownHours;
    }
  }

  return context;
};

export const fetchAllMedia = async (
  params?: z.infer<typeof FetchAllMediaRequestBodySchema>,
): Promise<z.infer<typeof FetchAllMediaResponseSchema>> => {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const skip = (page - 1) * limit;

  const database = await db();
  const queryBuilder = database.manager
    .createQueryBuilder(Media, "media");

  // Build filter context if any repostStatus filters are present
  const needsContext = hasRepostStatusFilter(params?.filters);
  const filterContext = needsContext
    ? await buildFilterContext(params?.channelId)
    : undefined;

  // Auto-apply merged filters from schedule + channel if requested
  if (params?.autoApplyFilters && params?.scheduleId && params?.channelId) {
    const { filters: mergedFilters } = await getMergedFiltersForSlot(
      params.scheduleId,
      params.channelId,
    );

    if (mergedFilters.length > 0) {
      buildFilterGroupQuery(mergedFilters, queryBuilder, filterContext);
    }
  }

  // Apply manual filters (these can be additional temporary filters)
  if (params?.filters) {
    buildFilterGroupQuery(params.filters, queryBuilder, filterContext);
  }

  // Apply manual excludeMediaIds filter
  if (params?.excludeMediaIds && params.excludeMediaIds.length > 0) {
    queryBuilder.andWhere("media.id NOT IN (:...excludeMediaIds)", {
      excludeMediaIds: params.excludeMediaIds,
    });
  }

  // Apply repost cooldown if requested and channelId provided
  if (params?.applyRepostCooldown && params?.channelId) {
    const channel = await database.manager.findOne(Channel, {
      where: { id: params.channelId },
    });

    if (channel?.mediaRepostCooldownHours && channel.mediaRepostCooldownHours > 0) {
      const recentlyPostedMediaIds = await getRecentlyPostedMediaIds(
        params.channelId,
        channel.mediaRepostCooldownHours,
      );

      if (recentlyPostedMediaIds.size > 0) {
        queryBuilder.andWhere("media.id NOT IN (:...recentMediaIds)", {
          recentMediaIds: Array.from(recentlyPostedMediaIds),
        });
      }
    }
  }

  // Add inline repostStatus computation when channelId is provided
  if (params?.channelId) {
    const cooldownHours = filterContext?.channelCooldownHours
      ?? filterContext?.repostSettings?.defaultMediaRepostCooldownHours
      ?? 504;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - cooldownHours);

    queryBuilder.addSelect(
      `CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM post_media pm_rs JOIN post p_rs ON p_rs.id = pm_rs.postId
          WHERE pm_rs.mediaId = media.id AND p_rs.channelId = :rsComputeChannelId AND p_rs.status = 'posted'
        ) THEN 'never_posted'
        WHEN EXISTS (
          SELECT 1 FROM post_media pm_rs2 JOIN post p_rs2 ON p_rs2.id = pm_rs2.postId
          WHERE pm_rs2.mediaId = media.id AND p_rs2.channelId = :rsComputeChannelId AND p_rs2.status = 'posted'
          AND p_rs2.date >= :rsComputeCutoff
        ) THEN 'on_cooldown'
        ELSE 'repostable'
      END`,
      "repostStatus",
    );
    queryBuilder.setParameters({
      rsComputeChannelId: params.channelId,
      rsComputeCutoff: cutoffDate.toISOString(),
    });
  }

  if (params?.sort) {
    const { field, direction } = params.sort;
    switch (field) {
      case "fileModificationDate":
      case "fileCreationDate":
        queryBuilder.orderBy(`media.${field}`, direction);
        break;
      case "lastPosted":
        queryBuilder
          .addSelect(
            (subQuery) =>
              subQuery
                .select("MAX(p.date)")
                .from("post", "p")
                .innerJoin("post_media", "pm", "pm.postId = p.id")
                .where("pm.mediaId = media.id"),
            "lastPostDate"
          )
          .orderBy("lastPostDate", direction, "NULLS LAST");
        break;
      case "leastPosted":
        queryBuilder
          .addSelect(
            (subQuery) =>
              subQuery
                .select("COUNT(pm.id)")
                .from("post_media", "pm")
                .where("pm.mediaId = media.id"),
            "postCount"
          )
          .orderBy("postCount", direction)
          .addOrderBy("media.fileModificationDate", "DESC");
        break;
      case "random":
        queryBuilder.orderBy("RANDOM() * unixepoch()", direction);
        break;
    }
  } else {
    queryBuilder.orderBy("media.fileModificationDate", "DESC");
  }

  // Use getRawAndEntities to get both entity data and raw computed columns
  if (params?.channelId) {
    const { raw, entities } = await queryBuilder.skip(skip).take(limit).getRawAndEntities();

    // Count total separately
    const total = await queryBuilder.skip(0).take(undefined).getCount();

    // Merge repostStatus from raw results onto entities
    type RepostStatusValue = "never_posted" | "repostable" | "on_cooldown" | "still_growing";
    const validStatuses = new Set<string>(["never_posted", "repostable", "on_cooldown", "still_growing"]);
    const items = entities.map((entity, index) => {
      const rawStatus = raw[index]?.repostStatus as string | undefined;
      return {
        ...entity,
        repostStatus: rawStatus && validStatuses.has(rawStatus) ? rawStatus as RepostStatusValue : undefined,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};
