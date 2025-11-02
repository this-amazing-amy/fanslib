import type {
  CreateShootRequest,
  CreateShootResponse,
  DeleteShootResponse,
  FetchAllShootsRequest,
  FetchAllShootsResponse,
  FetchShootByIdResponse,
  UpdateShootRequest,
  UpdateShootResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const shootsApi = {
  getAll: (request?: FetchAllShootsRequest) => {
    const searchParams = new URLSearchParams();
    if (request?.page) searchParams.set('page', request.page.toString());
    if (request?.limit) searchParams.set('limit', request.limit.toString());
    if (request?.filter) searchParams.set('filter', JSON.stringify(request.filter));
    const query = searchParams.toString();
    return apiRequest<FetchAllShootsResponse>(`/api/shoots${query ? `?${query}` : ''}`);
  },

  getById: (id: string) =>
    apiRequest<FetchShootByIdResponse>(`/api/shoots/${id}`),

  create: (request: CreateShootRequest) =>
    apiRequest<CreateShootResponse>('/api/shoots', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: string, request: UpdateShootRequest) =>
    apiRequest<UpdateShootResponse>(`/api/shoots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string) =>
    apiRequest<DeleteShootResponse>(`/api/shoots/${id}`, {
      method: 'DELETE',
    }),
};

