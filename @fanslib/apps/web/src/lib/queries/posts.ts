import type { AddMediaToPostRequestBody, CreatePostRequestBody, RemoveMediaFromPostRequestBody, UpdatePostRequestBody } from '@fanslib/server/schemas';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

type PostFilters = {
  filters?: string;
};

// Reusable query options for route loaders
export const postsQueryOptions = (params?: PostFilters) =>
  queryOptions({
    queryKey: QUERY_KEYS.posts.list(params),
    queryFn: async () => {
      const result = await api.api.posts.all.$get({ query: params ?? {} });
      const data = await result.json();
      return data?.posts ?? [];
    },
  });

export const usePostsQuery = (params?: PostFilters) =>
  useQuery(postsQueryOptions(params));

export const usePostQuery = (params: { id: string }) =>
  useQuery({
    queryKey: QUERY_KEYS.posts.byId(params.id),
    queryFn: async () => {
      const result = await api.api.posts['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const usePostsByChannelQuery = (channelId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.posts.byChannel(channelId),
    queryFn: async () => {
      const result = await api.api.posts['by-channel-id'][':channelId'].$get({ param: { channelId } });
      return result.json();
    },
    enabled: !!channelId,
  });

export const useRecentPostsQuery = (params: { channelId: string; limit?: number }) =>
  useQuery({
    queryKey: QUERY_KEYS.posts.recent(params.channelId, params.limit),
    queryFn: async () => {
      const result = await api.api.posts.recent.$get({ 
        query: { 
          channelId: params.channelId, 
          limit: params.limit?.toString() 
        } 
      });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
    },
  });
};

type UpdatePostParams = {
  id: string;
  updates: UpdatePostRequestBody;
};

export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePostParams) => {
      const result = await api.api.posts['by-id'][':id'].$patch({ param: { id }, json: updates });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline.all });
      queryClient.setQueryData(QUERY_KEYS.posts.byId(variables.id), data);
    },
  });
};

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.api.posts['by-id'][':id'].$delete({ param: { id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
    },
  });
};

type AddMediaToPostParams = {
  id: string;
  mediaIds: AddMediaToPostRequestBody['mediaIds'];
};

export const useAddMediaToPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mediaIds }: AddMediaToPostParams) => {
      const result = await api.api.posts['by-id'][':id'].media.$post({ param: { id }, json: { mediaIds } });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
    },
  });
};

type RemoveMediaFromPostParams = {
  id: string;
  mediaIds: RemoveMediaFromPostRequestBody['mediaIds'];
};

export const useRemoveMediaFromPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mediaIds }: RemoveMediaFromPostParams) => {
      const result = await api.api.posts['by-id'][':id'].media.$delete({ param: { id }, json: { mediaIds } });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
    },
  });
};

export const usePostsByMediaIdQuery = (mediaId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.posts.byMedia(mediaId),
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
      const result = await api.api.posts['by-id'][':id'].$patch({ 
        param: { id: postId },
        json: {
          fypRemovedAt: new Date(),
          fypManuallyRemoved: true,
        }
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
    },
  });
};

export const useTemporalContextPostsQuery = (centerDate: Date, channelId?: string) => {
  const startDate = new Date(centerDate);
  startDate.setDate(startDate.getDate() - 3);
  const endDate = new Date(centerDate);
  endDate.setDate(endDate.getDate() + 3);

  return useQuery({
    queryKey: QUERY_KEYS.posts.temporalContext(channelId ?? 'all', centerDate.toISOString()),
    queryFn: async () => {
      const result = await api.api.posts.all.$get({
        query: {
          filters: JSON.stringify({
            ...(channelId ? { channels: [channelId] } : {}),
            dateRange: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          }),
        },
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
      const result = await api.api.posts['by-id'][':id'].media[':postMediaId'].$patch({ 
        param: { id: postId, postMediaId },
        json: { fanslyStatisticsId }
      });
      return result.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.byId(variables.postId) });
    },
  });
};
