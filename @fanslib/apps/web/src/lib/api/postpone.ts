import type {
  DraftBlueskyPostRequest,
  DraftBlueskyPostResponse,
  FindRedgifsURLRequest,
  FindRedgifsURLResponse,
  FindSubredditPostingTimesRequest,
  FindSubredditPostingTimesResponse,
  RefreshRedgifsURLRequest,
  RefreshRedgifsURLResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const postponeApi = {
  draftBluesky: (request: DraftBlueskyPostRequest) =>
    apiRequest<DraftBlueskyPostResponse>('/api/postpone/draft-bluesky', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  findRedgifsUrl: (request: FindRedgifsURLRequest) =>
    apiRequest<FindRedgifsURLResponse>('/api/postpone/find-redgifs-url', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  refreshRedgifsUrl: (request: RefreshRedgifsURLRequest) =>
    apiRequest<RefreshRedgifsURLResponse>('/api/postpone/refresh-redgifs-url', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  findSubredditPostingTimes: (request: FindSubredditPostingTimesRequest) =>
    apiRequest<FindSubredditPostingTimesResponse>('/api/postpone/find-subreddit-posting-times', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

