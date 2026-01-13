import type {
    AddMediaToPostRequestBodySchema,
    AddMediaToPostRequestParamsSchema,
    CreatePostRequestBodySchema,
    DeletePostRequestParamsSchema,
    FetchAllPostsRequestQuerySchema,
    FetchPostByIdRequestParamsSchema,
    FetchPostsByChannelRequestParamsSchema,
    RemoveMediaFromPostRequestBodySchema,
    RemoveMediaFromPostRequestParamsSchema,
    UpdatePostRequestBodySchema,
    UpdatePostRequestParamsSchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const usePostsQuery = (params?: typeof FetchAllPostsRequestQuerySchema.static) =>
  useQuery({
    queryKey: ['posts', 'list', params],
    queryFn: async () => {
      const result = await eden.api.posts.all.get({ query: params });
      return result.data?.posts ?? [];
    },
  });

export const usePostQuery = (params: typeof FetchPostByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['posts', params.id],
    queryFn: async () => {
      const result = await eden.api.posts['by-id']({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const usePostsByChannelQuery = (params: typeof FetchPostsByChannelRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['posts', 'by-channel', params.channelId],
    queryFn: async () => {
      const result = await eden.api.posts['by-channel-id']({ channelId: params.channelId }).get();
      return result.data;
    },
    enabled: !!params.channelId,
  });

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreatePostRequestBodySchema.static) => {
      const result = await eden.api.posts.post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'by-channel'] });
    },
  });
};

type UpdatePostParams = typeof UpdatePostRequestParamsSchema.static & {
  updates: typeof UpdatePostRequestBodySchema.static;
};

export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePostParams) => {
      const { data, error } = await eden.api.posts['by-id']({ id }).patch(updates);
      if (error) throw error;
      return data;
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
    mutationFn: async (params: typeof DeletePostRequestParamsSchema.static) => {
      const result = await eden.api.posts['by-id']({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

type AddMediaToPostParams = typeof AddMediaToPostRequestParamsSchema.static & {
  mediaIds: typeof AddMediaToPostRequestBodySchema.static['mediaIds'];
};

export const useAddMediaToPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mediaIds }: AddMediaToPostParams) => {
      const result = await eden.api.posts['by-id']({ id }).media.post({ mediaIds });
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
    },
  });
};

type RemoveMediaFromPostParams = typeof RemoveMediaFromPostRequestParamsSchema.static & {
  mediaIds: typeof RemoveMediaFromPostRequestBodySchema.static['mediaIds'];
};

export const useRemoveMediaFromPostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mediaIds }: RemoveMediaFromPostParams) => {
      const result = await eden.api.posts['by-id']({ id }).media.delete({ mediaIds });
      return result.data;
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
      const result = await eden.api.posts['by-media-id']({ mediaId }).get();
      return result.data;
    },
    enabled: !!mediaId,
  });

export const useTemporalContextPostsQuery = (centerDate: Date, channelId?: string) => {
  const startDate = new Date(centerDate);
  startDate.setDate(startDate.getDate() - 3);
  const endDate = new Date(centerDate);
  endDate.setDate(endDate.getDate() + 3);

  return useQuery({
    queryKey: ['posts', 'temporal-context', channelId ?? 'all', centerDate.toISOString()],
    queryFn: async () => {
      const result = await eden.api.posts.all.get({
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
      return result.data?.posts ?? [];
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
      const { data, error } = await eden.api.posts['by-id']({ id: postId }).media({ postMediaId }).patch({
        fanslyStatisticsId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
    },
  });
};
