import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { ContentScheduleSchema } from "../../../content-schedules/entity";
import { SubredditSchema } from "../../../subreddits/entity";
import { Post } from "../../entity";
import { PostMediaWithMediaSchema, PostSchema } from "../../schema";
import type { PostFiltersSchema } from "../../schemas/post-filters";

export const FetchAllPostsRequestQuerySchema = t.Object({
  filters: t.Optional(t.String()), // JSON stringified PostFilters
});

export const ChannelWithTypeSchema = ChannelSchema;

export const PostWithRelationsSchema = t.Composite([
  PostSchema,
  t.Object({
    postMedia: t.Array(PostMediaWithMediaSchema),
    channel: ChannelWithTypeSchema,
    subreddit: t.Union([SubredditSchema, t.Null()]),
    schedule: t.Any(), // TODO: Investigate ContentScheduleSchema validation issue
  }),
]);

export const FetchAllPostsResponseSchema = t.Object({
  posts: t.Array(PostWithRelationsSchema),
});

export const fetchAllPosts = async (filters?: typeof PostFiltersSchema.static): Promise<typeof FetchAllPostsResponseSchema.static> => {
  const dataSource = await db();
  const queryBuilder = dataSource
    .getRepository(Post)
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.media", "media")
    .leftJoinAndSelect("post.channel", "channel")
    .leftJoinAndSelect("channel.type", "type")
    .leftJoinAndSelect("channel.defaultHashtags", "defaultHashtags")
    .leftJoinAndSelect("post.subreddit", "subreddit")
    .leftJoinAndSelect("post.schedule", "schedule");

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

  if (filters?.channelTypes && filters.channelTypes.length > 0) {
    queryBuilder.andWhere("type.id IN (:...channelTypes)", {
      channelTypes: filters.channelTypes,
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
  queryBuilder.take(100);

  const posts = await queryBuilder.getMany();
  
  const filteredPosts = posts.map((post) => ({
    ...post,
    postMedia: post.postMedia.filter((pm) => pm.media !== null),
    subreddit: post.subreddit ?? null,
    schedule: post.schedule ?? null,
  }));
  
  return { posts: filteredPosts };
};

