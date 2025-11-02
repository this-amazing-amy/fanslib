import { Channel } from "~/features/channels/entity";
import { Subreddit } from "~/features/subreddits/entity";
import { db } from "~/lib/db";
import type { RedditPostDraft, RedditPostResult } from "~/lib/reddit-poster/types";
import { getPosterInstance } from "../../../../lib/reddit-poster/poster-instance";
import { findRedgifsURL } from "../../../api-postpone/operations/redgifs/find-url";
import { Media } from "../../../library/entity";
import { createPost } from "../../../posts/operations/post/create";

const CHANNEL_TYPES = {
  reddit: { id: "reddit" },
};

export const postToReddit = async (
  subredditId: string,
  mediaId: string,
  caption: string
): Promise<RedditPostResult> => {
  const subredditRepo = (await db()).getRepository(Subreddit);
  const subreddit = await subredditRepo.findOne({ where: { id: subredditId } });

  if (!subreddit) {
    return {
      success: false,
      error: "Subreddit not found",
    };
  }

  const mediaRepo = (await db()).getRepository(Media);
  const media = await mediaRepo.findOne({ where: { id: mediaId } });

  if (!media) {
    return {
      success: false,
      error: "Media not found",
    };
  }

  const redgifsResult = await findRedgifsURL({ mediaId });

  if (!redgifsResult?.url) {
    return {
      success: false,
      error: "Redgifs URL not found",
    };
  }

  const fullCaption = `${subreddit.captionPrefix ?? ""} ${caption}`.trim();
  const flair = subreddit.defaultFlair;

  const draft: RedditPostDraft = {
    type: "Link",
    subreddit: subreddit.name,
    caption: fullCaption,
    url: redgifsResult.url,
    flair,
  };

  const poster = getPosterInstance();
  const result = await poster.postToReddit(draft);

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? "Failed to post to Reddit",
    };
  }

  const channelRepo = (await db()).getRepository(Channel);
  const redditChannels = await channelRepo.find({
    where: { typeId: CHANNEL_TYPES.reddit.id },
  });

  if (redditChannels.length === 0) {
    return {
      success: false,
      error: "Reddit channel not found",
    };
  }

  const redditChannel = redditChannels[0];
  if (!redditChannel) {
    return {
      success: false,
      error: "Reddit channel not found",
    };
  }

  await createPost(
    {
      channelId: redditChannel?.id,
      subredditId: subreddit.id,
      date: new Date().toISOString(),
      status: "posted",
      caption: fullCaption,
    },
    [media.id]
  );

  return {
    success: true,
    url: result.url,
  };
};

