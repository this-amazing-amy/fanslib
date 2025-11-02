import type { SnippetCreateData, SnippetUpdateData } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { snippetsApi } from '../api/snippets';

export const useSnippetsQuery = () =>
  useQuery({
    queryKey: ['snippets', 'list'],
    queryFn: () => snippetsApi.getAll(),
  });

export const useGlobalSnippetsQuery = () =>
  useQuery({
    queryKey: ['snippets', 'global'],
    queryFn: () => snippetsApi.getGlobal(),
  });

export const useSnippetsByChannelQuery = (channelId: string) =>
  useQuery({
    queryKey: ['snippets', 'by-channel', channelId],
    queryFn: () => snippetsApi.getByChannel(channelId),
    enabled: !!channelId,
  });

export const useSnippetQuery = (id: string) =>
  useQuery({
    queryKey: ['snippets', id],
    queryFn: () => snippetsApi.getById(id),
    enabled: !!id,
  });

export const useCreateSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SnippetCreateData) => snippetsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['snippets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['snippets', 'global'] });
      if (data.channelId) {
        queryClient.invalidateQueries({ queryKey: ['snippets', 'by-channel', data.channelId] });
      }
    },
  });
};

export const useUpdateSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SnippetUpdateData }) =>
      snippetsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['snippets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['snippets', 'global'] });
      queryClient.setQueryData(['snippets', variables.id], data);
      if (data.channelId) {
        queryClient.invalidateQueries({ queryKey: ['snippets', 'by-channel', data.channelId] });
      }
    },
  });
};

export const useDeleteSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => snippetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
  });
};

export const useIncrementSnippetUsageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => snippetsApi.incrementUsage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['snippets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['snippets', id] });
    },
  });
};



