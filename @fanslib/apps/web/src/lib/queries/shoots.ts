import type { CreateShootRequest, FetchAllShootsRequest, UpdateShootRequest } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shootsApi } from '../api/shoots';

export const useShootsQuery = (request?: FetchAllShootsRequest) =>
  useQuery({
    queryKey: ['shoots', 'list', request],
    queryFn: () => shootsApi.getAll(request),
  });

export const useShootQuery = (id: string) =>
  useQuery({
    queryKey: ['shoots', id],
    queryFn: () => shootsApi.getById(id),
    enabled: !!id,
  });

export const useCreateShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShootRequest) => shootsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoots', 'list'] });
    },
  });
};

export const useUpdateShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateShootRequest }) =>
      shootsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shoots', 'list'] });
      queryClient.setQueryData(['shoots', variables.id], data);
    },
  });
};

export const useDeleteShootMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shootsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoots', 'list'] });
    },
  });
};



