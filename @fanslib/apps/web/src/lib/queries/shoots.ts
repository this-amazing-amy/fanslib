import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

type FetchAllShootsParams = {
  page?: number;
  limit?: number;
  filter?: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
  };
};

export const useShootsQuery = (params?: FetchAllShootsParams) =>
  useQuery({
    queryKey: QUERY_KEYS.shoots.list(params),
    queryFn: async () => {
      const result = await api.api.shoots.all.$post({ json: params ?? {} });
      return result.json();
    },
  });

export const useShootQuery = (params: { id: string }) =>
  useQuery({
    queryKey: QUERY_KEYS.shoots.byId(params.id),
    queryFn: async () => {
      const result = await api.api.shoots['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useCreateShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      shootDate: Date;
      mediaIds?: string[];
    }) => {
      const result = await api.api.shoots.$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
    },
  });
};

type UpdateShootParams = {
  id: string;
  updates: {
    name?: string;
    description?: string;
    shootDate?: Date;
    mediaIds?: string[];
  };
};

export const useUpdateShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateShootParams) => {
      const result = await api.api.shoots['by-id'][':id'].$patch({ 
        param: { id },
        json: updates 
      });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
      queryClient.setQueryData(QUERY_KEYS.shoots.byId(variables.id), data);
      // Invalidate media list query when media is added/removed from shoot
      if (variables.updates.mediaIds !== undefined) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
      }
    },
  });
};

export const useDeleteShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string }) => {
      const result = await api.api.shoots['by-id'][':id'].$delete({ param: { id: params.id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
    },
  });
};

export const usePostsByShootIdQuery = (shootId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.shoots.posts(shootId),
    queryFn: async () => {
      const result = await api.api.shoots['by-id'][':id'].posts.$get({ param: { id: shootId } });
      return result.json();
    },
    enabled: !!shootId,
  });



