import type {
  CreateContentScheduleRequest,
  UpdateContentScheduleRequest,
} from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentSchedulesApi } from '../api/content-schedules';

export const useContentSchedulesQuery = () =>
  useQuery({
    queryKey: ['content-schedules', 'list'],
    queryFn: () => contentSchedulesApi.getAll(),
  });

export const useContentScheduleQuery = (id: string) =>
  useQuery({
    queryKey: ['content-schedules', id],
    queryFn: () => contentSchedulesApi.getById(id),
    enabled: !!id,
  });

export const useContentSchedulesByChannelQuery = (channelId: string) =>
  useQuery({
    queryKey: ['content-schedules', 'by-channel', channelId],
    queryFn: () => contentSchedulesApi.getByChannel(channelId),
    enabled: !!channelId,
  });

export const useCreateContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContentScheduleRequest) => contentSchedulesApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-schedules', 'list'] });
      queryClient.invalidateQueries({
        queryKey: ['content-schedules', 'by-channel', data.channelId],
      });
    },
  });
};

export const useUpdateContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateContentScheduleRequest }) =>
      contentSchedulesApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-schedules', 'list'] });
      queryClient.setQueryData(['content-schedules', variables.id], data);
      if (data) {
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
    mutationFn: (id: string) => contentSchedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-schedules'] });
    },
  });
};



