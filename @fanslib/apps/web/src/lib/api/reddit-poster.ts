import type { GeneratedPost, RegenerateMediaResult, ScheduledPost, Subreddit } from '@fanslib/types';
import { apiRequest } from './client';

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
    apiRequest<GenerateRandomPostResponse>('/api/reddit-poster/generate-random-post', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  generatePosts: (request: GeneratePostsRequest) =>
    apiRequest<GeneratePostsResponse>('/api/reddit-poster/generate-posts', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  regenerateMedia: (request: RegenerateMediaRequest) =>
    apiRequest<RegenerateMediaResponse>('/api/reddit-poster/regenerate-media', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  schedulePosts: (request: SchedulePostsRequest) =>
    apiRequest<SchedulePostsResponse>('/api/reddit-poster/schedule-posts', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getScheduledPosts: () =>
    apiRequest<GetScheduledPostsResponse>('/api/reddit-poster/scheduled-posts'),

  login: (request: RedditPosterLoginRequest) =>
    apiRequest<RedditPosterLoginResponse>('/api/reddit-poster/login', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  checkLogin: (request: CheckRedditPosterLoginRequest) =>
    apiRequest<CheckRedditPosterLoginResponse>('/api/reddit-poster/check-login', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

