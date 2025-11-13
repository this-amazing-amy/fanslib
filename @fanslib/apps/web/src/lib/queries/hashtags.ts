import type {
  DeleteHashtagRequestParamsSchema,
  FetchHashtagByIdRequestParamsSchema,
  FetchHashtagsByIdsQuerySchema,
  FetchHashtagStatsRequestParamsSchema,
  FindOrCreateHashtagRequestBodySchema,
  FindOrCreateHashtagsByIdsRequestBodySchema,
  UpdateHashtagStatsRequestBodySchema,
  UpdateHashtagStatsRequestParamsSchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useHashtagsQuery = () =>
  useQuery({
    queryKey: ['hashtags', 'list'],
    queryFn: async () => {
      const result = await eden.api.hashtags.all.get();
      return result.data;
    },
  });

export const useHashtagQuery = (params: typeof FetchHashtagByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['hashtags', params.id],
    queryFn: async () => {
      const result = await eden.api.hashtags['by-id']({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useHashtagsByIdsQuery = (query: typeof FetchHashtagsByIdsQuerySchema.static) =>
  useQuery({
    queryKey: ['hashtags', 'by-ids', query.ids],
    queryFn: async () => {
      const result = await eden.api.hashtags['by-ids'].get({ query: { ids: query.ids } });
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
    mutationFn: async (data: typeof FindOrCreateHashtagsByIdsRequestBodySchema.static) => {
      const result = await eden.api.hashtags['by-ids'].post(data);
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
      const result = await eden.api.hashtags['by-id']({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
    },
  });
};

export const useHashtagStatsQuery = (params: typeof FetchHashtagStatsRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['hashtags', params.id, 'stats'],
    queryFn: async () => {
      const result = await eden.api.hashtags['by-id']({ id: params.id }).stats.get();
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
      const result = await eden.api.hashtags['by-id']({ id }).stats.post(updates);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.id] });
    },
  });
};



