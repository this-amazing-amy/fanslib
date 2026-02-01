import type { DeleteMediaRequestParams, FetchAllMediaRequestBody, FetchMediaByIdRequestParams, FindAdjacentMediaBody, FindAdjacentMediaRequestParams, UpdateMediaRequestBody, UpdateMediaRequestParams } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

export const useMediaListQuery = (params?: FetchAllMediaRequestBody) =>
  useQuery({
    queryKey: QUERY_KEYS.media.list(params),
    queryFn: async () => {
      const result = await api.api.media.all.$post({ json: params });
      return result.json();
    },
  });

export const useMediaQuery = (params: FetchMediaByIdRequestParams) =>
  useQuery({
    queryKey: QUERY_KEYS.media.byId(params.id),
    queryFn: async () => {
      const result = await api.api.media[':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useMediaAdjacentQuery = (
  params: FindAdjacentMediaRequestParams,
  body?: FindAdjacentMediaBody
) =>
  useQuery({
    queryKey: QUERY_KEYS.media.adjacent(params.id, body),
    queryFn: async () => {
      const result = await api.api.media[':id'].adjacent.$post({ param: { id: params.id }, json: body });
      return result.json();
    },
    enabled: !!params.id,
  });

type UpdateMediaParams = UpdateMediaRequestParams & {
  updates: UpdateMediaRequestBody;
};

export const useUpdateMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateMediaParams) => {
      const result = await api.api.media[':id'].$patch({ param: { id }, json: updates });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
      queryClient.setQueryData(QUERY_KEYS.media.byId(variables.id), data);
    },
  });
};

type DeleteMediaParams = DeleteMediaRequestParams & {
  deleteFile?: boolean;
};

export const useDeleteMediaMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, deleteFile = false }: DeleteMediaParams) => {
      const result = await api.api.media[':id'].$delete({ 
        param: { id }, 
        query: { deleteFile: deleteFile ? 'true' : undefined } 
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
    },
  });
};
