import type {
    AssignTagsToMediaRequest,
    BulkAssignTagsRequest,
    CreateTagDefinitionRequest,
    CreateTagDimensionRequest,
    FetchDriftPreventionStatsResponse,
    MediaTag,
    PerformDriftPreventionCleanupResponse,
    SyncStickerDisplayPropertiesResponse,
    TagDefinition,
    TagDimension,
    UpdateTagDefinitionRequest,
    UpdateTagDimensionRequest,
} from '@fanslib/types';
import { apiRequest } from './client';

export const tagsApi = {
  getDimensions: () =>
    apiRequest<TagDimension[]>('/api/tags/dimensions'),

  getDimensionById: (id: number) =>
    apiRequest<TagDimension>(`/api/tags/dimensions/${id}`),

  createDimension: (data: CreateTagDimensionRequest) =>
    apiRequest<TagDimension>('/api/tags/dimensions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDimension: (id: number, updates: UpdateTagDimensionRequest) =>
    apiRequest<TagDimension>(`/api/tags/dimensions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteDimension: (id: number) =>
    apiRequest<{ success: boolean }>(`/api/tags/dimensions/${id}`, {
      method: 'DELETE',
    }),

  getDefinitionsByDimension: (dimensionId: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set('dimensionId', dimensionId.toString());
    return apiRequest<TagDefinition[]>(`/api/tags/definitions?${searchParams.toString()}`);
  },

  getDefinitionById: (id: number) =>
    apiRequest<TagDefinition>(`/api/tags/definitions/${id}`),

  getDefinitionsByIds: (ids: number[]) => {
    const searchParams = new URLSearchParams();
    searchParams.set('ids', JSON.stringify(ids));
    return apiRequest<TagDefinition[]>(`/api/tags/definitions/by-ids?${searchParams.toString()}`);
  },

  createDefinition: (data: CreateTagDefinitionRequest) =>
    apiRequest<TagDefinition>('/api/tags/definitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDefinition: (id: number, updates: UpdateTagDefinitionRequest) =>
    apiRequest<TagDefinition>(`/api/tags/definitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteDefinition: (id: number) =>
    apiRequest<{ success: boolean }>(`/api/tags/definitions/${id}`, {
      method: 'DELETE',
    }),

  getMediaTags: (mediaId: string, dimensionId?: number) => {
    const searchParams = new URLSearchParams();
    if (dimensionId) searchParams.set('dimensionId', dimensionId.toString());
    const query = searchParams.toString();
    return apiRequest<MediaTag[]>(`/api/tags/media/${mediaId}${query ? `?${query}` : ''}`);
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

