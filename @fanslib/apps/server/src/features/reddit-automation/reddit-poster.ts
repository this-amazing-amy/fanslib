import type { DataSource } from "typeorm";
import { db } from "~/lib/db";
import { browserDataPath } from "~/lib/env";
import { RedditLoginHandler } from "~/lib/reddit-poster/login-handler";
import { createFileSessionStorage } from "~/lib/reddit-poster/session-storage";
import type { RedditPostProgress } from "~/lib/reddit-poster/types";
import { Channel } from "../channels/entity";
import { Media, } from "../library/entity";
import type { Post } from "../posts/entity";
import { createPost } from "../posts/operations/post/create";
import { fetchPostsByChannel } from "../posts/operations/post/fetch-by-channel";
import { Subreddit } from "../subreddits/entity";
import {
  calculateOptimalScheduleDate,
  generateCaptionForMedia,
  getSubredditPosts,
  selectRandomMedia,
  selectRandomMediaWithConflictChecking,
  selectSubreddit,
} from "./operations/generation/utils";

type SubredditType = Subreddit;

type GeneratedPost = {
  id: string;
  subreddit: SubredditType;
  media: Media;
  caption: string;
  date: Date;
};

type ScheduledPost = {
  id: string;
  subreddit: SubredditType;
  media: Media;
  caption: string;
  scheduledDate: string;
  createdAt: string;
  status?: "queued" | "processing" | "posted" | "failed";
  errorMessage?: string;
  postUrl?: string;
};

type RegenerateMediaResult = {
  media: Media;
  caption: string;
};

const CHANNEL_TYPES = {
  reddit: { id: "reddit" },
};

const BROWSER_DATA_DIR = browserDataPath();


export const generatePosts = async (
  db: DataSource,
  count: number,
  subreddits: Subreddit[],
  channelId: string
): Promise<GeneratedPost[]> => {
  if (count <= 0) {
    throw new Error("Count must be greater than 0");
  }
  if (subreddits.length === 0) {
    throw new Error("No subreddits provided");
  }
  if (!channelId) {
    throw new Error("Channel ID is required");
  }

  const channelPosts = await fetchPostsByChannel(channelId);
  const usedSubredditIds = new Set<string>();
  const posts: GeneratedPost[] = [];

  const allPosts = [...channelPosts];

  Array.from({ length: count }).forEach(async (_, index) => {
    const filteredSubreddits = subreddits.filter((sub) => !usedSubredditIds.has(sub.id));
    const availableSubreddits =
      filteredSubreddits.length === 0 ? [...subreddits] : filteredSubreddits;

    if (availableSubreddits.length === 0) {
      usedSubredditIds.clear();
    }

    const subreddit = selectSubreddit(availableSubreddits);
    if (!subreddit) {
      throw new Error(`Post ${index + 1}: No subreddit found`);
    }

    const subredditPosts = getSubredditPosts(allPosts, subreddit.id);

    const { media: selectedMedia } = await selectRandomMediaWithConflictChecking(
      subreddit,
      channelId
    );
    if (!selectedMedia) {
      throw new Error(`Post ${index + 1}: No suitable media found`);
    }

    const caption = await generateCaptionForMedia(selectedMedia);

    const date = calculateOptimalScheduleDate(subreddit, subredditPosts, allPosts);

    const generatedPost: GeneratedPost = {
      id: crypto.randomUUID(),
      subreddit,
      media: selectedMedia,
      caption,
      date,
    };

    posts.push(generatedPost);
    usedSubredditIds.add(subreddit.id);

    allPosts.push({
      id: `temp-${index}`,
      date: date.toISOString(),
      subredditId: subreddit.id,
      channelId,
      status: "scheduled" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Post);
  });

  return posts;
};

export const regenerateMedia = async (
  subredditId: string,
  _channelId: string
): Promise<RegenerateMediaResult> => {
  const subredditRepo = (await db()).getRepository(Subreddit);

  const targetSubreddit = await subredditRepo.findOne({
    where: { id: subredditId },
  });

  if (!targetSubreddit) {
    throw new Error("Subreddit not found");
  }

  const filters = targetSubreddit.eligibleMediaFilter;

  const { media } = await selectRandomMedia(filters);
  if (!media) {
    throw new Error("No suitable media found for this subreddit");
  }

  const caption = await generateCaptionForMedia(media);

  return {
    media,
    caption,
  };
};

export const scheduleAllPosts = async (
  db: DataSource,
  posts: GeneratedPost[]
): Promise<string[]> => {
  const channelRepo = db.getRepository(Channel);
  const redditChannels = await channelRepo.find({
    where: { typeId: CHANNEL_TYPES.reddit.id },
  });

  if (redditChannels.length === 0) {
    throw new Error("Reddit channel not found");
  }

  const redditChannel = redditChannels[0];
  if (!redditChannel) {
    throw new Error("Reddit channel not found");
  }

  const postIds = await Promise.all(
    posts.map(async (post) => {
      const createdPost = await createPost(
        {
          channelId: redditChannel.id,
          subredditId: post.subreddit.id,
          date: post.date.toISOString(),
          status: "scheduled",
          caption: post.caption,
        },
        [post.media.id]
      );

      return createdPost.id;
    })
  );

  return postIds;
};

export const getScheduledPosts = async (db: DataSource): Promise<ScheduledPost[]> => {
  const channelRepo = db.getRepository(Channel);
  const redditChannels = await channelRepo.find({
    where: { typeId: CHANNEL_TYPES.reddit.id },
  });

  if (redditChannels.length === 0) {
    return [];
  }

  const redditChannel = redditChannels[0];
  if (!redditChannel) {
    throw new Error("Reddit channel not found");
  }

  const posts = await fetchPostsByChannel(redditChannel.id);

  const scheduledPosts = posts.filter((post) => post.status === "scheduled");

  const subredditRepo = db.getRepository(Subreddit);
  const mediaRepo = db.getRepository(Media);

  const scheduledPostsWithDetails = await Promise.all(
    scheduledPosts.map(async (post) => {
      const subreddit = await subredditRepo.findOne({ where: { id: post.subredditId ?? undefined } });
      const postMediaRepo = db.getRepository("PostMedia");
      const postMedia = await postMediaRepo.findOne({
        where: { postId: post.id },
        relations: ["media"],
      });

      if (!subreddit || !postMedia) {
        return null;
      }

      const media = await mediaRepo.findOne({ where: { id: postMedia.mediaId } });

      if (!media) {
        return null;
      }

      const scheduledPost: ScheduledPost = {
        id: post.id,
        subreddit,
        media,
        caption: post.caption ?? "",
        scheduledDate: post.date,
        createdAt: post.createdAt,
        status: (post.status ?? "queued") as "queued" | "processing" | "posted" | "failed",
      };

      return scheduledPost
    })
  );

  return scheduledPostsWithDetails
    .filter((post): post is ScheduledPost => post?.status !== undefined)
    .sort((a: ScheduledPost, b: ScheduledPost) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
};

export const loginToReddit = async (userId?: string): Promise<boolean> => {
  console.log("Starting Reddit login process...");

  const sessionStorage = createFileSessionStorage(BROWSER_DATA_DIR, userId);

  const loginHandler = new RedditLoginHandler({
    sessionStorage,
    browserOptions: {
      headless: false,
      timeout: 300000,
    },
    onProgress: (progress: RedditPostProgress) => {
      console.log(`Reddit login progress: ${progress.stage} - ${progress.message}`);
    },
    loginTimeout: 300000,
  });

  const result = await loginHandler.performLogin();

  await loginHandler.dispose();

  if (result.success) {
    console.log(
      `Reddit login completed successfully${result.username ? ` for user: u/${result.username}` : ""}`
    );
    return true;
  }

  console.error("Reddit login failed:", result.error);
  return false;
};

export const checkLoginStatus = async (
  userId?: string
): Promise<{ isLoggedIn: boolean; username?: string }> => {
  console.log("Checking Reddit login status...");

  const sessionStorage = createFileSessionStorage(BROWSER_DATA_DIR, userId);

  const loginHandler = new RedditLoginHandler({
    sessionStorage,
    browserOptions: {
      headless: true,
      timeout: 30000,
    },
    onProgress: (progress: RedditPostProgress) => {
      console.log(`Reddit status check: ${progress.stage} - ${progress.message}`);
    },
  });

  const result = await loginHandler.checkLoginStatus();

  await loginHandler.dispose();

  if (result.success) {
    console.log(
      `Reddit login status: logged in${result.username ? ` as u/${result.username}` : ""}`
    );
    return {
      isLoggedIn: true,
      username: result.username,
    };
  }

  console.log("Reddit login status: not logged in");
  return {
    isLoggedIn: false,
  };
};



