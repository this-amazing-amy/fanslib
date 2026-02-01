import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { CHANNEL_TYPES } from "../../../channels/channelTypes";
import { Channel } from "../../../channels/entity";
import { Media } from "../../../library/entity";
import { Post, PostMedia } from "../../entity";
import { PostStatusSchema } from "../../schema";
import type { PostWithRelations } from "./fetch-by-id";
import { fetchPostById } from "./fetch-by-id";

export const CreatePostRequestBodySchema = z.object({
  date: z.coerce.date(),
  channelId: z.string(),
  status: PostStatusSchema,
  scheduleId: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  fypRemovedAt: z.coerce.date().nullable().optional(),
  subredditId: z.string().nullable().optional(),
  postGroupId: z.string().nullable().optional(),
  mediaIds: z.array(z.string()).optional(),
});

export const createPost = async (
  postData: Omit<z.infer<typeof CreatePostRequestBodySchema>, 'mediaIds'>,
  mediaIds: string[]
): Promise<PostWithRelations> => {
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
    createdAt: new Date(),
    updatedAt: new Date(),
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

  const createdPost = await fetchPostById(post.id);
  if (!createdPost) {
    throw new Error(`Failed to fetch created post with id ${post.id}`);
  }
  return createdPost;
};

