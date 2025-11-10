import type {
  CreateFilterPresetRequestBodySchema,
  UpdateFilterPresetRequestBodySchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useFilterPresetsQuery = () =>
  useQuery({
    queryKey: ['filter-presets', 'list'],
    queryFn: async () => {
      const result = await eden.api['filter-presets'].get();
      return result.data;
    },
  });

export const useFilterPresetQuery = (id: string) =>
  useQuery({
    queryKey: ['filter-presets', id],
    queryFn: async () => {
      const result = await eden.api['filter-presets']({ id }).get();
      return result.data;
    },
    enabled: !!id,
  });

export const useCreateFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateFilterPresetRequestBodySchema.static) => {
      const result = await eden.api['filter-presets'].post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
    },
  });
};

type UpdateFilterPresetParams = {
  id: string;
  updates: typeof UpdateFilterPresetRequestBodySchema.static;
};

export const useUpdateFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateFilterPresetParams) => {
      const result = await eden.api['filter-presets']({ id }).patch(updates);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
      queryClient.setQueryData(['filter-presets', variables.id], data);
    },
  });
};

export const useDeleteFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await eden.api['filter-presets']({ id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
    },
  });
};



