import type { AddMediaToPostRequestBody, AddMediaToPostRequestParams, CreatePostRequestBody, DeletePostRequestParams, FetchAllPostsRequestQuery, FetchPostByIdRequestParams, FetchPostsByChannelRequestParams, RemoveMediaFromPostRequestBody, RemoveMediaFromPostRequestParams, UpdatePostRequestBody, UpdatePostRequestParams } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

export const usePostsQuery = (params?: FetchAllPostsRequestQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.posts.list(params),
    queryFn: async () => {
      const result = await api.api.posts.all.$get(params);
      const data = await result.json();
      return data?.posts ?? [];
    },
  });

export const usePostQuery = (params: FetchPostByIdRequestParams) =>
  useQuery({
    queryKey: QUERY_KEYS.posts.byId(params.id),
    queryFn: async () => {
      const result = await api.api.posts[':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const usePostsByChannelQuery = (params: FetchPostsByChannelRequestParams) =>
  useQuery({
    queryKey: QUERY_KEYS.posts.byChannel(params.channelId),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline.all });
      queryClient.setQueryData(QUERY_KEYS.posts.byId(variables.id), data);
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pipeline.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.byId(variables.postId) });
    },
  });
};
