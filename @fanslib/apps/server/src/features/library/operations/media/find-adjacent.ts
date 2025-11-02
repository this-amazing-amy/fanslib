import type { GetAllMediaParams } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Media } from "../../entity";
import { buildFilterGroupQuery } from "../../filter-helpers";

export const findAdjacentMedia = async (
  mediaId: string,
  params?: GetAllMediaParams
): Promise<{ previous: Media | null; next: Media | null }> => {
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

