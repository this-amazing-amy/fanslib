import type { z } from "zod";
import { db } from "../../../lib/db";
import { ContentSchedule } from "../entity";
import { Channel } from "../../channels/entity";
import { ScheduleChannel } from "../entity";
import type { MediaFilterSchema } from "../../library/schemas/media-filter";
import { mergeFilterGroups } from "../../library/filter-helpers";

type MediaFilter = z.infer<typeof MediaFilterSchema>;
type FilterGroup = MediaFilter[number];

export type MergedFiltersResult = {
  filters: MediaFilter;
  filterSources: {
    schedule: boolean;
    channel: boolean;
    scheduleChannelOverride: boolean;
  };
};

/**
 * Get merged media filters for a virtual post slot
 * Merges filters with precedence: ScheduleChannel override > Channel eligible > Schedule base
 * 
 * @param scheduleId - The content schedule ID
 * @param channelId - The channel ID
 * @returns Merged filter configuration with source metadata
 */
export const getMergedFiltersForSlot = async (
  scheduleId: string,
  channelId: string,
): Promise<MergedFiltersResult> => {
  const database = await db();

  // Fetch schedule with its mediaFilters
  const schedule = await database.manager.findOne(ContentSchedule, {
    where: { id: scheduleId },
  });

  // Fetch channel with its eligibleMediaFilter
  const channel = await database.manager.findOne(Channel, {
    where: { id: channelId },
  });

  // Fetch scheduleChannel for potential override
  const scheduleChannel = await database.manager.findOne(ScheduleChannel, {
    where: {
      scheduleId,
      channelId,
    },
  });

  const filterGroups: FilterGroup[] = [];
  const filterSources = {
    schedule: false,
    channel: false,
    scheduleChannelOverride: false,
  };

  // Base: Schedule mediaFilters (lowest priority)
  if (schedule?.mediaFilters) {
    try {
      const scheduleFilters = 
        typeof schedule.mediaFilters === 'string' 
          ? JSON.parse(schedule.mediaFilters)
          : schedule.mediaFilters;
      
      if (Array.isArray(scheduleFilters) && scheduleFilters.length > 0) {
        filterGroups.push(...scheduleFilters);
        filterSources.schedule = true;
      }
    } catch (e) {
      console.error('Failed to parse schedule mediaFilters:', e);
    }
  }

  // Middle: Channel eligibleMediaFilter
  if (channel?.eligibleMediaFilter) {
    try {
      const channelFilters = 
        typeof channel.eligibleMediaFilter === 'string'
          ? JSON.parse(channel.eligibleMediaFilter as string)
          : channel.eligibleMediaFilter;

      if (Array.isArray(channelFilters) && channelFilters.length > 0) {
        filterGroups.push(...channelFilters);
        filterSources.channel = true;
      }
    } catch (e) {
      console.error('Failed to parse channel eligibleMediaFilter:', e);
    }
  }

  // Highest: ScheduleChannel mediaFilterOverrides (highest priority)
  if (scheduleChannel?.mediaFilterOverrides) {
    try {
      const overrideFilters =
        typeof scheduleChannel.mediaFilterOverrides === 'string'
          ? JSON.parse(scheduleChannel.mediaFilterOverrides)
          : scheduleChannel.mediaFilterOverrides;

      if (Array.isArray(overrideFilters) && overrideFilters.length > 0) {
        filterGroups.push(...overrideFilters);
        filterSources.scheduleChannelOverride = true;
      }
    } catch (e) {
      console.error('Failed to parse scheduleChannel mediaFilterOverrides:', e);
    }
  }

  // Merge all filter groups into a normalized structure
  const mergedFilters = mergeFilterGroups(filterGroups);

  return {
    filters: mergedFilters,
    filterSources,
  };
};
