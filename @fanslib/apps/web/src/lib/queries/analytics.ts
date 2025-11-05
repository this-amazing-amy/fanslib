import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';

export const useAnalyticsPostsQuery = (params?: {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}) =>
  useQuery({
    queryKey: ['analytics', 'posts', params],
    queryFn: () => analyticsApi.getPosts(params),
  });

export const useHashtagAnalyticsQuery = () =>
  useQuery({
    queryKey: ['analytics', 'hashtags'],
    queryFn: () => analyticsApi.getHashtagAnalytics(),
  });

export const useTimeAnalyticsQuery = () =>
  useQuery({
    queryKey: ['analytics', 'time'],
    queryFn: () => analyticsApi.getTimeAnalytics(),
  });

export const useInsightsQuery = () =>
  useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: () => analyticsApi.getInsights(),
  });

export const useUpdateCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fetchRequest: string) => analyticsApi.updateCredentialsFromFetch({ fetchRequest }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'fansly-credentials'] });
    },
  });
};

export const useFetchFanslyDataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      startDate,
      endDate,
    }: {
      postId: string;
      startDate?: string;
      endDate?: string;
    }) => analyticsApi.fetchFanslyData({ postId, startDate, endDate }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
    },
  });
};

export const useInitializeAggregatesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analyticsApi.initializeAggregates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};



