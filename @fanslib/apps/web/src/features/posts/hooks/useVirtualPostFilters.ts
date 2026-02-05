import type { MediaFilter } from '@fanslib/server/schemas';
import { useMemo } from 'react';
import { parseMediaFilters } from '~/features/channels/content-schedule-helpers';
import { useChannelQuery } from '~/lib/queries/channels';
import { useContentScheduleQuery } from '~/lib/queries/content-schedules';

type UseVirtualPostFiltersParams = {
  channelId: string;
  scheduleId: string | null;
};

export const useVirtualPostFilters = ({ channelId, scheduleId }: UseVirtualPostFiltersParams): MediaFilter => {
  const { data: schedule } = useContentScheduleQuery(scheduleId ?? '');
  const { data: channel } = useChannelQuery({ id: channelId });

  return useMemo(() => {
    const scheduleFilters = schedule && !('error' in schedule) && schedule.mediaFilters
      ? parseMediaFilters(schedule.mediaFilters) ?? []
      : [];
    const channelFilters = channel && !('error' in channel) && channel.eligibleMediaFilter
      ? parseMediaFilters(channel.eligibleMediaFilter as string) ?? []
      : [];
    return [...scheduleFilters, ...channelFilters];
  }, [schedule, channel]);
};
