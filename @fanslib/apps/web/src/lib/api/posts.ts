import type {
  AddMediaToPostRequest,
  AddMediaToPostResponse,
  CreatePostRequest,
  CreatePostResponse,
  DeletePostResponse,
  FetchAllPostsRequest,
  FetchAllPostsResponse,
  FetchPostByIdResponse,
  FetchPostsByChannelResponse,
  RemoveMediaFromPostRequest,
  RemoveMediaFromPostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
} from '@fanslib/types';
import { apiRequest } from './client';

export const postsApi = {
  getAll: (request?: FetchAllPostsRequest) => {
    const searchParams = new URLSearchParams();
    if (request?.filters) searchParams.set('filters', JSON.stringify(request.filters));
    
    const query = searchParams.toString();
    return apiRequest<FetchAllPostsResponse>(`/api/posts${query ? `?${query}` : ''}`);
  },

  getById: (id: string) =>
    apiRequest<FetchPostByIdResponse>(`/api/posts/${id}`),

  create: (request: CreatePostRequest) =>
    apiRequest<CreatePostResponse>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: string, request: UpdatePostRequest) =>
    apiRequest<UpdatePostResponse>(`/api/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: string) =>
    apiRequest<DeletePostResponse>(`/api/posts/${id}`, {
      method: 'DELETE',
    }),

  byChannel: (channelId: string) =>
    apiRequest<FetchPostsByChannelResponse>(`/api/posts/by-channel/${channelId}`),

  addMedia: (postId: string, request: AddMediaToPostRequest) =>
    apiRequest<AddMediaToPostResponse>(`/api/posts/${postId}/media`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  removeMedia: (postId: string, request: RemoveMediaFromPostRequest) =>
    apiRequest<RemoveMediaFromPostResponse>(`/api/posts/${postId}/media`, {
      method: 'DELETE',
      body: JSON.stringify(request),
    }),
};

