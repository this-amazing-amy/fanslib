import { t } from "elysia";
import { ChannelSchema, ChannelTypeSchema } from "~/features/channels/entity";
import { MediaSchema } from "~/features/library/entity";
import { SubredditSchema } from "~/features/subreddits/entity";
import { db } from "../../../../lib/db";
import { Post, PostMediaSchema, PostSchema } from "../../entity";
import type { PostFiltersSchema } from "../../schemas/post-filters";

export const FetchAllPostsRequestQuerySchema = t.Object({
  filters: t.Optional(t.String()), // JSON stringified PostFilters
});

export const FetchAllPostsResponseSchema = t.Array(t.Composite([
  PostSchema,
  t.Object({
    postMedia: t.Array(t.Composite([
      PostMediaSchema,
      t.Object({
        media: MediaSchema,
      }),
    ])),
    channel: t.Composite([
      ChannelSchema,
      t.Object({
        type: ChannelTypeSchema,
      }),
    ]),
    subreddit: t.Nullable(SubredditSchema),
  }),
]));

export const fetchAllPosts = async (filters?: typeof PostFiltersSchema.static): Promise<typeof FetchAllPostsResponseSchema.static> => {
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

  const posts = await queryBuilder.getMany();
  return posts.map((post) => ({
    ...post,
    subreddit: post.subreddit ?? null,
  }));
};

