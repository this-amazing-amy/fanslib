import type {
  ActionableInsight,
  FanslyPostWithAnalytics,
  HashtagAnalytics,
  TimeAnalytics,
} from '@fanslib/types';
import { apiRequest } from './client';

export type FetchFanslyDataRequest = {
  postId: string;
  startDate?: string;
  endDate?: string;
};

export type FetchFanslyDataResponse = unknown;

export type FetchAnalyticsPostsRequest = {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
};

export type FetchAnalyticsPostsResponse = FanslyPostWithAnalytics[];

export type UpdateCredentialsFromFetchRequest = {
  fetchRequest: string;
};

export type UpdateCredentialsFromFetchResponse = {
  success: boolean;
};

export type InitializeAggregatesResponse = {
  success: boolean;
};

export const analyticsApi = {
  updateCredentialsFromFetch: (request: UpdateCredentialsFromFetchRequest) =>
    apiRequest<UpdateCredentialsFromFetchResponse>('/api/analytics/credentials/update-from-fetch', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  fetchFanslyData: (request: FetchFanslyDataRequest) =>
    apiRequest<FetchFanslyDataResponse>(`/api/analytics/fetch/${request.postId}`, {
      method: 'POST',
      body: JSON.stringify({ startDate: request.startDate, endDate: request.endDate }),
    }),

  getPosts: (request?: FetchAnalyticsPostsRequest) => {
    const queryParams = new URLSearchParams();
    if (request?.sortBy) queryParams.append('sortBy', request.sortBy);
    if (request?.sortDirection) queryParams.append('sortDirection', request.sortDirection);
    if (request?.startDate) queryParams.append('startDate', request.startDate);
    if (request?.endDate) queryParams.append('endDate', request.endDate);
    const queryString = queryParams.toString();
    return apiRequest<FetchAnalyticsPostsResponse>(
      `/api/analytics/posts${queryString ? `?${queryString}` : ''}`
    );
  },

  getHashtagAnalytics: () =>
    apiRequest<HashtagAnalytics>('/api/analytics/hashtags'),

  getTimeAnalytics: () =>
    apiRequest<TimeAnalytics>('/api/analytics/time'),

  getInsights: () =>
    apiRequest<ActionableInsight[]>('/api/analytics/insights'),

  initializeAggregates: () =>
    apiRequest<InitializeAggregatesResponse>('/api/analytics/initialize-aggregates', {
      method: 'POST',
    }),
};

