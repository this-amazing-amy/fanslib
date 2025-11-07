import type { FetchAllMediaRequest, FindAdjacentMediaRequest, UpdateMediaRequest } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';
import { mediaApi } from '../api/media';

export const useMediaListQuery = (params?: FetchAllMediaRequest) =>
  useQuery({
    queryKey: ['media', 'list', params],
    queryFn: () => eden.api.media.get(
    {
      query: {
        page: params?.page,
        limit: params?.limit,
        filters: JSON.stringify(params?.filters),
        sort: JSON.stringify(params?.sort),
      },
    }
  )
  });

export const useMediaQuery = (id: string) =>
  useQuery({
    queryKey: ['media', id],
    queryFn: () => mediaApi.getById(id),
    enabled: !!id,
  });

export const useMediaAdjacentQuery = (id: string, params?: FindAdjacentMediaRequest) =>
  useQuery({
    queryKey: ['media', id, 'adjacent', params],
    queryFn: () => mediaApi.getAdjacent(id, params),
    enabled: !!id,
  });

export const useUpdateMediaMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateMediaRequest }) =>
      mediaApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
      queryClient.setQueryData(['media', variables.id], data);
    },
  });
};

export const useDeleteMediaMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, deleteFile = false }: { id: string; deleteFile?: boolean }) =>
      mediaApi.delete(id, deleteFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
    },
  });
};

