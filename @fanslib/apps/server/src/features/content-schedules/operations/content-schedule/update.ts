import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { ContentSchedule, ContentScheduleSchema, ContentScheduleTypeSchema } from "../../entity";

export const UpdateContentScheduleRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateContentScheduleRequestBodySchema = t.Object({
  channelId: t.Optional(t.String()),
  name: t.Optional(t.String()),
  emoji: t.Optional(t.Union([t.String(), t.Null()])),
  color: t.Optional(t.Union([t.String(), t.Null()])),
  type: t.Optional(ContentScheduleTypeSchema),
  postsPerTimeframe: t.Optional(t.Number()),
  preferredDays: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  preferredTimes: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  mediaFilters: t.Optional(t.Union([MediaFilterSchema, t.Null()])),
});

export const UpdateContentScheduleResponseSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: ChannelSchema,
  }),
]);


const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const updateContentSchedule = async (
  id: string,
  updates: typeof UpdateContentScheduleRequestBodySchema.static
): Promise<typeof UpdateContentScheduleResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  const schedule = await repository.findOne({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
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

  Object.assign(schedule, {
    ...updates,
    updatedAt: new Date(),
    ...(hasMediaFiltersUpdate && { mediaFilters: mediaFiltersValue }),
    ...(hasPreferredDaysUpdate && { preferredDays: preferredDaysValue }),
    ...(hasPreferredTimesUpdate && { preferredTimes: preferredTimesValue }),
  });

  await repository.save(schedule);

  return repository.findOne({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
    },
  });
};

