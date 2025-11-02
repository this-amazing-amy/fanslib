import type {
  CreateSnippetRequest,
  CreateSnippetResponse,
  DeleteSnippetResponse,
  FetchAllSnippetsResponse,
  FetchGlobalSnippetsResponse,
  FetchSnippetByIdResponse,
  FetchSnippetsByChannelResponse,
  IncrementSnippetUsageResponse,
  UpdateSnippetRequest,
  UpdateSnippetResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const snippetsApi = {
  getAll: () =>
    apiRequest<FetchAllSnippetsResponse>('/api/snippets'),

  getGlobal: () =>
    apiRequest<FetchGlobalSnippetsResponse>('/api/snippets/global'),

  getByChannel: (channelId: string) =>
    apiRequest<FetchSnippetsByChannelResponse>(`/api/snippets/by-channel/${channelId}`),

  getById: (id: string) =>
    apiRequest<FetchSnippetByIdResponse>(`/api/snippets/${id}`),

  create: (request: CreateSnippetRequest) =>
    apiRequest<CreateSnippetResponse>('/api/snippets', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: string, request: UpdateSnippetRequest) =>
    apiRequest<UpdateSnippetResponse>(`/api/snippets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string) =>
    apiRequest<DeleteSnippetResponse>(`/api/snippets/${id}`, {
      method: 'DELETE',
    }),

  incrementUsage: (id: string) =>
    apiRequest<IncrementSnippetUsageResponse>(`/api/snippets/${id}/increment-usage`, {
      method: 'POST',
    }),
};

