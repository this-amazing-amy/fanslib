import type {
  CreateSnippetRequestBodySchema,
  DeleteSnippetRequestParamsSchema,
  FetchSnippetByIdRequestParamsSchema,
  FetchSnippetsByChannelRequestParamsSchema,
  UpdateSnippetRequestBodySchema,
  UpdateSnippetRequestParamsSchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useSnippetsQuery = () =>
  useQuery({
    queryKey: ['snippets', 'list'],
    queryFn: async () => {
      const result = await eden.api.snippets.get();
      return result.data;
    },
  });

export const useGlobalSnippetsQuery = () =>
  useQuery({
    queryKey: ['snippets', 'global'],
    queryFn: async () => {
      const result = await eden.api.snippets.global.get();
      return result.data;
    },
  });

export const useSnippetsByChannelQuery = (params: typeof FetchSnippetsByChannelRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['snippets', 'by-channel', params.channelId],
    queryFn: async () => {
      const result = await eden.api.snippets['by-channel']({ channelId: params.channelId }).get();
      return result.data;
    },
    enabled: !!params.channelId,
  });

export const useSnippetQuery = (params: typeof FetchSnippetByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['snippets', params.id],
    queryFn: async () => {
      const result = await eden.api.snippets({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useCreateSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateSnippetRequestBodySchema.static) => {
      const result = await eden.api.snippets.post(data);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['snippets', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['snippets', 'global'] });
      if (data.channelId) {
        queryClient.invalidateQueries({ queryKey: ['snippets', 'by-channel', data.channelId] });
      }
    },
  });
};

type UpdateSnippetParams = typeof UpdateSnippetRequestParamsSchema.static & {
  updates: typeof UpdateSnippetRequestBodySchema.static;
};

export const useUpdateSnippetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateSnippetParams) => {
      const result = await eden.api.snippets({ id }).patch(updates);
      return result.data;
    },
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
    mutationFn: async (params: typeof DeleteSnippetRequestParamsSchema.static) => {
      const result = await eden.api.snippets({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
  });
};
