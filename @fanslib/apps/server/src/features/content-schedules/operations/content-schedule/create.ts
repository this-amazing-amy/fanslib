import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { ContentSchedule, ContentScheduleSchema, ContentScheduleTypeSchema, ScheduleChannel, ScheduleChannelSchema } from "../../entity";

export const ScheduleChannelInputSchema = t.Object({
  channelId: t.String(),
  mediaFilterOverrides: t.Optional(t.Nullable(MediaFilterSchema)),
  sortOrder: t.Optional(t.Number()),
});

export const CreateContentScheduleRequestBodySchema = t.Object({
  channelId: t.Optional(t.String()),
  scheduleChannels: t.Optional(t.Array(ScheduleChannelInputSchema)),
  name: t.String(),
  emoji: t.Optional(t.String()),
  color: t.Optional(t.String()),
  type: ContentScheduleTypeSchema,
  postsPerTimeframe: t.Optional(t.Number()),
  preferredDays: t.Optional(t.Array(t.String())),
  preferredTimes: t.Optional(t.Array(t.String())),
  mediaFilters: t.Optional(MediaFilterSchema),
});

export const ScheduleChannelWithChannelSchema = t.Composite([
  ScheduleChannelSchema,
  t.Object({
    channel: t.Any(), // Channel is now Zod, can't use with TypeBox
  }),
]);

export const CreateContentScheduleResponseSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: t.Nullable(t.Any()), // Channel is now Zod
    scheduleChannels: t.Array(ScheduleChannelWithChannelSchema),
  }),
]);

const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const createContentSchedule = async (
  data: typeof CreateContentScheduleRequestBodySchema.static
): Promise<typeof CreateContentScheduleResponseSchema.static> => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

  const schedule = new ContentSchedule();
  const now = new Date();
  const scheduleId = crypto.randomUUID();

  const mediaFilters = data.mediaFilters ? stringifyMediaFilters(data.mediaFilters) : undefined;

  Object.assign(schedule, {
    name: data.name,
    emoji: data.emoji,
    color: data.color,
    type: data.type,
    postsPerTimeframe: data.postsPerTimeframe,
    preferredDays: data.preferredDays,
    preferredTimes: data.preferredTimes,
    channelId: data.channelId ?? null,
    id: scheduleId,
    createdAt: now,
    updatedAt: now,
    mediaFilters,
  });

  await scheduleRepo.save(schedule);

  const scheduleChannelsInput = data.scheduleChannels ?? (data.channelId ? [{ channelId: data.channelId }] : []);

  const scheduleChannelEntities = scheduleChannelsInput.map((sc, index) => {
    const entity = new ScheduleChannel();
    Object.assign(entity, {
      scheduleId,
      channelId: sc.channelId,
      mediaFilterOverrides: sc.mediaFilterOverrides ?? null,
      sortOrder: sc.sortOrder ?? index,
      createdAt: now,
      updatedAt: now,
    });
    return entity;
  });

  if (scheduleChannelEntities.length > 0) {
    await scheduleChannelRepo.save(scheduleChannelEntities);
  }

  const result = await scheduleRepo.findOneOrFail({
    where: { id: scheduleId },
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

