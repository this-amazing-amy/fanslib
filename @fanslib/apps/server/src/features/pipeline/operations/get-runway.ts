import { z } from "zod";
import { In } from "typeorm";
import { addDays, format } from "date-fns";
import { db } from "../../../lib/db";
import { ContentSchedule } from "../../content-schedules/entity";
import type { ScheduleChannel } from "../../content-schedules/entity";
import type { Channel } from "../../channels/entity";
import { Media } from "../../library/entity";
import type { Subreddit } from "../../subreddits/entity";
import { CHANNEL_TYPES } from "../../channels/channelTypes";
import { buildFilterGroupQuery } from "../../library/filter-helpers";
import { getMergedFiltersForSlot } from "../../content-schedules/operations/get-merged-filters";
import { getRecentlyPostedMediaIds } from "../../library/operations/media/get-recently-posted-media-ids";
import { getUsedMediaForSubreddit } from "../../reddit-automation/operations/generation/utils";

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const RunwayScheduleRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string().nullable(),
});

export const RunwayDetailSchema = z.object({
  schedule: RunwayScheduleRefSchema,
  channels: z.array(z.string()),
  frequency: z.string(),
  availableMedia: z.number().int(),
  runsOutAt: z.string().nullable(),
  daysLeft: z.number().int(),
});

export const RunwayResponseSchema = z.object({
  runway: z.object({
    totalDays: z.number().int(),
    details: z.array(RunwayDetailSchema),
  }),
});

export type RunwayResponse = z.infer<typeof RunwayResponseSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatFrequency = (
  type: ContentSchedule["type"],
  postsPerTimeframe: number | null,
): string => {
  const count = postsPerTimeframe ?? 1;
  switch (type) {
    case "daily":
      return count === 1 ? "daily" : `${count}x/day`;
    case "weekly":
      return count === 1 ? "weekly" : `${count}x/week`;
    case "monthly":
      return count === 1 ? "monthly" : `${count}x/month`;
  }
};

/** Posts consumed per calendar day for a given schedule. */
const postsPerDayRate = (
  type: ContentSchedule["type"],
  postsPerTimeframe: number | null,
): number => {
  const count = postsPerTimeframe ?? 1;
  switch (type) {
    case "daily":
      return count;
    case "weekly":
      return count / 7;
    case "monthly":
      return count / 30;
  }
};

/**
 * Count media eligible for a specific schedule × channel slot.
 *
 * "Eligible" means:
 * - Passes the merged filters (schedule base + channel eligible + scheduleChannel override)
 * - NOT within the channel's mediaRepostCooldownHours window
 * - For Reddit channels: NOT within the subreddit's 30-day same-media cooldown
 */
const countEligibleMedia = async (
  scheduleId: string,
  channel: Channel,
  subreddit: Subreddit | null,
): Promise<number> => {
  const database = await db();
  const { filters: mergedFilters } = await getMergedFiltersForSlot(scheduleId, channel.id);

  const qb = database.manager.createQueryBuilder(Media, "media");

  if (mergedFilters.length > 0) {
    buildFilterGroupQuery(mergedFilters, qb);
  }

  // Exclude media within the channel's generic repost cooldown
  if (channel.mediaRepostCooldownHours && channel.mediaRepostCooldownHours > 0) {
    const cooldownIds = await getRecentlyPostedMediaIds(channel.id, channel.mediaRepostCooldownHours);
    if (cooldownIds.size > 0) {
      qb.andWhere("media.id NOT IN (:...channelCooldownIds)", {
        channelCooldownIds: Array.from(cooldownIds),
      });
    }
  }

  // For Reddit channels: also exclude media within the subreddit's same-media cooldown
  // (MEDIA_REUSE_RESTRICTION_DAYS = 30 days, as defined in reddit-automation utils)
  if (channel.typeId === CHANNEL_TYPES.reddit.id && subreddit) {
    const usedIds = await getUsedMediaForSubreddit(subreddit.id, channel.id);
    if (usedIds.length > 0) {
      qb.andWhere("media.id NOT IN (:...subredditCooldownIds)", {
        subredditCooldownIds: usedIds,
      });
    }
  }

  return qb.getCount();
};

type ScheduleChannelEntry = ScheduleChannel & { channel: Channel };

type ScheduleWithRelations = ContentSchedule & {
  scheduleChannels: ScheduleChannelEntry[];
};

// ---------------------------------------------------------------------------
// Main operation
// ---------------------------------------------------------------------------

export const getRunway = async (): Promise<RunwayResponse> => {
  const database = await db();

  const schedules = (await database.manager.find(ContentSchedule, {
    relations: {
      scheduleChannels: { channel: true },
    },
    order: {
      createdAt: "DESC",
      scheduleChannels: { sortOrder: "ASC" },
    },
  })) as ScheduleWithRelations[];

  // Collect all channel IDs used across all schedules
  const allChannelIds = [
    ...new Set(
      schedules.flatMap((s) => s.scheduleChannels.map((sc) => sc.channelId)),
    ),
  ];

  // Preload subreddits keyed by channelId (Reddit channels only)
  const subreddits =
    allChannelIds.length > 0
      ? await database.manager.find(Subreddit, {
          where: { channelId: In(allChannelIds) },
        })
      : [];

  const subredditByChannelId = new Map(
    subreddits
      .filter((s): s is Subreddit & { channelId: string } => s.channelId != null)
      .map((s) => [s.channelId, s]),
  );

  const today = new Date();

  const details = await Promise.all(
    schedules.map(async (schedule) => {
      const channels = schedule.scheduleChannels.map((sc) => sc.channel);

      // Per-channel media counts
      const channelCounts = await Promise.all(
        channels.map(async (channel) => {
          const subreddit = subredditByChannelId.get(channel.id) ?? null;
          return countEligibleMedia(schedule.id, channel, subreddit);
        }),
      );

      // Bottleneck: channel with fewest eligible media determines the schedule runway
      const availableMedia = channelCounts.length > 0 ? Math.min(...channelCounts) : 0;

      const rate = postsPerDayRate(schedule.type, schedule.postsPerTimeframe);
      const daysLeft = rate > 0 ? Math.floor(availableMedia / rate) : 0;
      const runsOutAt = format(addDays(today, daysLeft), "yyyy-MM-dd");

      return {
        schedule: {
          id: schedule.id,
          name: schedule.name,
          emoji: schedule.emoji,
        },
        channels: channels.map((c) => c.name),
        frequency: formatFrequency(schedule.type, schedule.postsPerTimeframe),
        availableMedia,
        runsOutAt,
        daysLeft,
      };
    }),
  );

  // Overall runway = schedule with least days left
  const totalDays = details.length > 0 ? Math.min(...details.map((d) => d.daysLeft)) : 0;

  return {
    runway: {
      totalDays,
      details,
    },
  };
};
