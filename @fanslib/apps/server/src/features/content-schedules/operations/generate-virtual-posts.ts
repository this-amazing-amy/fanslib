import { isSameMinute } from "date-fns";
import { Between, In } from "typeorm";
import { z } from "zod";
import { db } from "../../../lib/db";
import type { Channel } from "../../channels/entity";
import { Post } from "../../posts/entity";
import { ContentSchedule, ScheduleChannel } from "../entity";
import { generateScheduleDates } from "../schedule-dates";

export { generateScheduleDates } from "../schedule-dates";

export const FetchVirtualPostsRequestQuerySchema = z.object({
  channelIds: z.array(z.string()),
  fromDate: z.string(),
  toDate: z.string(),
});

// TODO: Replace z.unknown() with PostWithRelationsSchema once the posts feature is migrated to Zod
export const VirtualPostSchema = z.unknown().and(
  z.object({
    isVirtual: z.literal(true),
    targetChannelIds: z.array(z.string()).optional(),
  })
);

export const FetchVirtualPostsResponseSchema = z.array(VirtualPostSchema);

type ScheduleWithRelations = ContentSchedule & {
  channel: Channel | null;
  scheduleChannels: (ScheduleChannel & { channel: Channel })[];
};

const toScheduleResponse = (schedule: ContentSchedule) => ({
  id: schedule.id,
  channelId: schedule.channelId,
  name: schedule.name,
  emoji: schedule.emoji,
  color: schedule.color,
  type: schedule.type,
  postsPerTimeframe: schedule.postsPerTimeframe,
  preferredDays: schedule.preferredDays,
  preferredTimes: schedule.preferredTimes,
  updatedAt: schedule.updatedAt,
  createdAt: schedule.createdAt,
  mediaFilters: schedule.mediaFilters,
});

const toVirtualPost = (
  schedule: ScheduleWithRelations,
  slotDate: Date,
  channel: Channel,
  targetChannelIds: string[]
) => ({
  id: `virtual-${schedule.id}-${channel.id}-${slotDate.getTime()}`,
  createdAt: slotDate,
  updatedAt: slotDate,
  postGroupId: targetChannelIds.length > 1 ? `virtual-group-${schedule.id}-${slotDate.getTime()}` : null,
  scheduleId: schedule.id,
  caption: "",
  date: slotDate,
  url: null,
  fypRemovedAt: null,
  fypManuallyRemoved: false,
  postponeBlueskyDraftedAt: null,
  blueskyPostUri: null,
  blueskyPostError: null,
  blueskyRetryCount: 0,
  status: "draft" as const,
  channelId: channel.id,
  subredditId: null,
  postMedia: [],
  channel,
  subreddit: null,
  schedule: toScheduleResponse(schedule),
  isVirtual: true as const,
  targetChannelIds,
});

export const fetchVirtualPosts = async (
  params: z.infer<typeof FetchVirtualPostsRequestQuerySchema>
): Promise<z.infer<typeof FetchVirtualPostsResponseSchema>> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);
  const postRepo = dataSource.getRepository(Post);

  const fromDate = new Date(params.fromDate);
  const toDate = new Date(params.toDate);

  const scheduleChannels = await scheduleChannelRepo.find({
    where: { channelId: In(params.channelIds) },
    select: { scheduleId: true },
  });
  const scheduleIdsFromChannels = [...new Set(scheduleChannels.map((sc) => sc.scheduleId))];

  const schedules = await scheduleRepo
    .createQueryBuilder("schedule")
    .leftJoinAndSelect("schedule.channel", "channel")
    .leftJoinAndSelect("channel.type", "channelType")
    .leftJoinAndSelect("channel.defaultHashtags", "channelHashtags")
    .leftJoinAndSelect("schedule.skippedSlots", "skippedSlots")
    .leftJoinAndSelect("schedule.scheduleChannels", "scheduleChannels")
    .leftJoinAndSelect("scheduleChannels.channel", "scChannel")
    .leftJoinAndSelect("scChannel.type", "scChannelType")
    .leftJoinAndSelect("scChannel.defaultHashtags", "scChannelHashtags")
    .where("schedule.channelId IN (:...channelIds)", { channelIds: params.channelIds.length > 0 ? params.channelIds : ["__none__"] })
    .orWhere("schedule.id IN (:...scheduleIds)", { scheduleIds: scheduleIdsFromChannels.length > 0 ? scheduleIdsFromChannels : ["__none__"] })
    .orderBy("scheduleChannels.sortOrder", "ASC")
    .getMany() as ScheduleWithRelations[];

  const scheduleIds = schedules.map((schedule) => schedule.id);
  if (scheduleIds.length === 0) {
    return [];
  }

  const existingPosts = await postRepo.find({
    select: {
      id: true,
      scheduleId: true,
      channelId: true,
      date: true,
    },
    where: {
      scheduleId: In(scheduleIds),
      date: Between(fromDate, toDate),
    },
  });

  return schedules.flatMap((schedule) => {
    const targetChannels = schedule.scheduleChannels
      ?.filter((sc) => params.channelIds.includes(sc.channelId))
      .map((sc) => sc.channel) ?? [];

    const legacyChannel = schedule.channel && params.channelIds.includes(schedule.channel.id)
      ? schedule.channel
      : null;

    const channels = targetChannels.length > 0
      ? targetChannels
      : legacyChannel
        ? [legacyChannel]
        : [];

    if (channels.length === 0) {
      return [];
    }

    const targetChannelIds = channels.map((c) => c.id);
    const slots = generateScheduleDates(schedule, fromDate, toDate);

    return slots.flatMap((slotDate) => {
      const isSkipped = (schedule.skippedSlots ?? []).some((slot) =>
        isSameMinute(new Date(slot.date), slotDate)
      );
      if (isSkipped) return [];

      return channels
        .filter((channel) => {
          const isTaken = existingPosts.some(
            (post) =>
              post.scheduleId === schedule.id &&
              post.channelId === channel.id &&
              isSameMinute(new Date(post.date), slotDate)
          );
          return !isTaken;
        })
        .map((channel) => toVirtualPost(schedule, slotDate, channel, targetChannelIds));
    });
  });
};
