import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';

type MediaFilter = Array<{
  include: boolean;
  items: Array<
    | { type: 'channel'; id: string }
    | { type: 'subreddit'; id: string }
    | { type: 'tag'; id: string }
    | { type: 'shoot'; id: string }
    | { type: 'filename'; value: string }
    | { type: 'caption'; value: string }
    | { type: 'posted'; value: boolean }
    | { type: 'createdDateStart'; value: Date }
    | { type: 'createdDateEnd'; value: Date }
    | { type: 'mediaType'; value: 'image' | 'video' }
    | { type: 'dimensionEmpty'; dimensionId: number }
  >;
}>;

export const useFilterPresetsQuery = () =>
  useQuery({
    queryKey: ['filter-presets', 'list'],
    queryFn: async () => {
      const result = await api.api['filter-presets'].all.$get();
      return result.json();
    },
  });

export const useFilterPresetQuery = (id: string) =>
  useQuery({
    queryKey: ['filter-presets', id],
    queryFn: async () => {
      const result = await api.api['filter-presets']['by-id'][':id'].$get({ param: { id } });
      return result.json();
    },
    enabled: !!id,
  });

export const useCreateFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; filters: MediaFilter }) => {
      const result = await api.api['filter-presets'].$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
    },
  });
};

type UpdateFilterPresetParams = {
  id: string;
  updates: {
    name?: string;
    filters?: MediaFilter;
  };
};

export const useUpdateFilterPresetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateFilterPresetParams) => {
      const result = await api.api['filter-presets']['by-id'][':id'].$patch({ 
        param: { id },
        json: updates 
      });
      return result.json();
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
      const result = await api.api['filter-presets']['by-id'][':id'].$delete({ param: { id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', 'list'] });
    },
  });
};



