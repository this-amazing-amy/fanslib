import type { AddMediaToPostRequestBody, AddMediaToPostRequestBodySchema, AddMediaToPostRequestParams, AddMediaToPostRequestParamsSchema, CreatePostRequestBody, CreatePostRequestBodySchema, DeletePostRequestParams, DeletePostRequestParamsSchema, FetchAllPostsRequestQuery, FetchAllPostsRequestQuerySchema, FetchPostByIdRequestParams, FetchPostByIdRequestParamsSchema, FetchPostsByChannelRequestParams, FetchPostsByChannelRequestParamsSchema, RemoveMediaFromPostRequestBody, RemoveMediaFromPostRequestBodySchema, RemoveMediaFromPostRequestParams, RemoveMediaFromPostRequestParamsSchema, UpdatePostRequestBody, UpdatePostRequestBodySchema, UpdatePostRequestParams, UpdatePostRequestParamsSchema } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';

export const usePostsQuery = (params?: FetchAllPostsRequestQuery) =>
  useQuery({
    queryKey: ['posts', 'list', params],
    queryFn: async () => {
      const result = await api.api.posts.all.$get(params);
      const data = await result.json();
      return data?.posts ?? [];
    },
  });

export const usePostQuery = (params: FetchPostByIdRequestParams) =>
  useQuery({
    queryKey: ['posts', params.id],
    queryFn: async () => {
      const result = await api.api.posts[':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const usePostsByChannelQuery = (params: FetchPostsByChannelRequestParams) =>
  useQuery({
    queryKey: ['posts', 'by-channel', params.channelId],
    queryFn: async () => {
      const result = await api.api.posts['by-channel-id'][':channelId'].$get({ param: { channelId: params.channelId } });
      return result.json();
    },
    enabled: !!params.channelId,
  });

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostRequestBody) => {
      const result = await api.api.posts.$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'by-channel'] });
    },
  });
};

type UpdatePostParams = UpdatePostRequestParams & {
  updates: UpdatePostRequestBody;
};

export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePostParams) => {
      const result = await api.api.posts[':id'].$patch({ param: { id }, json: updates });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
      queryClient.setQueryData(['posts', variables.id], data);
    },
  });
};

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeletePostRequestParams) => {
      const result = await api.api.posts[':id'].$delete({ param: { id: params.id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

type AddMediaToPostParams = AddMediaToPostRequestParams & {
  mediaIds: AddMediaToPostRequestBody['mediaIds'];
};

export const useAddMediaToPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mediaIds }: AddMediaToPostParams) => {
      const result = await api.api.posts[':id'].media.$post({ param: { id }, json: { mediaIds } });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

type RemoveMediaFromPostParams = RemoveMediaFromPostRequestParams & {
  mediaIds: RemoveMediaFromPostRequestBody['mediaIds'];
};

export const useRemoveMediaFromPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mediaIds }: RemoveMediaFromPostParams) => {
      const result = await api.api.posts[':id'].media.$delete({ param: { id }, json: { mediaIds } });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

export const usePostsByMediaIdQuery = (mediaId: string) =>
  useQuery({
    queryKey: ['posts', 'by-media', mediaId],
    queryFn: async () => {
      const result = await api.api.posts['by-media-id'][':mediaId'].$get({ param: { mediaId } });
      return result.json();
    },
    enabled: !!mediaId,
  });

export const useRemoveFromFypMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const result = await api.api.posts[':id'].$patch({ 
        param: { id: postId },
        json: {
          fypRemovedAt: new Date(),
          fypManuallyRemoved: true,
        }
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'fyp-actions'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useTemporalContextPostsQuery = (centerDate: Date, channelId?: string) => {
  const startDate = new Date(centerDate);
  startDate.setDate(startDate.getDate() - 3);
  const endDate = new Date(centerDate);
  endDate.setDate(endDate.getDate() + 3);

  return useQuery({
    queryKey: ['posts', 'temporal-context', channelId ?? 'all', centerDate.toISOString()],
    queryFn: async () => {
      const result = await api.api.posts.all.$get({
        filters: JSON.stringify({
          ...(channelId ? { channels: [channelId] } : {}),
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      });
      const data = await result.json();
      return data?.posts ?? [];
    },
    enabled: !!centerDate,
  });
};

type UpdatePostMediaParams = {
  postId: string;
  postMediaId: string;
  fanslyStatisticsId: string | null;
};

export const useUpdatePostMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, postMediaId, fanslyStatisticsId }: UpdatePostMediaParams) => {
      const result = await api.api.posts[':id'].media[':postMediaId'].$patch({ 
        param: { id: postId, postMediaId },
        json: { fanslyStatisticsId }
      });
      return result.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
    },
  });
};
