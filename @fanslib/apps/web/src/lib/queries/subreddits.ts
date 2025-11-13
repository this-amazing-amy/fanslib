import type {
  CreateSubredditRequestBodySchema,
  DeleteSubredditParamsSchema,
  FetchLastPostDatesRequestBodySchema,
  FetchSubredditByIdRequestParamsSchema,
  UpdateSubredditRequestBodySchema,
  UpdateSubredditRequestParamsSchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useSubredditsQuery = () =>
  useQuery({
    queryKey: ['subreddits', 'list'],
    queryFn: async () => {
      const result = await eden.api.subreddits.all.get();
      return result.data;
    },
  });

export const useSubredditQuery = (params: typeof FetchSubredditByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['subreddits', params.id],
    queryFn: async () => {
      const result = await eden.api.subreddits['by-id']({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useLastPostDatesQuery = (params: typeof FetchLastPostDatesRequestBodySchema.static) =>
  useQuery({
    queryKey: ['subreddits', 'last-post-dates', params.subredditIds],
    queryFn: async () => {
      const result = await eden.api.subreddits['last-post-dates'].post({ subredditIds: params.subredditIds });
      return result.data;
    },
    enabled: params.subredditIds.length > 0,
  });

export const useCreateSubredditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateSubredditRequestBodySchema.static) => {
      const result = await eden.api.subreddits.post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
    },
  });
};

type UpdateSubredditParams = typeof UpdateSubredditRequestParamsSchema.static & {
  updates: typeof UpdateSubredditRequestBodySchema.static;
};

export const useUpdateSubredditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateSubredditParams) => {
      const result = await eden.api.subreddits['by-id']({ id }).patch(updates);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
      queryClient.setQueryData(['subreddits', variables.id], data);
    },
  });
};

export const useDeleteSubredditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: typeof DeleteSubredditParamsSchema.static) => {
      const result = await eden.api.subreddits['by-id']({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
    },
  });
};
