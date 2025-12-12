import { db } from "../../lib/db";
import { CHANNEL_TYPES } from "../channels/channelTypes";
import { Channel } from "../channels/entity";
import { Post } from "./entity";

type UpdatedPostLog = {
  postId: string;
  captionPreview: string;
};

type UpdateResult = {
  updatedPosts: UpdatedPostLog[];
  now: string;
};

export const runScheduledPostsCronTick = async (): Promise<void> => {
  const result = await updateOverdueScheduledNonRedditPosts();
  console.info("scheduled-posts-cron:tick", {
    now: result.now,
    updatedCount: result.updatedPosts.length,
    updatedPosts: result.updatedPosts,
  });
};

export const updateOverdueScheduledNonRedditPosts = async (): Promise<UpdateResult> => {
  const dataSource = await db();

  const now = new Date().toISOString();
  const postRepository = dataSource.getRepository(Post);

  const overdueScheduledNonRedditPosts = await postRepository
    .createQueryBuilder("post")
    .leftJoin(Channel, "channel", "channel.id = post.channelId")
    .select("post.id", "id")
    .addSelect("post.caption", "caption")
    .where("post.status = :status", { status: "scheduled" })
    .andWhere("post.date < :now", { now })
    .andWhere("channel.typeId != :redditTypeId", { redditTypeId: CHANNEL_TYPES.reddit.id })
    .getRawMany<{ id: string; caption: string | null }>();

  const overdueScheduledNonRedditPostIds = overdueScheduledNonRedditPosts.map((row) => row.id);
  const updatedPosts = overdueScheduledNonRedditPosts.map(({ id, caption }) => ({
    postId: id,
    captionPreview: (caption ?? "").slice(0, 100),
  }));

  if (overdueScheduledNonRedditPostIds.length === 0) {
    return { updatedPosts: [], now };
  }

  await postRepository.update(overdueScheduledNonRedditPostIds, {
    status: "posted",
    updatedAt: now,
  });

  return {
    updatedPosts,
    now,
  };
};
