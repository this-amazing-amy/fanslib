import type { CreateFilterPresetRequest, UpdateFilterPresetRequest } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { filterPresetsApi } from '../api/filter-presets';

export const useFilterPresetsQuery = () =>
  useQuery({
    queryKey: ['filter-presets', 'list'],
    queryFn: () => filterPresetsApi.getAll(),
  });

export const useFilterPresetQuery = (id: string) =>
  useQuery({
    queryKey: ['filter-presets', id],
    queryFn: () => filterPresetsApi.getById(id),
    enabled: !!id,
  });

export const useCreateFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFilterPresetRequest) => filterPresetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
    },
  });
};

export const useUpdateFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateFilterPresetRequest }) =>
      filterPresetsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
      queryClient.setQueryData(['filter-presets', variables.id], data);
    },
  });
};

export const useDeleteFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => filterPresetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
    },
  });
};



