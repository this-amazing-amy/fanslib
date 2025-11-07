import type {
  DeleteMediaResponse,
  FetchAllMediaRequest,
  FindAdjacentMediaRequest,
  FindAdjacentMediaResponse,
  GetScanStatusResponse,
  UpdateMediaRequest,
} from '@fanslib/types';
import {
  MediaSchema,
  UpdateMediaResponseSchema
} from '@fanslib/types';
import { apiRequest, apiRequestWithSchema } from './client';
import { eden } from './eden';

export const mediaApi = {
  getAll: (request?: FetchAllMediaRequest) => 

  getById: (id: string) =>
    apiRequestWithSchema(`/api/media/${id}`, MediaSchema),

  update: (id: string, request: UpdateMediaRequest) =>
    apiRequestWithSchema(`/api/media/${id}`, UpdateMediaResponseSchema, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string, deleteFile = false) =>
    apiRequest<DeleteMediaResponse>(
      `/api/media/${id}?deleteFile=${deleteFile}`,
      { method: 'DELETE' }
    ),

  getAdjacent: (id: string, request?: FindAdjacentMediaRequest) => {
    const searchParams = new URLSearchParams();
    if (request?.filters) searchParams.set('filters', JSON.stringify(request.filters));
    if (request?.sort) searchParams.set('sort', JSON.stringify(request.sort));

    const query = searchParams.toString();
    return apiRequest<FindAdjacentMediaResponse>(
      `/api/media/${id}/adjacent${query ? `?${query}` : ''}`
    );
  },

  scan: () =>
    apiRequest<{ message: string; started: boolean }>('/api/media/scan', {
      method: 'POST',
    }),

  getScanStatus: () =>
    apiRequest<GetScanStatusResponse>('/api/media/scan/status'),

  getFileUrl: (id: string) => `/api/media/${id}/file`,

  getThumbnailUrl: (id: string) => `/api/media/${id}/thumbnail`,
};

