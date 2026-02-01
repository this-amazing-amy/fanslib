import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { ChannelSchema } from "../../../channels/entity";
import { ContentSchedule, ContentScheduleSchema, ContentScheduleTypeSchema, ScheduleChannel, ScheduleChannelSchema } from "../../entity";

export const ScheduleChannelInputSchema = z.object({
  channelId: z.string(),
  mediaFilterOverrides: MediaFilterSchema.nullable().optional(),
  sortOrder: z.number().optional(),
});

export const CreateContentScheduleRequestBodySchema = z.object({
  channelId: z.string().optional(),
  scheduleChannels: z.array(ScheduleChannelInputSchema).optional(),
  name: z.string(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  type: ContentScheduleTypeSchema,
  postsPerTimeframe: z.number().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  mediaFilters: MediaFilterSchema.optional(),
});

export const ScheduleChannelWithChannelSchema = ScheduleChannelSchema.extend({
  channel: ChannelSchema,
});

export const CreateContentScheduleResponseSchema = ContentScheduleSchema.extend({
  channel: ChannelSchema.nullable(),
  scheduleChannels: z.array(ScheduleChannelWithChannelSchema),
});

const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const createContentSchedule = async (
  data: z.infer<typeof CreateContentScheduleRequestBodySchema>
): Promise<z.infer<typeof CreateContentScheduleResponseSchema>> => {
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

