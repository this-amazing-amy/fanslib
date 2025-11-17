import { t } from "elysia";
import { ChannelSchema } from "~/schemas";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { ContentSchedule, ContentScheduleSchema, ContentScheduleTypeSchema } from "../../entity";

export const UpdateContentScheduleRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateContentScheduleRequestBodySchema = t.Object({
  channelId: t.Optional(t.String()),
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

  const mediaFiltersString =
    "mediaFilters" in updates
      ? updates.mediaFilters === null
        ? undefined
        : updates.mediaFilters
          ? stringifyMediaFilters(updates.mediaFilters)
          : undefined
      : undefined;

  Object.assign(schedule, {
    ...updates,
    updatedAt: new Date().toISOString(),
    ...(mediaFiltersString !== undefined && { mediaFilters: mediaFiltersString }),
  });

  await repository.save(schedule);

  return repository.findOne({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
    },
  });
};

