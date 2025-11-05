import type {
  DeleteMediaResponse,
  FetchAllMediaRequest,
  FetchAllMediaResponse,
  FindAdjacentMediaRequest,
  FindAdjacentMediaResponse,
  FetchMediaByIdResponse,
  UpdateMediaRequest,
  UpdateMediaResponse,
  GetScanStatusResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const mediaApi = {
  getAll: (request?: FetchAllMediaRequest) => {
    const searchParams = new URLSearchParams();
    if (request?.page) searchParams.set('page', request.page.toString());
    if (request?.limit) searchParams.set('limit', request.limit.toString());
    if (request?.filters) searchParams.set('filters', JSON.stringify(request.filters));
    if (request?.sort) searchParams.set('sort', JSON.stringify(request.sort));
    
    const query = searchParams.toString();
    return apiRequest<FetchAllMediaResponse>(
      `/api/media${query ? `?${query}` : ''}`
    );
  },

  getById: (id: string) =>
    apiRequest<FetchMediaByIdResponse>(`/api/media/${id}`),

  update: (id: string, request: UpdateMediaRequest) =>
    apiRequest<UpdateMediaResponse>(`/api/media/${id}`, {
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

