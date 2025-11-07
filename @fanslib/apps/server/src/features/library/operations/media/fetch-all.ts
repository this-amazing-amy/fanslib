import { t } from "elysia";
import { db } from "../../../../lib/db";
import { paginatedResponseSchema } from "../../../../lib/pagination";
import { Media, MediaSchema } from "../../entity";
import { buildFilterGroupQuery } from "../../filter-helpers";
import { MediaFilterSchema } from "../../schemas/media-filter";
import { MediaSortSchema } from "../../schemas/media-sort";

export const FetchAllMediaRequestBodySchema = t.Object({
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
  filters: t.Optional(MediaFilterSchema),
  sort: t.Optional(MediaSortSchema),
});

export const FetchAllMediaResponseSchema = paginatedResponseSchema(MediaSchema);

export const fetchAllMedia = async (
  params?: typeof FetchAllMediaRequestBodySchema.static,
): Promise<typeof FetchAllMediaResponseSchema.static> => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const skip = (page - 1) * limit;

  const database = await db();
  const queryBuilder = database.manager
    .createQueryBuilder(Media, "media")
    .leftJoinAndSelect("media.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.post", "post")
    .leftJoinAndSelect("post.channel", "channel")
    .leftJoinAndSelect("post.subreddit", "subreddit");

  if (params?.filters) {
    buildFilterGroupQuery(params.filters, queryBuilder);
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

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

