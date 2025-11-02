import type {
  CreateSubredditRequest,
  CreateSubredditResponse,
  DeleteSubredditResponse,
  FetchAllSubredditsResponse,
  FetchLastPostDatesForSubredditsRequest,
  FetchLastPostDatesForSubredditsResponse,
  FetchSubredditByIdResponse,
  UpdateSubredditRequest,
  UpdateSubredditResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const subredditsApi = {
  getAll: () =>
    apiRequest<FetchAllSubredditsResponse>('/api/subreddits'),

  getById: (id: string) =>
    apiRequest<FetchSubredditByIdResponse>(`/api/subreddits/${id}`),

  create: (request: CreateSubredditRequest) =>
    apiRequest<CreateSubredditResponse>('/api/subreddits', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: string, request: UpdateSubredditRequest) =>
    apiRequest<UpdateSubredditResponse>(`/api/subreddits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string) =>
    apiRequest<DeleteSubredditResponse>(`/api/subreddits/${id}`, {
      method: 'DELETE',
    }),

  getLastPostDates: (request: FetchLastPostDatesForSubredditsRequest) =>
    apiRequest<FetchLastPostDatesForSubredditsResponse>('/api/subreddits/last-post-dates', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

