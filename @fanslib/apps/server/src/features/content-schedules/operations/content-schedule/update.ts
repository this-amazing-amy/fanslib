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
  preferredDays: t.Optional(t.Array(t.String())),
  preferredTimes: t.Optional(t.Array(t.String())),
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

  Object.assign(schedule, {
    ...updates,
    updatedAt: new Date().toISOString(),
    ...(hasMediaFiltersUpdate && { mediaFilters: mediaFiltersValue }),
  });

  await repository.save(schedule);

  return repository.findOne({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
    },
  });
};

