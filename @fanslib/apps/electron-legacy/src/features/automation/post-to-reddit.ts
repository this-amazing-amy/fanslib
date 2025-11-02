import { findRedgifsURL } from "../api-postpone/operations/redgifs/find-url";
import { CHANNEL_TYPES } from "../channels/channelTypes";
import { fetchChannelsByType, fetchSubredditById } from "../channels/operations";
import { getMediaById } from "../library/operations";
import { createPost } from "../posts/operations";
import { PostToRedditPayload, RedditPostResult } from "./api-type";
import { postToRedditWithPlaywright } from "./reddit-automation-adapter";
import { BrowserConfig, RedditPostDraft } from "@fanslib/reddit-automation";

export type RedditPosterOptions = BrowserConfig;
export type { RedditPostDraft };

export const postToReddit = async (payload: PostToRedditPayload): Promise<RedditPostResult> => {
  const subreddit = await fetchSubredditById(payload.subredditId);
  if (!subreddit) {
    return {
      success: false,
      error: "Subreddit not found",
    };
  }

  const media = await getMediaById(payload.mediaId);
  if (!media) {
    return {
      success: false,
      error: "Media not found",
    };
  }

  const url = await findRedgifsURL({ mediaId: media.id });
  if (!url) {
    return {
      success: false,
      error: "Redgifs URL not found",
    };
  }

  const caption = `${subreddit.captionPrefix ?? ""} ${payload.caption}`.trim();
  const flair = subreddit.defaultFlair;

  const result = await postToRedditWithPlaywright({
    type: "Link",
    subreddit: subreddit.name,
    caption,
    url: url.url,
    flair,
  });

  if (!result.success) {
    return {
      success: false,
      error: "Failed to post to Reddit",
    };
  }

  const redditChannels = await fetchChannelsByType(CHANNEL_TYPES.reddit.id);
  if (redditChannels.length === 0) {
    return {
      success: false,
      error: "Reddit channel not found",
    };
  }
  const redditChannel = redditChannels[0];

  await createPost(
    {
      channelId: redditChannel.id,
      subredditId: subreddit.id,
      date: new Date().toISOString(),
      status: "posted",
      caption,
    },
    [media.id]
  );

  return {
    success: true,
    url: result.url,
  };
};
