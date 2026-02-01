import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { ChannelSchema } from "../../../channels/entity";
import { ContentSchedule, ContentScheduleSchema, ContentScheduleTypeSchema, ScheduleChannel, ScheduleChannelSchema } from "../../entity";

export const UpdateContentScheduleRequestParamsSchema = z.object({
  id: z.string(),
});

export const ScheduleChannelUpdateInputSchema = z.object({
  id: z.string().optional(),
  channelId: z.string(),
  mediaFilterOverrides: MediaFilterSchema.nullable().optional(),
  sortOrder: z.number().optional(),
});

export const UpdateContentScheduleRequestBodySchema = z.object({
  channelId: z.string().nullable().optional(),
  scheduleChannels: z.array(ScheduleChannelUpdateInputSchema).optional(),
  name: z.string().optional(),
  emoji: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  type: ContentScheduleTypeSchema.optional(),
  postsPerTimeframe: z.number().optional(),
  preferredDays: z.array(z.string()).nullable().optional(),
  preferredTimes: z.array(z.string()).nullable().optional(),
  mediaFilters: MediaFilterSchema.nullable().optional(),
});

export const ScheduleChannelWithChannelSchema = ScheduleChannelSchema.extend({
  channel: ChannelSchema,
});

export const UpdateContentScheduleResponseSchema = ContentScheduleSchema.extend({
  channel: ChannelSchema.nullable(),
  scheduleChannels: z.array(ScheduleChannelWithChannelSchema),
});


const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const updateContentSchedule = async (
  id: string,
  updates: z.infer<typeof UpdateContentScheduleRequestBodySchema>
): Promise<z.infer<typeof UpdateContentScheduleResponseSchema> | null> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

  const schedule = await scheduleRepo.findOne({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
      scheduleChannels: { channel: { type: true, defaultHashtags: true } },
    },
  });

  if (!schedule) return null;

  const hasMediaFiltersUpdate = "mediaFilters" in updates;
  const mediaFiltersValue = hasMediaFiltersUpdate
    ? updates.mediaFilters === null || (Array.isArray(updates.mediaFilters) && updates.mediaFilters.length === 0)
      ? null
      : stringifyMediaFilters(updates.mediaFilters)
    : undefined;

  const hasPreferredDaysUpdate = "preferredDays" in updates;
  const preferredDaysValue = hasPreferredDaysUpdate
    ? updates.preferredDays === null || updates.preferredDays === undefined || (Array.isArray(updates.preferredDays) && updates.preferredDays.length === 0)
      ? null
      : updates.preferredDays
    : undefined;

  const hasPreferredTimesUpdate = "preferredTimes" in updates;
  const preferredTimesValue = hasPreferredTimesUpdate
    ? updates.preferredTimes === null || updates.preferredTimes === undefined || (Array.isArray(updates.preferredTimes) && updates.preferredTimes.length === 0)
      ? null
      : updates.preferredTimes
    : undefined;

  const { scheduleChannels: scheduleChannelsInput, ...scheduleUpdates } = updates;

  Object.assign(schedule, {
    ...scheduleUpdates,
    updatedAt: new Date(),
    ...(hasMediaFiltersUpdate && { mediaFilters: mediaFiltersValue }),
    ...(hasPreferredDaysUpdate && { preferredDays: preferredDaysValue }),
    ...(hasPreferredTimesUpdate && { preferredTimes: preferredTimesValue }),
  });

  await scheduleRepo.save(schedule);

  if (scheduleChannelsInput !== undefined) {
    const existingChannelIds = schedule.scheduleChannels.map((sc) => sc.id);
    const inputIds = scheduleChannelsInput.map((sc) => sc.id).filter((scId): scId is string => !!scId);
    const idsToRemove = existingChannelIds.filter((existingId) => !inputIds.includes(existingId));

    if (idsToRemove.length > 0) {
      await scheduleChannelRepo.delete({ id: In(idsToRemove) });
    }

    const now = new Date();
    const entitiesToSave = scheduleChannelsInput.map((sc, index) => {
      const existing = sc.id ? schedule.scheduleChannels.find((e) => e.id === sc.id) : undefined;
      const entity = existing ?? new ScheduleChannel();
      Object.assign(entity, {
        scheduleId: id,
        channelId: sc.channelId,
        mediaFilterOverrides: sc.mediaFilterOverrides ?? null,
        sortOrder: sc.sortOrder ?? index,
        updatedAt: now,
        ...(!existing && { createdAt: now }),
      });
      return entity;
    });

    if (entitiesToSave.length > 0) {
      await scheduleChannelRepo.save(entitiesToSave);
    }
  }

  const result = await scheduleRepo.findOneOrFail({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
      scheduleChannels: { channel: { type: true, defaultHashtags: true } },
    },
  });

  return {
    ...result,
    channel: result.channel ?? null,
    scheduleChannels: result.scheduleChannels ?? [],
  };
};

