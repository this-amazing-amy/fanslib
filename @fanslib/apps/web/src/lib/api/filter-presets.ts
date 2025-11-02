import type {
  CreateFilterPresetRequest,
  CreateFilterPresetResponse,
  DeleteFilterPresetResponse,
  FetchAllFilterPresetsResponse,
  FetchFilterPresetByIdResponse,
  UpdateFilterPresetRequest,
  UpdateFilterPresetResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const filterPresetsApi = {
  getAll: () =>
    apiRequest<FetchAllFilterPresetsResponse>('/api/filter-presets'),

  getById: (id: string) =>
    apiRequest<FetchFilterPresetByIdResponse>(`/api/filter-presets/${id}`),

  create: (request: CreateFilterPresetRequest) =>
    apiRequest<CreateFilterPresetResponse>('/api/filter-presets', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: string, request: UpdateFilterPresetRequest) =>
    apiRequest<UpdateFilterPresetResponse>(`/api/filter-presets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string) =>
    apiRequest<DeleteFilterPresetResponse>(`/api/filter-presets/${id}`, {
      method: 'DELETE',
    }),
};

