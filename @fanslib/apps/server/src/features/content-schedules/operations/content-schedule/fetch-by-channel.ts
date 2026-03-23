import { z } from "zod";
import { db } from "../../../../lib/db";
import {
  ContentSchedule,
  ContentScheduleSchema,
  ScheduleChannel,
  ScheduleChannelSchema,
  SkippedScheduleSlotSchema,
} from "../../entity";
import { ChannelSchema } from "../../../channels/entity";

export const ScheduleChannelWithChannelSchema = ScheduleChannelSchema.extend({
  channel: ChannelSchema,
});

export const ContentScheduleWithChannelsSchema = ContentScheduleSchema.extend({
  skippedSlots: z.array(SkippedScheduleSlotSchema),
  scheduleChannels: z.array(ScheduleChannelWithChannelSchema),
});

export const FetchContentSchedulesByChannelResponseSchema = z.array(
  ContentScheduleWithChannelsSchema,
);

export const fetchContentSchedulesByChannel = async (
  channelId: string,
): Promise<z.infer<typeof FetchContentSchedulesByChannelResponseSchema>> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

  const scheduleChannels = await scheduleChannelRepo.find({
    where: { channelId },
    select: { scheduleId: true },
  });
  const scheduleIdsFromChannels = scheduleChannels.map((sc) => sc.scheduleId);

  if (scheduleIdsFromChannels.length === 0) {
    return [];
  }

  const schedules = await scheduleRepo
    .createQueryBuilder("schedule")
    .leftJoinAndSelect("schedule.skippedSlots", "skippedSlots")
    .leftJoinAndSelect("schedule.scheduleChannels", "scheduleChannels")
    .leftJoinAndSelect("scheduleChannels.channel", "scChannel")
    .leftJoinAndSelect("scChannel.type", "scChannelType")
    .leftJoinAndSelect("scChannel.defaultHashtags", "scChannelHashtags")
    .where("schedule.id IN (:...scheduleIds)", {
      scheduleIds: scheduleIdsFromChannels,
    })
    .orderBy("schedule.createdAt", "DESC")
    .addOrderBy("scheduleChannels.sortOrder", "ASC")
    .getMany();

  return schedules.map((schedule) => ({
    ...schedule,
    scheduleChannels: schedule.scheduleChannels ?? [],
  }));
};
