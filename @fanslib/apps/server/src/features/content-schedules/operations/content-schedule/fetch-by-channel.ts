import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { ContentSchedule, ContentScheduleSchema, ScheduleChannel, ScheduleChannelSchema, SkippedScheduleSlotSchema } from "../../entity";

export const ScheduleChannelWithChannelSchema = t.Composite([
  ScheduleChannelSchema,
  t.Object({
    channel: ChannelSchema,
  }),
]);

export const ContentScheduleWithChannelSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: t.Nullable(ChannelSchema),
    skippedSlots: t.Array(SkippedScheduleSlotSchema),
    scheduleChannels: t.Array(ScheduleChannelWithChannelSchema),
  }),
]);

export const FetchContentSchedulesByChannelResponseSchema = t.Array(ContentScheduleWithChannelSchema);

export const fetchContentSchedulesByChannel = async (
  channelId: string
): Promise<typeof FetchContentSchedulesByChannelResponseSchema.static> => {
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

