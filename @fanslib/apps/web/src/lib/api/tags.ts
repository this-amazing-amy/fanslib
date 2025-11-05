import type {
  AssignTagsToMediaRequest,
  BulkAssignTagsRequest,
  CreateTagDefinitionRequest,
  CreateTagDefinitionResponse,
  CreateTagDimensionRequest,
  CreateTagDimensionResponse,
  DeleteTagDefinitionResponse,
  DeleteTagDimensionResponse,
  // Tag operations
  FetchAllTagDimensionsResponse,
  FetchDriftPreventionStatsResponse,
  FetchMediaTagsResponse,
  FetchTagDefinitionByIdResponse,
  FetchTagDefinitionsByDimensionResponse,
  FetchTagDefinitionsByIdsResponse,
  FetchTagDimensionByIdResponse,
  MediaTag,
  PerformDriftPreventionCleanupResponse,
  SyncStickerDisplayPropertiesResponse,
  UpdateTagDefinitionRequest,
  UpdateTagDefinitionResponse,
  UpdateTagDimensionRequest,
  UpdateTagDimensionResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const tagsApi = {
  getDimensions: () =>
    apiRequest<FetchAllTagDimensionsResponse>('/api/tags/dimensions'),

  getDimensionById: (id: number) =>
    apiRequest<FetchTagDimensionByIdResponse>(`/api/tags/dimensions/${id}`),

  createDimension: (data: CreateTagDimensionRequest) =>
    apiRequest<CreateTagDimensionResponse>('/api/tags/dimensions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDimension: (id: number, updates: UpdateTagDimensionRequest) =>
    apiRequest<UpdateTagDimensionResponse>(`/api/tags/dimensions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteDimension: (id: number) =>
    apiRequest<DeleteTagDimensionResponse>(`/api/tags/dimensions/${id}`, {
      method: 'DELETE',
    }),

  getDefinitionsByDimension: (dimensionId: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set('dimensionId', dimensionId.toString());
    return apiRequest<FetchTagDefinitionsByDimensionResponse>(`/api/tags/definitions?${searchParams.toString()}`);
  },

  getDefinitionById: (id: number) =>
    apiRequest<FetchTagDefinitionByIdResponse>(`/api/tags/definitions/${id}`),

  getDefinitionsByIds: (ids: number[]) => {
    const searchParams = new URLSearchParams();
    searchParams.set('ids', JSON.stringify(ids));
    return apiRequest<FetchTagDefinitionsByIdsResponse>(`/api/tags/definitions/by-ids?${searchParams.toString()}`);
  },

  createDefinition: (data: CreateTagDefinitionRequest) =>
    apiRequest<CreateTagDefinitionResponse>('/api/tags/definitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDefinition: (id: number, updates: UpdateTagDefinitionRequest) =>
    apiRequest<UpdateTagDefinitionResponse>(`/api/tags/definitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteDefinition: (id: number) =>
    apiRequest<DeleteTagDefinitionResponse>(`/api/tags/definitions/${id}`, {
      method: 'DELETE',
    }),

  getMediaTags: (mediaId: string, dimensionId?: number) => {
    const searchParams = new URLSearchParams();
    if (dimensionId) searchParams.set('dimensionId', dimensionId.toString());
    const query = searchParams.toString();
    return apiRequest<FetchMediaTagsResponse>(`/api/tags/media/${mediaId}${query ? `?${query}` : ''}`);
  },

  assignTagsToMedia: (data: AssignTagsToMediaRequest) =>
    apiRequest<MediaTag[]>('/api/tags/media/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkAssignTags: (assignments: BulkAssignTagsRequest) =>
    apiRequest<MediaTag[]>('/api/tags/media/assign-bulk', {
      method: 'POST',
      body: JSON.stringify(assignments),
    }),

  removeTagsFromMedia: (mediaId: string, tagIds: number[]) =>
    apiRequest<{ success: boolean }>(`/api/tags/media/${mediaId}`, {
      method: 'DELETE',
      body: JSON.stringify({ tagIds }),
    }),

  getDriftPreventionStats: () =>
    apiRequest<FetchDriftPreventionStatsResponse>('/api/tags/drift-prevention/stats'),

  performCleanup: () =>
    apiRequest<PerformDriftPreventionCleanupResponse>('/api/tags/drift-prevention/cleanup', {
      method: 'POST',
    }),

  syncStickerDisplay: () =>
    apiRequest<SyncStickerDisplayPropertiesResponse>('/api/tags/drift-prevention/sync-sticker-display', {
      method: 'POST',
    }),
};

