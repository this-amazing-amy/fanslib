import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';

export const useHashtagsQuery = () =>
  useQuery({
    queryKey: ['hashtags', 'list'],
    queryFn: async () => {
      const result = await api.api.hashtags.all.$get();
      return result.json();
    },
  });

export const useHashtagQuery = (params: { id: string }) =>
  useQuery({
    queryKey: ['hashtags', params.id],
    queryFn: async () => {
      const result = await api.api.hashtags['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useHashtagsByIdsQuery = (query: { ids?: string }) =>
  useQuery({
    queryKey: ['hashtags', 'by-ids', query.ids],
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
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
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
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
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
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useHashtagStatsQuery = (params: { id: string }) =>
  useQuery({
    queryKey: ['hashtags', params.id, 'stats'],
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
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id] });
    },
  });
};



