import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { useFindSubredditPostingTimesMutation } from './postpone';

export const useSubredditsQuery = () =>
  useQuery({
    queryKey: ['subreddits', 'list'],
    queryFn: async () => {
      const result = await api.api.subreddits.all.$get();
      return result.json();
    },
  });

export const useSubredditQuery = (params: { id: string }) =>
  useQuery({
    queryKey: ['subreddits', params.id],
    queryFn: async () => {
      const result = await api.api.subreddits['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useLastPostDatesQuery = (params: { subredditIds: string[] }) =>
  useQuery({
    queryKey: ['subreddits', 'last-post-dates', params.subredditIds],
    queryFn: async () => {
      const result = await api.api.subreddits['last-post-dates'].$post({ json: { subredditIds: params.subredditIds } });
      return result.json();
    },
    enabled: params.subredditIds.length > 0,
  });

export const useCreateSubredditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; maxPostFrequencyHours?: number | null; notes?: string | null }) => {
      const result = await api.api.subreddits.$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
    },
  });
};

type UpdateSubredditParams = {
  id: string;
  updates: {
    name?: string;
    maxPostFrequencyHours?: number | null;
    notes?: string | null;
    memberCount?: number | null;
    eligibleMediaFilter?: unknown | null;
    verificationStatus?: string;
    defaultFlair?: string | null;
    captionPrefix?: string | null;
    postingTimesData?: Array<{
      day: number;
      hour: number;
      posts: number;
      score: number;
    }> | null;
    postingTimesLastFetched?: Date | null;
    postingTimesTimezone?: string | null;
  };
};

export const useUpdateSubredditMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateSubredditParams) => {
      const result = await api.api.subreddits['by-id'][':id'].$patch({ param: { id }, json: updates });
      return result.json();
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
    mutationFn: async (params: { id: string }) => {
      const result = await api.api.subreddits['by-id'][':id'].$delete({ param: { id: params.id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
    },
  });
};

type AnalyzePostingTimesParams = {
  subredditId: string;
  subredditName: string;
  timezone?: string;
};

export const useAnalyzePostingTimesMutation = () => {
  const queryClient = useQueryClient();
  const updateSubredditMutation = useUpdateSubredditMutation();
  const findPostingTimesMutation = useFindSubredditPostingTimesMutation();

  return useMutation({
    mutationFn: async ({ subredditId, subredditName, timezone }: AnalyzePostingTimesParams) => {
      const result = await findPostingTimesMutation.mutateAsync({
        subreddit: subredditName,
        timezone,
      });

      if (!result?.postingTimes) {
        throw new Error('No posting times data received');
      }

      await updateSubredditMutation.mutateAsync({
        id: subredditId,
        updates: {
          postingTimesData: result.postingTimes,
          postingTimesTimezone: result.timezone ?? undefined,
        },
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subreddits', 'list'] });
    },
  });
};
