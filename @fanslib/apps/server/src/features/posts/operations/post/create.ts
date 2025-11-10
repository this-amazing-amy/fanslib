import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { CHANNEL_TYPES } from "../../../channels/channelTypes";
import { Channel } from "../../../channels/entity";
import { Media } from "../../../library/entity";
import { Post, PostMedia, PostStatusSchema } from "../../entity";
import { getPostById, GetPostByIdResponseSchema } from "./fetch-by-id";

export const CreatePostRequestBodySchema = t.Object({
  date: t.String(),
  channelId: t.String(),
  caption: t.Optional(t.String()),
  status: PostStatusSchema,
  url: t.Optional(t.String()),
  fanslyStatisticsId: t.Optional(t.String()),
  subredditId: t.Optional(t.String()),
  fypRemovedAt: t.Optional(t.Union([t.Date(), t.Null()])),
  mediaIds: t.Optional(t.Array(t.String())),
});

export const CreatePostResponseSchema = GetPostByIdResponseSchema;

export const createPost = async (
  postData: Omit<typeof CreatePostRequestBodySchema.static, 'mediaIds'>,
  mediaIds: string[]
): Promise<typeof CreatePostResponseSchema.static> => {
  const dataSource = await db();
  const postRepo = dataSource.getRepository(Post);
  const mediaRepo = dataSource.getRepository(Media);
  const postMediaRepo = dataSource.getRepository(PostMedia);

  const channel = await dataSource
    .createQueryBuilder(Channel, "channel")
    .leftJoinAndSelect("channel.type", "type")
    .where("channel.id = :channelId", { channelId: postData.channelId })
    .getOne();

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (channel.type.id === CHANNEL_TYPES.reddit.id && !postData.subredditId) {
    throw new Error("Subreddit is required for Reddit posts");
  }

  const post = postRepo.create({
    ...postData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fypRemovedAt:
      typeof postData.fypRemovedAt === "undefined" &&
      channel.type.id === CHANNEL_TYPES.fansly.id
        ? null
        : postData.fypRemovedAt,
  });

  await postRepo.save(post);

  if (mediaIds.length) {
    const media = await mediaRepo.findBy({ id: In(mediaIds) });
    const postMedia = media.map((m, index) =>
      postMediaRepo.create({
        post,
        media: m,
        order: index,
      })
    );
    await postMediaRepo.save(postMedia);
  }

  const createdPost = await getPostById(post.id);
  if (!createdPost) {
    throw new Error(`Failed to fetch created post with id ${post.id}`);
  }
  return createdPost;
};

