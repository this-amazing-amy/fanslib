import type { SubredditPostingTime } from "../../../channels/subreddit/posting-time";

export type FindSubredditPostingTimesRequest = {
  subreddit: string;
  timezone?: string;
};

export type FindSubredditPostingTimesResponse = {
  postingTimes: SubredditPostingTime[];
  subreddit: string;
  timezone: string;
};

