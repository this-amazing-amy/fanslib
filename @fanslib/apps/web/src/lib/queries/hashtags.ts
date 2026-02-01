import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

export const useHashtagsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.hashtags.all(),
    queryFn: async () => {
      const result = await api.api.hashtags.all.$get();
      return result.json();
    },
  });

export const useHashtagQuery = (params: { id: string }) =>
  useQuery({
    queryKey: QUERY_KEYS.hashtags.byId(params.id),
    queryFn: async () => {
      const result = await api.api.hashtags['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useHashtagsByIdsQuery = (query: { ids?: string }) =>
  useQuery({
    queryKey: QUERY_KEYS.hashtags.byIds(query.ids),
    queryFn: async () => {
      const result = await api.api.hashtags['by-ids'].$get({ query: { ids: query.ids } });
      return result.json();
    },
    enabled: !!query.ids,
  });

export const useCreateHashtagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const result = await api.api.hashtags.$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hashtags.all() });
    },
  });
};

export const useCreateHashtagsBatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { names: string[] }) => {
      const result = await api.api.hashtags['by-ids'].$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hashtags.all() });
    },
  });
};

export const useDeleteHashtagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string }) => {
      const result = await api.api.hashtags['by-id'][':id'].$delete({ param: { id: params.id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hashtags.all() });
    },
  });
};

export const useHashtagStatsQuery = (params: { id: string }) =>
  useQuery({
    queryKey: QUERY_KEYS.hashtags.stats(params.id),
    queryFn: async () => {
      const result = await api.api.hashtags['by-id'][':id'].stats.$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

type UpdateHashtagStatsParams = {
  id: string;
  updates: {
    channelId: string;
    views: number;
  };
};

export const useUpdateHashtagStatsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateHashtagStatsParams) => {
      const result = await api.api.hashtags['by-id'][':id'].stats.$post({ 
        param: { id },
        json: updates 
      });
      return result.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hashtags.stats(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hashtags.byId(variables.id) });
    },
  });
};



