import type {
  DeleteHashtagResponse,
  FetchAllHashtagsResponse,
  FetchHashtagByIdResponse,
  FetchHashtagsByIdsRequest,
  FetchHashtagsByIdsResponse,
  FetchHashtagStatsResponse,
  FindOrCreateHashtagRequest,
  FindOrCreateHashtagResponse,
  FindOrCreateHashtagsBatchRequest,
  FindOrCreateHashtagsBatchResponse,
  UpdateHashtagStatsRequest,
  UpdateHashtagStatsResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const hashtagsApi = {
  getAll: () =>
    apiRequest<FetchAllHashtagsResponse>('/api/hashtags'),

  getById: (id: number) =>
    apiRequest<FetchHashtagByIdResponse>(`/api/hashtags/${id}`),

  getByIds: (request: FetchHashtagsByIdsRequest) => {
    const searchParams = new URLSearchParams();
    searchParams.set('ids', JSON.stringify(request.ids));
    return apiRequest<FetchHashtagsByIdsResponse>(`/api/hashtags/by-ids?${searchParams.toString()}`);
  },

  create: (request: FindOrCreateHashtagRequest) =>
    apiRequest<FindOrCreateHashtagResponse>('/api/hashtags', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  createBatch: (request: FindOrCreateHashtagsBatchRequest) =>
    apiRequest<FindOrCreateHashtagsBatchResponse>('/api/hashtags/batch', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  delete: (id: number) =>
    apiRequest<DeleteHashtagResponse>(`/api/hashtags/${id}`, {
      method: 'DELETE',
    }),

  getStats: (id: number) =>
    apiRequest<FetchHashtagStatsResponse>(`/api/hashtags/${id}/stats`),

  updateStats: (id: number, request: UpdateHashtagStatsRequest) =>
    apiRequest<UpdateHashtagStatsResponse>(`/api/hashtags/${id}/stats`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

