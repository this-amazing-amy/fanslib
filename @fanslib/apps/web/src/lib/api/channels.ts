import type {
  CreateChannelRequest,
  CreateChannelResponse,
  DeleteChannelResponse,
  FetchAllChannelTypesResponse,
  FetchAllChannelsResponse,
  FetchChannelByIdResponse,
  UpdateChannelRequest,
  UpdateChannelResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const channelsApi = {
  getAll: () =>
    apiRequest<FetchAllChannelsResponse>('/api/channels'),

  getById: (id: string) =>
    apiRequest<FetchChannelByIdResponse>(`/api/channels/${id}`),

  getTypes: () =>
    apiRequest<FetchAllChannelTypesResponse>('/api/channels/types'),

  create: (request: CreateChannelRequest) =>
    apiRequest<CreateChannelResponse>('/api/channels', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: string, request: UpdateChannelRequest) =>
    apiRequest<UpdateChannelResponse>(`/api/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string) =>
    apiRequest<DeleteChannelResponse>(`/api/channels/${id}`, {
      method: 'DELETE',
    }),
};

