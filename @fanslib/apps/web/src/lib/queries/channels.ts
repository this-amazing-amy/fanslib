import type { CreateChannelRequest, UpdateChannelRequest } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { channelsApi } from '../api/channels';

export const useChannelsQuery = () =>
  useQuery({
    queryKey: ['channels', 'list'],
    queryFn: () => channelsApi.getAll(),
  });

export const useChannelQuery = (id: string) =>
  useQuery({
    queryKey: ['channels', id],
    queryFn: () => channelsApi.getById(id),
    enabled: !!id,
  });

export const useChannelTypesQuery = () =>
  useQuery({
    queryKey: ['channels', 'types'],
    queryFn: () => channelsApi.getTypes(),
  });

export const useCreateChannelMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateChannelRequest) => channelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
    },
  });
};

export const useUpdateChannelMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateChannelRequest }) =>
      channelsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
      queryClient.setQueryData(['channels', variables.id], data);
    },
  });
};

export const useDeleteChannelMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => channelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
    },
  });
};

