import type { CreateContentScheduleRequestBody, FetchVirtualPostsRequestQuery, UpdateContentScheduleRequestBody } from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';
import { QUERY_KEYS } from './query-keys';

export const useContentSchedulesQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.contentSchedules.list(),
    queryFn: async () => {
      const result = await api.api['content-schedules'].all.$get();
      return result.json();
    },
  });

export const useContentScheduleQuery = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.contentSchedules.byId(id),
    queryFn: async () => {
      const result = await api.api['content-schedules']['by-id'][':id'].$get({ param: { id } });
      return result.json();
    },
    enabled: !!id,
  });

export const useContentSchedulesByChannelQuery = (channelId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.contentSchedules.byChannel(channelId),
    queryFn: async () => {
      const result = await api.api['content-schedules']['by-channel-id'][':channelId'].$get({ param: { channelId } });
      return result.json();
    },
    enabled: !!channelId,
  });

export const useVirtualPostsQuery = (params: {
  channelIds: string[];
  fromDate: Date;
  toDate: Date;
}) =>
  useQuery({
    queryKey: QUERY_KEYS.contentSchedules.virtualPosts({
      channelIds: params.channelIds,
      fromDate: params.fromDate.toISOString(),
      toDate: params.toDate.toISOString(),
    }),
    queryFn: async () => {
      const query: FetchVirtualPostsRequestQuery = {
        channelIds: params.channelIds,
        fromDate: params.fromDate.toISOString(),
        toDate: params.toDate.toISOString(),
      };
      const result = await api.api['content-schedules']['virtual-posts'].$get({ query });
      const data = await result.json();
      return data ?? [];
    },
    enabled: params.channelIds.length > 0,
  });

export const useCreateContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContentScheduleRequestBody) => {
      const result = await api.api['content-schedules'].$post({ json: data });
      return result.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.list() });
      if (data && 'channelId' in data && data.channelId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.contentSchedules.byChannel(data.channelId),
        });
      }
    },
  });
};

type UpdateContentScheduleParams = {
  id: string;
  updates: UpdateContentScheduleRequestBody;
};

export const useUpdateContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateContentScheduleParams) => {
      const result = await api.api['content-schedules']['by-id'][':id'].$patch({ param: { id }, json: updates });
      return result.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all content-schedules queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
      queryClient.setQueryData(QUERY_KEYS.contentSchedules.byId(variables.id), data);
    },
  });
};

export const useDeleteContentScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.api['content-schedules']['by-id'][':id'].$delete({ param: { id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
    },
  });
};

export const useSkipScheduleSlotMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, date }: { scheduleId: string; date: Date }) => {
      const result = await api.api['content-schedules']['skipped-slots'].$post({ json: { scheduleId, date } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
    },
  });
};

export const useUnskipScheduleSlotMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.api['content-schedules']['skipped-slots'][':id'].$delete({ param: { id } });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contentSchedules.all() });
    },
  });
};



