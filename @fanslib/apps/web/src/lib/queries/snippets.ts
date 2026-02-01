import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';

export const useSnippetsQuery = () =>
  useQuery({
    queryKey: ['snippets', 'list'],
    queryFn: async () => {
      const result = await api.api.snippets.all.$get();
      return result.json();
    },
  });

export const useGlobalSnippetsQuery = () =>
  useQuery({
    queryKey: ['snippets', 'global'],
    queryFn: async () => {
      const result = await api.api.snippets.global.$get();
      return result.json();
    },
  });

export const useSnippetsByChannelQuery = (params: { channelId: string }) =>
  useQuery({
    queryKey: ['snippets', 'by-channel', params.channelId],
    queryFn: async () => {
      const result = await api.api.snippets['by-channel-id'][':channelId'].$get({ param: { channelId: params.channelId } });
      return result.json();
    },
    enabled: !!params.channelId,
  });

export const useSnippetQuery = (params: { id: string }) =>
  useQuery({
    queryKey: ['snippets', params.id],
    queryFn: async () => {
      const result = await api.api.snippets['by-id'][':id'].$get({ param: { id: params.id } });
      return result.json();
    },
    enabled: !!params.id,
  });

export const useCreateSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      content: string;
      channelId?: string;
    }) => {
      const result = await api.api.snippets.$post({ json: data });
      return result.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['snippets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['snippets', 'global'] });
      if (data?.channel) {
        queryClient.invalidateQueries({ queryKey: ['snippets', 'by-channel', data.channel.id] });
      }
    },
  });
};

type UpdateSnippetParams = {
  id: string;
  updates: {
    name?: string;
    content?: string;
    channelId?: string;
  };
};

export const useUpdateSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateSnippetParams) => {
      const result = await api.api.snippets['by-id'][':id'].$patch({ 
        param: { id },
        json: updates 
      });
      return result.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['snippets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['snippets', 'global'] });
      queryClient.setQueryData(['snippets', variables.id], data);
    },
  });
};

export const useDeleteSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string }) => {
      const result = await api.api.snippets['by-id'][':id'].$delete({ param: { id: params.id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['snippets', 'global'] });
    },
  });
};
