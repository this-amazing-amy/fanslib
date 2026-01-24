import type { Repository } from "typeorm";
import { db } from "../../lib/db";
import { CHANNEL_TYPES } from "../channels/channelTypes";
import { Channel } from "../channels/entity";
import { createPost as createBlueskyPost } from "../api-bluesky/operations/create-post";
import { Post } from "./entity";

const MAX_BLUESKY_RETRIES = 3;

type UpdatedPostLog = {
  postId: string;
  captionPreview: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
};

type UpdateResult = {
  updatedPosts: UpdatedPostLog[];
  skippedPosts: UpdatedPostLog[];
  now: Date;
};

type OverduePostRow = {
  id: string;
  caption: string | null;
  date: Date;
  channelTypeId: string;
  blueskyRetryCount: number;
};

const findOverdueScheduledNonRedditPosts = async (postRepository: Repository<Post>, now: Date): Promise<OverduePostRow[]> => postRepository
    .createQueryBuilder("post")
    .leftJoin(Channel, "channel", "channel.id = post.channelId")
    .leftJoinAndSelect("post.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.media", "media")
    .select("post.id", "id")
    .addSelect("post.caption", "caption")
    .addSelect("post.date", "date")
    .addSelect("post.blueskyRetryCount", "blueskyRetryCount")
    .addSelect("channel.typeId", "channelTypeId")
    .where("post.status = :status", { status: "scheduled" })
    .andWhere("post.date < :now", { now })
    .andWhere("channel.typeId != :redditTypeId", { redditTypeId: CHANNEL_TYPES.reddit.id })
    .getRawMany<OverduePostRow>();

const fetchPostWithRelations = async (postRepository: Repository<Post>, postId: string): Promise<Post | null> => postRepository.findOne({
    where: { id: postId },
    relations: {
      postMedia: {
        media: true,
      },
      channel: true,
    },
    order: {
      postMedia: {
        order: "ASC",
      },
    },
  });

const extractMediaFromPost = (post: Post) => post.postMedia
    .filter((pm) => pm.media !== null)
    .map((pm) => pm.media)
    .filter((m): m is NonNullable<typeof m> => m !== null);

const postToBluesky = async (post: Post, retryCount: number, now: Date): Promise<UpdatedPostLog> => {
  const postRepository = (await db()).getRepository(Post);
  const media = extractMediaFromPost(post);

  if (media.length === 0) {
    const errorMessage = "No media found for post";
    await postRepository.update(post.id, {
      blueskyPostError: errorMessage,
      blueskyRetryCount: retryCount + 1,
      updatedAt: now,
    });

    return {
      postId: post.id,
      captionPreview: (post.caption ?? "").slice(0, 100),
      success: false,
      error: errorMessage,
    };
  }

  try {
    const postUri = await createBlueskyPost({
      text: post.caption ?? "",
      media,
      createdAt: new Date(post.date),
    });

    await postRepository.update(post.id, {
      status: "posted",
      updatedAt: now,
      blueskyPostUri: postUri,
      blueskyPostError: null,
      blueskyRetryCount: 0,
    });

    return {
      postId: post.id,
      captionPreview: (post.caption ?? "").slice(0, 100),
      success: true,
    };
  } catch (error) {
    const errorDetails = error instanceof Error 
      ? { 
          name: error.name, 
          message: error.message,
          // Include XRPC-specific error details if available
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: (error as any).status,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: (error as any).error,
        }
      : { message: "Unknown error" };
    
    console.error("Bluesky post failed", {
      postId: post.id,
      mediaCount: media.length,
      mediaTypes: media.map((m) => m.type),
      errorDetails,
    });

    const newRetryCount = retryCount + 1;
    const errorMessage = `${errorDetails.name ?? "Error"}: ${errorDetails.message} (attempt ${newRetryCount}/${MAX_BLUESKY_RETRIES})`;
    await postRepository.update(post.id, {
      blueskyPostError: errorMessage,
      blueskyRetryCount: newRetryCount,
      updatedAt: now,
    });

    return {
      postId: post.id,
      captionPreview: (post.caption ?? "").slice(0, 100),
      success: false,
      error: errorMessage,
    };
  }
};

const markPostAsPosted = async (post: Post, now: Date): Promise<void> => {
  const postRepository = (await db()).getRepository(Post);
  await postRepository.update(post.id, {
    status: "posted",
    updatedAt: now,
  });
};

const processOverduePost = async (
  postRepository: Repository<Post>,
  row: OverduePostRow,
  now: Date
): Promise<UpdatedPostLog> => {
  const post = await fetchPostWithRelations(postRepository, row.id);

  if (!post) {
    return {
      postId: row.id,
      captionPreview: (row.caption ?? "").slice(0, 100),
      success: false,
      error: "Post not found",
    };
  }

  const isBluesky = post.channel.typeId === CHANNEL_TYPES.bluesky.id;

  if (isBluesky) {
    // Skip if max retries exceeded
    if (row.blueskyRetryCount >= MAX_BLUESKY_RETRIES) {
      return {
        postId: row.id,
        captionPreview: (row.caption ?? "").slice(0, 100),
        success: false,
        error: `Max retries (${MAX_BLUESKY_RETRIES}) exceeded`,
        skipped: true,
      };
    }

    return postToBluesky(post, row.blueskyRetryCount, now);
  }

  await markPostAsPosted(post, now);

  return {
    postId: row.id,
    captionPreview: (row.caption ?? "").slice(0, 100),
    success: true,
  };
};

export const runScheduledPostsCronTick = async (): Promise<void> => {
  const result = await updateOverdueScheduledNonRedditPosts();
  console.info("scheduled-posts-cron:tick", {
    now: result.now,
    processedCount: result.updatedPosts.length,
    skippedCount: result.skippedPosts.length,
    updatedPosts: result.updatedPosts,
    skippedPosts: result.skippedPosts.length > 0 ? result.skippedPosts : undefined,
  });
};

export const updateOverdueScheduledNonRedditPosts = async (): Promise<UpdateResult> => {
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);
  const now = new Date();

  const overduePosts = await findOverdueScheduledNonRedditPosts(postRepository, now);

  if (overduePosts.length === 0) {
    return { updatedPosts: [], skippedPosts: [], now };
  }

  const allResults = await Promise.all(
    overduePosts.map((row) => processOverduePost(postRepository, row, now))
  );

  const updatedPosts = allResults.filter((r) => !r.skipped);
  const skippedPosts = allResults.filter((r) => r.skipped);

  return {
    updatedPosts,
    skippedPosts,
    now,
  };
};
