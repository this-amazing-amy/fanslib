import type {
  CreateContentScheduleRequestBodySchema,
  UpdateContentScheduleRequestBodySchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useContentSchedulesQuery = () =>
  useQuery({
    queryKey: ['content-schedules', 'list'],
    queryFn: async () => {
      const result = await eden.api['content-schedules'].all.get();
      return result.data;
    },
  });

export const useContentScheduleQuery = (id: string) =>
  useQuery({
    queryKey: ['content-schedules', id],
    queryFn: async () => {
      const result = await eden.api['content-schedules']['by-id']({ id }).get();
      return result.data;
    },
    enabled: !!id,
  });

export const useContentSchedulesByChannelQuery = (channelId: string) =>
  useQuery({
    queryKey: ['content-schedules', 'by-channel', channelId],
    queryFn: async () => {
      const result = await eden.api['content-schedules']['by-channel-id']({ channelId }).get();
      return result.data;
    },
    enabled: !!channelId,
  });

export const useCreateContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof CreateContentScheduleRequestBodySchema.static) => {
      const result = await eden.api['content-schedules'].post(data);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-schedules', 'list'] });
      if (data && 'channelId' in data) {
        queryClient.invalidateQueries({
          queryKey: ['content-schedules', 'by-channel', data.channelId],
        });
      }
    },
  });
};

type UpdateContentScheduleParams = {
  id: string;
  updates: typeof UpdateContentScheduleRequestBodySchema.static;
};

export const useUpdateContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateContentScheduleParams) => {
      const result = await eden.api['content-schedules']['by-id']({ id }).patch(updates);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-schedules', 'list'] });
      queryClient.setQueryData(['content-schedules', variables.id], data);
      if (data && 'channelId' in data) {
        queryClient.invalidateQueries({
          queryKey: ['content-schedules', 'by-channel', data.channelId],
        });
      }
    },
  });
};

export const useDeleteContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await eden.api['content-schedules']['by-id']({ id }).delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-schedules'] });
    },
  });
};



