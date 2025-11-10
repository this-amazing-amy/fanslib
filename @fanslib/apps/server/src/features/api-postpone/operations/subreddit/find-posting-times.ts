import { t } from "elysia";
import { SubredditPostingTimeSchema } from "../../schemas/subreddit-posting-time";
import { FIND_SUBREDDIT_POSTING_TIMES } from "../../queries";
import { fetchPostpone } from "../helpers";

export const FindSubredditPostingTimesRequestBodySchema = t.Object({
  subreddit: t.String(),
  timezone: t.Optional(t.String()),
});

export const FindSubredditPostingTimesResponseSchema = t.Object({
  postingTimes: t.Array(SubredditPostingTimeSchema),
  subreddit: t.String(),
  timezone: t.String(),
});

type FindSubredditPostingTimesQueryResult = {
  analytics?: {
    id: string;
    subreddit: string;
    posts: Array<{
      day: number;
      hour: number;
      posts: number;
    } | null> | null;
  } | null;
};

type FindSubredditPostingTimesQueryVariables = {
  subreddit: string;
  timezone: string;
};

export const findSubredditPostingTimes = async (data: typeof FindSubredditPostingTimesRequestBodySchema.static): Promise<typeof FindSubredditPostingTimesResponseSchema.static> => {
  const timezone = data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const result = await fetchPostpone<
    FindSubredditPostingTimesQueryResult,
    FindSubredditPostingTimesQueryVariables
  >(FIND_SUBREDDIT_POSTING_TIMES, {
    subreddit: data.subreddit,
    timezone,
  });

  if (!result.analytics?.posts) {
    return {
      postingTimes: [],
      subreddit: data.subreddit,
      timezone,
    };
  }

  const posts = result.analytics.posts.filter(
    (p) => p?.day !== null && p?.hour !== null && p?.posts !== null
  );
  const maxPosts = Math.max(...posts.map((p) => p?.posts ?? 0));

  const postingTimes = posts.map((p) => ({
    day: p?.day ?? 0,
    hour: p?.hour ?? 0,
    posts: p?.posts ?? 0,
    score: maxPosts > 0 ? Math.round((p?.posts ?? 0 / maxPosts) * 100) : 0,
  }));

  return {
    postingTimes,
    subreddit: data.subreddit,
    timezone,
  };
};

