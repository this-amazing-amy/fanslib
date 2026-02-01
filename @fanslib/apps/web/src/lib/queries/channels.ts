import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';

export const useChannelsQuery = () =>
  useQuery({
    queryKey: ['channels', 'list'],
    queryFn: async () => {
      const result = await api.api.channels.all.$get();
      return result.json();
    },
  });

export const useChannelQuery = (params: { id: string }) =>
  useQuery({
    queryKey: ['channels', params.id],
    queryFn: async () => {
      const result = await api.api.channels['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useChannelTypesQuery = () =>
  useQuery({
    queryKey: ['channels', 'types'],
    queryFn: async () => {
      const result = await api.api.channels.types.$get();
      return result.json();
    },
  });

export const useCreateChannelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      typeId: string;
      description?: string;
      eligibleMediaFilter?: unknown;
    }) => {
      const result = await api.api.channels.$post({ json: data });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
    },
  });
};

type UpdateChannelParams = {
  id: string;
  updates: {
    name?: string;
    description?: string | null;
    typeId?: string;
    eligibleMediaFilter?: unknown | null;
    defaultHashtags?: string[];
  };
};

export const useUpdateChannelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateChannelParams) => {
      const result = await api.api.channels['by-id'][':id'].$patch({ param: { id }, json: updates });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
      queryClient.setQueryData(['channels', variables.id], data);
      // Invalidate hashtags in case new ones were created on the backend
      if (variables.updates.defaultHashtags) {
        queryClient.invalidateQueries({ queryKey: ['hashtags', 'list'] });
      }
    },
  });
};

export const useDeleteChannelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string }) => {
      const result = await api.api.channels['by-id'][':id'].$delete({ param: { id: params.id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
    },
  });
};
