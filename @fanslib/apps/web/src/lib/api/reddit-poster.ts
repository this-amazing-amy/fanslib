import type { Media, Subreddit } from '@fanslib/server/schemas';
import { eden } from './eden';


type GeneratedPost = {
  id: string;
  subreddit: Subreddit;
  media: Media;
  caption: string;
  date: Date;
};

type ScheduledPost = {
  id: string;
  subreddit: Subreddit;
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

export type GenerateRandomPostRequest = {
  subreddits: Subreddit[];
  channelId: string;
};

export type GenerateRandomPostResponse = GeneratedPost;

export type GeneratePostsRequest = {
  count: number;
  subreddits: Subreddit[];
  channelId: string;
};

export type GeneratePostsResponse = GeneratedPost[];

export type RegenerateMediaRequest = {
  subredditId: string;
  channelId: string;
};

export type RegenerateMediaResponse = RegenerateMediaResult;

export type SchedulePostsRequest = {
  posts: unknown[];
};

export type SchedulePostsResponse = string[];

export type GetScheduledPostsResponse = ScheduledPost[];

export type RedditPosterLoginRequest = {
  userId?: string;
};

export type RedditPosterLoginResponse = {
  success: boolean;
};

export type CheckRedditPosterLoginRequest = {
  userId?: string;
};

export type CheckRedditPosterLoginResponse = {
  isLoggedIn: boolean;
  username?: string;
};

export const redditPosterApi = {
  generateRandomPost: (request: GenerateRandomPostRequest) =>
    eden.api['reddit-automation']['generate-random-post'].post(request),

  generatePosts: (request: GeneratePostsRequest) =>
    eden.api['reddit-automation']['generate-posts'].post(request),

  regenerateMedia: (request: RegenerateMediaRequest) =>
    eden.api['reddit-automation']['regenerate-media'].post(request),

  schedulePosts: (request: SchedulePostsRequest) =>
    eden.api['reddit-automation']['schedule-posts'].post(request),

  getScheduledPosts: () =>
    eden.api['reddit-automation']['scheduled-posts'].get(),

  login: (request: RedditPosterLoginRequest) =>
    eden.api['reddit-automation'].login.post(request),

  checkLogin: (request: CheckRedditPosterLoginRequest) =>
    eden.api['reddit-automation']['check-login'].post(request),
};
