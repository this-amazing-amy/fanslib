import { CHANNEL_TYPES } from "~/features/channels/channelTypes";
import { Channel } from "~/features/channels/entity";
import { fetchPostsByChannel } from "~/features/posts/operations/post/fetch-by-channel";
import { db } from "~/lib/db";
import type { Media } from "../../../library/entity";
import type { Subreddit } from "../../../subreddits/entity";
import { calculateOptimalScheduleDate, generateCaptionForMedia, getSubredditPosts, selectRandomMediaWithConflictChecking, selectSubreddit } from "./utils";

type GeneratedPost = {
  id: string;
  subreddit: Subreddit;
  media: Media;
  caption: string;
  date: Date;
};

export const generateRandomPost = async (
  subreddits: Subreddit[],
  channelId: string
): Promise<GeneratedPost> => {
  const channelRepo = (await db()).getRepository(Channel);

  const channel = await channelRepo.findOne({
    where: { id: channelId },
    relations: ["type"],
  });

  if (!channel || channel.type.id !== CHANNEL_TYPES.reddit.id) {
    throw new Error("Invalid Reddit channel");
  }

  const channelPosts = await fetchPostsByChannel(channelId);

  const subreddit = selectSubreddit(subreddits);
  if (!subreddit) {
    throw new Error("No subreddit found");
  }

  const subredditPosts = getSubredditPosts(channelPosts, subreddit.id);

  const { media: selectedMedia } = await selectRandomMediaWithConflictChecking(
    subreddit,
    channelId
  );
  if (!selectedMedia) {
    throw new Error("No suitable media found");
  }

  const caption = await generateCaptionForMedia(selectedMedia);

  const date = calculateOptimalScheduleDate(subreddit, subredditPosts, channelPosts);

  return {
    id: crypto.randomUUID(),
    subreddit,
    media: selectedMedia,
    caption,
    date,
  };
};
