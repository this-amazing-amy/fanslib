import { z } from "zod";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema, ScheduleChannel, ScheduleChannelSchema, SkippedScheduleSlotSchema } from "../../entity";
import { ChannelSchema } from "../../../channels/entity";

export const ScheduleChannelWithChannelSchema = ScheduleChannelSchema.extend({
  channel: ChannelSchema,
});

export const ContentScheduleWithChannelSchema = ContentScheduleSchema.extend({
  channel: ChannelSchema.nullable(),
  skippedSlots: z.array(SkippedScheduleSlotSchema),
  scheduleChannels: z.array(ScheduleChannelWithChannelSchema),
});

export const FetchContentSchedulesByChannelResponseSchema = z.array(ContentScheduleWithChannelSchema);

export const fetchContentSchedulesByChannel = async (
  channelId: string
): Promise<z.infer<typeof FetchContentSchedulesByChannelResponseSchema>> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

  const scheduleChannels = await scheduleChannelRepo.find({
    where: { channelId },
    select: { scheduleId: true },
  });
  const scheduleIdsFromChannels = scheduleChannels.map((sc) => sc.scheduleId);

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
    .where("schedule.channelId = :channelId", { channelId })
    .orWhere("schedule.id IN (:...scheduleIds)", { scheduleIds: scheduleIdsFromChannels.length > 0 ? scheduleIdsFromChannels : ["__none__"] })
    .orderBy("schedule.createdAt", "DESC")
    .addOrderBy("scheduleChannels.sortOrder", "ASC")
    .getMany();

  return schedules.map((schedule) => ({
    ...schedule,
    channel: schedule.channel ?? null,
    scheduleChannels: schedule.scheduleChannels ?? [],
  }));
};

