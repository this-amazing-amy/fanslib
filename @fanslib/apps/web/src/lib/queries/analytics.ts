import type { GetFanslyPostsWithAnalyticsQuerySchema } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useAnalyticsPostsQuery = (params?: typeof GetFanslyPostsWithAnalyticsQuerySchema.static) =>
  useQuery({
    queryKey: ['analytics', 'posts', params],
    queryFn: async () => {
      const { data, error } = await eden.api.analytics.posts.get({ query: params });
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

export const useFetchFanslyDataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      startDate,
      endDate,
    }: {
      postId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data, error } = await eden.api.analytics.fetch[postId].post({
        startDate,
        endDate,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', variables.postId] });
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



