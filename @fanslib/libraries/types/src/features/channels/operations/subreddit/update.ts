import type { Subreddit } from "../../subreddit";

export type UpdateSubredditRequest = Partial<
  Omit<Subreddit, "id" | "createdAt" | "updatedAt">
>;

export type UpdateSubredditResponse = Subreddit | null;

