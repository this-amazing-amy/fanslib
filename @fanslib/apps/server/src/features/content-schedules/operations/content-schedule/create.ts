import { t } from "elysia";
import { ChannelSchema } from "~/schemas";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { ContentSchedule, ContentScheduleSchema, ContentScheduleTypeSchema } from "../../entity";

export const CreateContentScheduleRequestBodySchema = t.Object({
  channelId: t.String(),
  type: ContentScheduleTypeSchema,
  postsPerTimeframe: t.Optional(t.Number()),
  preferredDays: t.Optional(t.Array(t.String())),
  preferredTimes: t.Optional(t.Array(t.String())),
  mediaFilters: t.Optional(MediaFilterSchema),
});

export const CreateContentScheduleResponseSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: ChannelSchema,
  }),
]);

const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const createContentSchedule = async (
  data: typeof CreateContentScheduleRequestBodySchema.static
): Promise<ContentSchedule> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  const schedule = new ContentSchedule();
  const now = new Date().toISOString();

  const mediaFilters = data.mediaFilters ? stringifyMediaFilters(data.mediaFilters) : undefined;

  Object.assign(schedule, {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    mediaFilters,
  });

  await repository.save(schedule);

  return repository.findOne({
    where: { id: schedule.id },
    relations: {
      channel: true,
    },
  }) as Promise<ContentSchedule>;
};

