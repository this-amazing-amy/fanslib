import type { PostFilters } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Post } from "../../entity";

export const fetchAllPosts = async (filters?: PostFilters): Promise<Post[]> => {
  const dataSource = await db();
  const queryBuilder = dataSource
    .getRepository(Post)
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.media", "media")
    .leftJoinAndSelect("post.channel", "channel")
    .leftJoinAndSelect("channel.type", "type")
    .leftJoinAndSelect("post.subreddit", "subreddit");

  if (filters?.search) {
    queryBuilder.andWhere(
      "(post.caption LIKE :search OR channel.name LIKE :search)",
      { search: `%${filters.search}%` }
    );
  }

  if (filters?.channels && filters.channels.length > 0) {
    queryBuilder.andWhere("post.channelId IN (:...channels)", {
      channels: filters.channels,
    });
  }

  if (filters?.statuses && filters.statuses.length > 0) {
    queryBuilder.andWhere("post.status IN (:...statuses)", {
      statuses: filters.statuses,
    });
  }

  if (filters?.dateRange) {
    queryBuilder.andWhere("post.date >= :startDate", {
      startDate: filters.dateRange.startDate,
    });
    queryBuilder.andWhere("post.date <= :endDate", {
      endDate: filters.dateRange.endDate,
    });
  }

  queryBuilder.orderBy("post.date", "DESC");
  queryBuilder.addOrderBy("postMedia.order", "ASC");

  return queryBuilder.getMany();
};

