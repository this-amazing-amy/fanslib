import { isSameMinute } from "date-fns";
import { Between, In } from "typeorm";
import type { z } from "zod";
import { db } from "../../../lib/db";
import { CHANNEL_TYPES } from "../../channels/channelTypes";
import { Channel } from "../../channels/entity";
import { ContentSchedule, ScheduleChannel } from "../../content-schedules/entity";
import { generateScheduleDates } from "../../content-schedules/operations/generate-virtual-posts";
import { Post } from "../../posts/entity";
import { Subreddit } from "../../subreddits/entity";
import type { AssignMediaRequestBodySchema, AssignMediaResponseSchema } from "../schema";
import { uniqueById } from "./assign-helpers";
import { assignRedditScheduleSlots } from "./assign-reddit-slots";
import { assignStandardScheduleSlots, type ScheduleWithChannels } from "./assign-standard-slots";

type AssignMediaResult = z.infer<typeof AssignMediaResponseSchema>;

export const assignMediaToSchedules = async (
  payload: z.infer<typeof AssignMediaRequestBodySchema>,
): Promise<AssignMediaResult> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);
  const postRepo = dataSource.getRepository(Post);
  const subredditRepo = dataSource.getRepository(Subreddit);
  const channelRepo = dataSource.getRepository(Channel);

  const fromDate = new Date(payload.fromDate);
  const toDate = new Date(payload.toDate);

  const scheduleChannels = await scheduleChannelRepo.find({
    where: { channelId: In(payload.channelIds) },
    select: { scheduleId: true },
  });
  const scheduleIdsFromChannels = [...new Set(scheduleChannels.map((sc) => sc.scheduleId))];

  const channels = uniqueById(
    await channelRepo.find({
      where: {
        id: In(payload.channelIds),
      },
    }),
  );

  if (scheduleIdsFromChannels.length === 0) {
    return {
      created: 0,
      unfilled: [],
      summary: channels.map((channel) => ({
        channelId: channel.id,
        channelName: channel.name,
        draftsCreated: 0,
        uniqueMediaUsed: 0,
      })),
    };
  }

  const schedules = (await scheduleRepo
    .createQueryBuilder("schedule")
    .leftJoinAndSelect("schedule.scheduleChannels", "scheduleChannels")
    .leftJoinAndSelect("scheduleChannels.channel", "scChannel")
    .leftJoinAndSelect("scChannel.type", "scChannelType")
    .where("schedule.id IN (:...scheduleIds)", {
      scheduleIds: scheduleIdsFromChannels,
    })
    .getMany()) as ScheduleWithChannels[];

  if (schedules.length === 0) {
    return {
      created: 0,
      unfilled: [],
      summary: channels.map((channel) => ({
        channelId: channel.id,
        channelName: channel.name,
        draftsCreated: 0,
        uniqueMediaUsed: 0,
      })),
    };
  }

  const existingPosts = await postRepo.find({
    where: {
      scheduleId: In(schedules.map((schedule) => schedule.id)),
      date: Between(fromDate, toDate),
    },
    relations: {
      postMedia: {
        media: true,
      },
    },
  });

  const existingMediaIds = existingPosts
    .flatMap((post) => post.postMedia?.map((pm) => pm.media?.id) ?? [])
    .filter((id): id is string => Boolean(id));

  const subreddits = await subredditRepo.find({
    relations: ["channel"],
  });

  const scheduleAssignments = await Promise.all(
    schedules.map(async (schedule) => {
      const targetChannels =
        schedule.scheduleChannels?.filter((sc) => payload.channelIds.includes(sc.channelId)) ?? [];

      if (targetChannels.length === 0) {
        return { createdPosts: [], unfilled: [] };
      }

      const schedulePosts = existingPosts.filter((post) => post.scheduleId === schedule.id);
      const allSlots = generateScheduleDates(schedule, fromDate, toDate).filter(
        (slot) => slot >= fromDate && slot <= toDate,
      );

      const slots = allSlots.filter(
        (slot) => !schedulePosts.some((post) => isSameMinute(new Date(post.date), slot)),
      );

      const redditChannel = targetChannels.find(
        (sc) => sc.channel?.typeId === CHANNEL_TYPES.reddit.id,
      );

      if (redditChannel) {
        return assignRedditScheduleSlots(
          schedule,
          redditChannel.channel,
          slots,
          subreddits,
          existingMediaIds,
        );
      }

      const scheduleWithFilteredChannels: ScheduleWithChannels = {
        ...schedule,
        scheduleChannels: targetChannels,
      };

      return assignStandardScheduleSlots(scheduleWithFilteredChannels, slots, existingMediaIds);
    }),
  );

  const createdPosts = scheduleAssignments.flatMap((assignment) => assignment.createdPosts);
  const unfilled = scheduleAssignments.flatMap((assignment) => assignment.unfilled);

  const summary = channels.map((channel) => {
    const channelPosts = createdPosts.filter((post) => post.channelId === channel.id);
    const uniqueMedia = Array.from(new Set(channelPosts.map((post) => post.mediaId)));
    return {
      channelId: channel.id,
      channelName: channel.name,
      draftsCreated: channelPosts.length,
      uniqueMediaUsed: uniqueMedia.length,
    };
  });

  return {
    created: createdPosts.length,
    unfilled,
    summary,
  };
};
