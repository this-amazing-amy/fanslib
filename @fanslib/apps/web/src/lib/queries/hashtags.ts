import type {
  DeleteHashtagRequestParamsSchema,
  FindOrCreateHashtagRequestBodySchema,
  FindOrCreateHashtagsBatchRequestBodySchema,
  GetHashtagByIdRequestParamsSchema,
  GetHashtagsByIdsQuerySchema,
  GetHashtagStatsRequestParamsSchema,
  UpdateHashtagStatsRequestBodySchema,
  UpdateHashtagStatsRequestParamsSchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useHashtagsQuery = () =>
  useQuery({
    queryKey: ['hashtags', 'list'],
    queryFn: async () => {
      const result = await eden.api.hashtags.get();
      return result.data;
    },
  });

export const useHashtagQuery = (params: typeof GetHashtagByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['hashtags', params.id],
    queryFn: async () => {
      const result = await eden.api.hashtags({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useHashtagsByIdsQuery = (query: typeof GetHashtagsByIdsQuerySchema.static) =>
  useQuery({
    queryKey: ['hashtags', 'by-ids', query.ids],
    queryFn: async () => {
      const result = await eden.api.hashtags['by-ids'].get({ query });
      return result.data;
    },
    enabled: !!query.ids,
  });

export const useCreateHashtagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof FindOrCreateHashtagRequestBodySchema.static) => {
      const result = await eden.api.hashtags.post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useCreateHashtagsBatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof FindOrCreateHashtagsBatchRequestBodySchema.static) => {
      const result = await eden.api.hashtags.batch.post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useDeleteHashtagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: typeof DeleteHashtagRequestParamsSchema.static) => {
      const result = await eden.api.hashtags({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useHashtagStatsQuery = (params: typeof GetHashtagStatsRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['hashtags', params.id, 'stats'],
    queryFn: async () => {
      const result = await eden.api.hashtags({ id: params.id }).stats.get();
      return result.data;
    },
    enabled: !!params.id,
  });

type UpdateHashtagStatsParams = typeof UpdateHashtagStatsRequestParamsSchema.static & {
  updates: typeof UpdateHashtagStatsRequestBodySchema.static;
};

export const useUpdateHashtagStatsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateHashtagStatsParams) => {
      const result = await eden.api.hashtags({ id }).stats.post(updates);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id] });
    },
  });
};



