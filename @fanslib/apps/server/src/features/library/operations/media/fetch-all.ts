/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { z } from "zod";
import { db } from "../../../../lib/db";
import { paginatedResponseSchema } from "../../../../lib/pagination";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";
import { buildFilterGroupQuery } from "../../filter-helpers";
import { MediaFilterSchema } from "../../schemas/media-filter";
import { MediaSortSchema } from "../../schemas/media-sort";
import { Channel } from "../../../channels/entity";
import { getRecentlyPostedMediaIds } from "./get-recently-posted-media-ids";
import { getMergedFiltersForSlot } from "../../../content-schedules/operations/get-merged-filters";

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

export const fetchAllMedia = async (
  params?: z.infer<typeof FetchAllMediaRequestBodySchema>,
): Promise<z.infer<typeof FetchAllMediaResponseSchema>> => {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const skip = (page - 1) * limit;

  const database = await db();
  const queryBuilder = database.manager
    .createQueryBuilder(Media, "media")
    .leftJoinAndSelect("media.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.post", "post")
    .leftJoinAndSelect("post.channel", "channel")
    .leftJoinAndSelect("post.subreddit", "subreddit");

  // Auto-apply merged filters from schedule + channel if requested
  if (params?.autoApplyFilters && params?.scheduleId && params?.channelId) {
    const { filters: mergedFilters } = await getMergedFiltersForSlot(
      params.scheduleId,
      params.channelId,
    );

    if (mergedFilters.length > 0) {
      buildFilterGroupQuery(mergedFilters, queryBuilder);
    }
  }

  // Apply manual filters (these can be additional temporary filters)
  if (params?.filters) {
    buildFilterGroupQuery(params.filters, queryBuilder);
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
                .innerJoin("post.postMedia", "pm")
                .where("pm.mediaId = media.id"),
            "lastPostDate"
          )
          .orderBy("lastPostDate", direction, "NULLS LAST");
        break;
      case "random":
        queryBuilder.orderBy("RANDOM() * unixepoch()", direction);
        break;
    }
  } else {
    queryBuilder.orderBy("media.fileModificationDate", "DESC");
  }

  const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

  const r =  {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };

  return r;
};

