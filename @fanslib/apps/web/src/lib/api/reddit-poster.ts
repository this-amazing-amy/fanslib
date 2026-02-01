import type { Media, Subreddit } from '@fanslib/server/schemas';
import { api } from './hono-client';


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
  generateRandomPost: async (request: GenerateRandomPostRequest) => {
    const response = await api.api['reddit-automation']['generate-random-post'].$post({ json: request });
    return response.json();
  },

  generatePosts: async (request: GeneratePostsRequest) => {
    const response = await api.api['reddit-automation']['generate-posts'].$post({ json: request });
    return response.json();
  },

  regenerateMedia: async (request: RegenerateMediaRequest) => {
    const response = await api.api['reddit-automation']['regenerate-media'].$post({ json: request });
    return response.json();
  },

  schedulePosts: async (request: SchedulePostsRequest) => {
    const response = await api.api['reddit-automation']['schedule-posts'].$post({ json: request });
    return response.json();
  },

  getScheduledPosts: async () => {
    const response = await api.api['reddit-automation']['scheduled-posts'].$get();
    return response.json();
  },

  login: async (request: RedditPosterLoginRequest) => {
    const response = await api.api['reddit-automation'].login.$post({ json: request });
    return response.json();
  },

  checkLogin: async (request: CheckRedditPosterLoginRequest) => {
    const response = await api.api['reddit-automation']['check-login'].$post({ json: request });
    return response.json();
  },
};
