import type {
  CreateContentScheduleRequest,
  CreateContentScheduleResponse,
  DeleteContentScheduleResponse,
  FetchAllContentSchedulesResponse,
  FetchContentScheduleByIdResponse,
  FetchContentSchedulesByChannelResponse,
  UpdateContentScheduleRequest,
  UpdateContentScheduleResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const contentSchedulesApi = {
  getAll: () =>
    apiRequest<FetchAllContentSchedulesResponse>('/api/content-schedules'),

  getById: (id: string) =>
    apiRequest<FetchContentScheduleByIdResponse>(`/api/content-schedules/${id}`),

  getByChannel: (channelId: string) =>
    apiRequest<FetchContentSchedulesByChannelResponse>(`/api/content-schedules/by-channel/${channelId}`),

  create: (request: CreateContentScheduleRequest) =>
    apiRequest<CreateContentScheduleResponse>('/api/content-schedules', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: string, request: UpdateContentScheduleRequest) =>
    apiRequest<UpdateContentScheduleResponse>(`/api/content-schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string) =>
    apiRequest<DeleteContentScheduleResponse>(`/api/content-schedules/${id}`, {
      method: 'DELETE',
    }),
};

