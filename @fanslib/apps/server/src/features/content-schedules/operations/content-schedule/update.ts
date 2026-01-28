import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { ContentSchedule, ContentScheduleSchema, ContentScheduleTypeSchema, ScheduleChannel, ScheduleChannelSchema } from "../../entity";

export const UpdateContentScheduleRequestParamsSchema = t.Object({
  id: t.String(),
});

export const ScheduleChannelUpdateInputSchema = t.Object({
  id: t.Optional(t.String()),
  channelId: t.String(),
  mediaFilterOverrides: t.Optional(t.Nullable(MediaFilterSchema)),
  sortOrder: t.Optional(t.Number()),
});

export const UpdateContentScheduleRequestBodySchema = t.Object({
  channelId: t.Optional(t.Nullable(t.String())),
  scheduleChannels: t.Optional(t.Array(ScheduleChannelUpdateInputSchema)),
  name: t.Optional(t.String()),
  emoji: t.Optional(t.Union([t.String(), t.Null()])),
  color: t.Optional(t.Union([t.String(), t.Null()])),
  type: t.Optional(ContentScheduleTypeSchema),
  postsPerTimeframe: t.Optional(t.Number()),
  preferredDays: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  preferredTimes: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  mediaFilters: t.Optional(t.Union([MediaFilterSchema, t.Null()])),
});

export const ScheduleChannelWithChannelSchema = t.Composite([
  ScheduleChannelSchema,
  t.Object({
    channel: ChannelSchema,
  }),
]);

export const UpdateContentScheduleResponseSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: t.Nullable(ChannelSchema),
    scheduleChannels: t.Array(ScheduleChannelWithChannelSchema),
  }),
]);


const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const updateContentSchedule = async (
  id: string,
  updates: typeof UpdateContentScheduleRequestBodySchema.static
): Promise<typeof UpdateContentScheduleResponseSchema.static | null> => {
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

