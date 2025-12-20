import type {
  CreateChannelRequestBodySchema,
  DeleteChannelRequestParamsSchema,
  FetchChannelByIdRequestParamsSchema,
  UpdateChannelRequestBodySchema,
  UpdateChannelRequestParamsSchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useChannelsQuery = () =>
  useQuery({
    queryKey: ['channels', 'list'],
    queryFn: async () => {
      const result = await eden.api.channels.all.get();
      return result.data;
    },
  });

export const useChannelQuery = (params: typeof FetchChannelByIdRequestParamsSchema.static) =>
  useQuery({
    queryKey: ['channels', params.id],
    queryFn: async () => {
      const result = await eden.api.channels['by-id']({ id: params.id }).get();
      return result.data;
    },
    enabled: !!params.id,
  });

export const useChannelTypesQuery = () =>
  useQuery({
    queryKey: ['channels', 'types'],
    queryFn: async () => {
      const result = await eden.api.channels.all.get();
      return result.data;
    },
  });

export const useCreateChannelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateChannelRequestBodySchema.static) => {
      const result = await eden.api.channels.post(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
    },
  });
};

type UpdateChannelParams = typeof UpdateChannelRequestParamsSchema.static & {
  updates: typeof UpdateChannelRequestBodySchema.static;
};

export const useUpdateChannelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateChannelParams) => {
      const result = await eden.api.channels['by-id']({ id }).patch(updates);
      return result.data;
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
    mutationFn: async (params: typeof DeleteChannelRequestParamsSchema.static) => {
      const result = await eden.api.channels['by-id']({ id: params.id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', 'list'] });
    },
  });
};
