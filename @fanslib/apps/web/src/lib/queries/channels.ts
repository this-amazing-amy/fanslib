import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

export const useChannelsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.channels.all(),
    queryFn: async () => {
      const result = await api.api.channels.all.$get();
      return result.json();
    },
  });

export const useChannelQuery = (params: { id: string }) =>
  useQuery({
    queryKey: QUERY_KEYS.channels.byId(params.id),
    queryFn: async () => {
      const result = await api.api.channels['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useChannelTypesQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.channels.types(),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channels.all() });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channels.all() });
      queryClient.setQueryData(QUERY_KEYS.channels.byId(variables.id), data);
      // Invalidate hashtags in case new ones were created on the backend
      if (variables.updates.defaultHashtags) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hashtags.all() });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channels.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.snippets.all() });
    },
  });
};
