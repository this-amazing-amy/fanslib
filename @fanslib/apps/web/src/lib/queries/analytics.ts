import type { FypActionsQuerySchema, GetFanslyPostsWithAnalyticsQuerySchema } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export type CandidateStatus = 'pending' | 'matched' | 'ignored';

export const useAnalyticsHealthQuery = () =>
  useQuery({
    queryKey: ['analytics', 'health'],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics.health.get();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export const useFypActionsQuery = (params?: typeof FypActionsQuerySchema.static) =>
  useQuery({
    queryKey: ['analytics', 'fyp-actions', params],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics['fyp-actions'].get({
        query: params,
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export const useAnalyticsPostsQuery = (params?: typeof GetFanslyPostsWithAnalyticsQuerySchema.static) =>
  useQuery({
    queryKey: ['analytics', 'posts', params],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics.posts.get({ query: params });
      if (error) throw error;
      return data;
    },
  });

export const useCandidatesQuery = () =>
  useQuery({
    queryKey: ['analytics', 'candidates'],
    queryFn: async () => {
      const result = await eden.api.analytics.candidates.get({
        query: { limit: 1000 },
      });
      return result.data;
    },
    retry: false,
    staleTime: 0,
  });

export const useConfirmMatchMutation = () =>
  useMutation({
    mutationFn: async ({ candidateId, postMediaId }: { candidateId: string; postMediaId: string }) => {
      const { data, error } = await eden.api.analytics.candidates['by-id']({ id: candidateId }).match.post({
        postMediaId,
      });
      if (error) throw error;
      return data;
    },
  });

export const useIgnoreCandidateMutation = () =>
  useMutation({
    mutationFn: async (candidateId: string) => {
      const { data, error } = await eden.api.analytics.candidates['by-id']({ id: candidateId }).ignore.post();
      if (error) throw error;
      return data;
    },
  });

export const useBulkConfirmCandidatesMutation = () =>
  useMutation({
    mutationFn: async (threshold: number) => {
      const { data, error } = await eden.api.analytics.candidates['bulk-confirm'].post({
        threshold,
      });
      if (error) throw error;
      return data;
    },
  });

export const useUnmatchCandidateMutation = () =>
  useMutation({
    mutationFn: async (candidateId: string) => {
      const { data, error } = await eden.api.analytics.candidates['by-id']({ id: candidateId }).unmatch.post();
      if (error) throw error;
      return data;
    },
  });

export const useUnignoreCandidateMutation = () =>
  useMutation({
    mutationFn: async (candidateId: string) => {
      const { data, error } = await eden.api.analytics.candidates['by-id']({ id: candidateId }).unignore.post();
      if (error) throw error;
      return data;
    },
  });

export const useHashtagAnalyticsQuery = () =>
  useQuery({
    queryKey: ['analytics', 'hashtags'],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics.hashtags.get();
      if (error) throw error;
      return data;
    },
  });

export const useTimeAnalyticsQuery = () =>
  useQuery({
    queryKey: ['analytics', 'time'],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics.time.get();
      if (error) throw error;
      return data;
    },
  });

export const useInsightsQuery = () =>
  useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics.insights.get();
      if (error) throw error;
      return data;
    },
  });

export const useUpdateCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fetchRequest: string) => {
      const { data, error } = await eden.api.analytics.credentials['update-from-fetch'].post({
        fetchRequest,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'fansly-credentials'] });
    },
  });
};

export const usePostMediaAnalyticsQuery = (postMediaId: string) =>
  useQuery({
    queryKey: ['analytics', 'datapoints', postMediaId],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics.datapoints({ postMediaId }).get();
      if (error) throw error;
      return data;
    },
    enabled: !!postMediaId,
  });

export const useFetchFanslyDataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postMediaId,
      startDate,
      endDate,
    }: {
      postMediaId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data, error } = await eden.api.analytics.fetch['by-id']({ postMediaId }).post({
        startDate,
        endDate,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'datapoints', variables.postMediaId] });
    },
  });
};

export const useInitializeAggregatesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await eden.api.analytics['initialize-aggregates'].post();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};



