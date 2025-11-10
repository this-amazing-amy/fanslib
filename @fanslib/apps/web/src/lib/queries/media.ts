import type {
  DeleteMediaRequestParamsSchema,
  FetchAllMediaRequestBodySchema,
  FindAdjacentMediaBodySchema,
  FindAdjacentMediaRequestParamsSchema,
  GetMediaByIdRequestParamsSchema,
  UpdateMediaRequestBodySchema,
  UpdateMediaRequestParamsSchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useMediaListQuery = (params?: typeof FetchAllMediaRequestBodySchema.static) =>
  useQuery({
    queryKey: ['media', 'list', params],
    queryFn: async () => {
      const result = await eden.api.media.post(params);
      return result.data;
    },
  });

export const useMediaQuery = (params: typeof GetMediaByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['media', params.id],
    queryFn: async () => {
      const result = await eden.api.media({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useMediaAdjacentQuery = (
  params: typeof FindAdjacentMediaRequestParamsSchema.static,
  body?: typeof FindAdjacentMediaBodySchema.static
) =>
  useQuery({
    queryKey: ['media', params.id, 'adjacent', body],
    queryFn: async () => {
      const result = await eden.api.media({ id: params.id }).adjacent.get(body);
      return result.data;
    },
    enabled: !!params.id,
  });

type UpdateMediaParams = typeof UpdateMediaRequestParamsSchema.static & {
  updates: typeof UpdateMediaRequestBodySchema.static;
};

export const useUpdateMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateMediaParams) => {
      const result = await eden.api.media({ id }).patch(updates);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
      queryClient.setQueryData(['media', variables.id], data);
    },
  });
};

type DeleteMediaParams = typeof DeleteMediaRequestParamsSchema.static & {
  deleteFile?: boolean;
};

export const useDeleteMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, deleteFile = false }: DeleteMediaParams) => {
      const result = await eden.api.media({ id }).delete({ query: { deleteFile: deleteFile ? 'true' : undefined } });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
    },
  });
};
