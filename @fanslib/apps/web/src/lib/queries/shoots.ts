import type {
  CreateShootRequestBodySchema,
  FetchAllShootsRequestBodySchema,
  FetchShootByIdRequestParamsSchema,
  UpdateShootRequestBodySchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useShootsQuery = (params?: typeof FetchAllShootsRequestBodySchema.static) =>
  useQuery({
    queryKey: ['shoots', 'list', params],
    queryFn: async () => {
      const result = await eden.api.shoots.all.post(params);
      return result.data;
    },
  });

export const useShootQuery = (params: typeof FetchShootByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['shoots', params.id],
    queryFn: async () => {
      const result = await eden.api.shoots['by-id']({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useCreateShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateShootRequestBodySchema.static) => {
      const result = await eden.api.shoots.post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoots', 'list'] });
    },
  });
};

type UpdateShootParams = typeof FetchShootByIdRequestParamsSchema.static & {
  updates: typeof UpdateShootRequestBodySchema.static;
};

export const useUpdateShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateShootParams) => {
      const result = await eden.api.shoots['by-id']({ id }).patch(updates);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shoots', 'list'] });
      queryClient.setQueryData(['shoots', variables.id], data);
      // Invalidate media list query when media is added/removed from shoot
      if (variables.updates.mediaIds !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
      }
    },
  });
};

export const useDeleteShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: typeof FetchShootByIdRequestParamsSchema.static) => {
      const result = await eden.api.shoots['by-id']({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoots', 'list'] });
    },
  });
};

export const usePostsByShootIdQuery = (shootId: string) =>
  useQuery({
    queryKey: ['shoots', 'posts', shootId],
    queryFn: async () => {
      const result = await eden.api.shoots['by-id']({ id: shootId }).posts.get();
      return result.data;
    },
    enabled: !!shootId,
  });



