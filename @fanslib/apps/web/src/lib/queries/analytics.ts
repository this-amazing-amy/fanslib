import type { FypActionsQuery, GetFanslyPostsWithAnalyticsQuery } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

export type CandidateStatus = 'pending' | 'matched' | 'ignored';

export const useAnalyticsHealthQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.health(),
    queryFn: async () => {
      const result = await api.api.analytics.health.$get();
      return result.json();
    },
    staleTime: 60_000,
  });

export const useFypActionsQuery = (params?: FypActionsQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.fypActions(params),
    queryFn: async () => {
      const result = await api.api.analytics['fyp-actions'].$get(params);
      return result.json();
    },
    staleTime: 60_000,
  });

export const useAnalyticsPostsQuery = (params?: GetFanslyPostsWithAnalyticsQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.posts(params),
    queryFn: async () => {
      const result = await api.api.analytics.posts.$get(params);
      return result.json();
    },
  });

export const useCandidatesQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.candidates(),
    queryFn: async () => {
      const result = await api.api.analytics.candidates.$get({ limit: 1000 });
      return result.json();
    },
    retry: false,
    staleTime: 0,
  });

export const useConfirmMatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidateId, postMediaId }: { candidateId: string; postMediaId: string }) => {
      const result = await api.api.analytics.candidates[':id'].match.$post({ 
        param: { id: candidateId },
        json: { postMediaId }
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.candidates() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.posts() });
    },
  });
};

export const useIgnoreCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const result = await api.api.analytics.candidates[':id'].ignore.$post({ param: { id: candidateId } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.candidates() });
    },
  });
};

export const useBulkConfirmCandidatesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threshold: number) => {
      const result = await api.api.analytics.candidates['bulk-confirm'].$post({ json: { threshold } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.candidates() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.posts() });
    },
  });
};

export const useUnmatchCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const result = await api.api.analytics.candidates[':id'].unmatch.$post({ param: { id: candidateId } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.candidates() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.posts() });
    },
  });
};

export const useUnignoreCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const result = await api.api.analytics.candidates[':id'].unignore.$post({ param: { id: candidateId } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.candidates() });
    },
  });
};

export const useHashtagAnalyticsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.hashtags(),
    queryFn: async () => {
      const result = await api.api.analytics.hashtags.$get();
      return result.json();
    },
  });

export const useTimeAnalyticsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.time(),
    queryFn: async () => {
      const result = await api.api.analytics.time.$get();
      return result.json();
    },
  });

export const useInsightsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.insights(),
    queryFn: async () => {
      const result = await api.api.analytics.insights.$get();
      return result.json();
    },
  });

export const useUpdateCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fetchRequest: string) => {
      const result = await api.api.analytics.credentials['update-from-fetch'].$post({ json: { fetchRequest } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.fanslyCredentials() });
    },
  });
};

export const usePostMediaAnalyticsQuery = (postMediaId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.analytics.datapoints(postMediaId),
    queryFn: async () => {
      const result = await api.api.analytics.datapoints[':postMediaId'].$get({ param: { postMediaId } });
      return result.json();
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
      const result = await api.api.analytics.fetch[':postMediaId'].$post({ 
        param: { postMediaId },
        json: { startDate, endDate }
      });
      return result.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.posts() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.datapoints(variables.postMediaId) });
    },
  });
};

export const useInitializeAggregatesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await api.api.analytics['initialize-aggregates'].$post();
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
    },
  });
};



