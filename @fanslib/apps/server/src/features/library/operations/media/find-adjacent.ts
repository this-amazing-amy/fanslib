import { z } from "zod";
import { db } from "../../../../lib/db";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";
import { buildFilterGroupQuery } from "../../filter-helpers";
import { MediaFilterSchema } from "../../schemas/media-filter";
import { MediaSortSchema } from "../../schemas/media-sort";

export const FindAdjacentMediaRequestParamsSchema = z.object({
  id: z.string(),
});

export const FindAdjacentMediaBodySchema = z.object({
  filters: MediaFilterSchema.optional(),
  sort: MediaSortSchema.optional(),
});

export const FindAdjacentMediaResponseSchema = z.object({
  previous: MediaSchema.nullable(),
  next: MediaSchema.nullable(),
});


export const findAdjacentMedia = async (
  mediaId: string,
  params?: z.infer<typeof FindAdjacentMediaBodySchema>
): Promise<z.infer<typeof FindAdjacentMediaResponseSchema>> => {
  const database = await db();

  const currentMedia = await database.manager.findOne(Media, {
    where: { id: mediaId },
  });

  if (!currentMedia) {
    return { previous: null, next: null };
  }

  const buildQuery = () => {
    const queryBuilder = database.manager
      .createQueryBuilder(Media, "media")
      .leftJoinAndSelect("media.postMedia", "postMedia")
      .leftJoinAndSelect("postMedia.post", "post")
      .leftJoinAndSelect("post.channel", "channel")
      .leftJoinAndSelect("post.subreddit", "subreddit");

    if (params?.filters) {
      buildFilterGroupQuery(params.filters, queryBuilder);
    }

    return queryBuilder;
  };

  const sortField = params?.sort?.field ?? "fileModificationDate";
  const sortDirection = params?.sort?.direction ?? "DESC";

  // eslint-disable-next-line functional/no-let
  let previousCondition: string;
  // eslint-disable-next-line functional/no-let
  let nextCondition: string;
  // eslint-disable-next-line functional/no-let
  let currentValue: Date | undefined;

  switch (sortField) {
    case "fileModificationDate":
    case "fileCreationDate":
      currentValue = currentMedia[sortField];
      if (sortDirection === "DESC") {
        previousCondition = `media.${sortField} > :currentValue`;
        nextCondition = `media.${sortField} < :currentValue`;
      } else {
        previousCondition = `media.${sortField} < :currentValue`;
        nextCondition = `media.${sortField} > :currentValue`;
      }
      break;
    case "lastPosted":
    case "leastPosted":
      currentValue = currentMedia.fileCreationDate;
      previousCondition = `media.fileCreationDate > :currentValue`;
      nextCondition = `media.fileCreationDate < :currentValue`;
      break;
    case "random":
      currentValue = currentMedia.fileCreationDate;
      previousCondition = `media.fileCreationDate > :currentValue`;
      nextCondition = `media.fileCreationDate < :currentValue`;
      break;
  }

  const [previous, next] = await Promise.all([
    buildQuery()
      .where(previousCondition, currentValue ? { currentValue, mediaId } : { mediaId })
      .orderBy(`media.${sortField}`, sortDirection === "DESC" ? "ASC" : "DESC")
      .limit(1)
      .getOne(),

    buildQuery()
      .where(nextCondition, currentValue ? { currentValue, mediaId } : { mediaId })
      .orderBy(`media.${sortField}`, sortDirection)
      .limit(1)
      .getOne(),
  ]);

  return { previous, next };
};

