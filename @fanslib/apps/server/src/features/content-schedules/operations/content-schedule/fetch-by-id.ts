import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema, ScheduleChannelSchema, SkippedScheduleSlotSchema } from "../../entity";

export const FetchContentScheduleByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const ScheduleChannelWithChannelSchema = t.Composite([
  ScheduleChannelSchema,
  t.Object({
    channel: t.Any(), // Channel is now Zod, can't use with TypeBox
  }),
]);

export const FetchContentScheduleByIdResponseSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: t.Nullable(t.Any()), // Channel is now Zod
    skippedSlots: t.Array(SkippedScheduleSlotSchema),
    scheduleChannels: t.Array(ScheduleChannelWithChannelSchema),
  }),
]);

export const fetchContentScheduleById = async (id: string): Promise<typeof FetchContentScheduleByIdResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  const schedule = await repository.findOne({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
      skippedSlots: true,
      scheduleChannels: {
        channel: { type: true, defaultHashtags: true },
      },
    },
  });

  if (!schedule) return null;

  return {
    ...schedule,
    channel: schedule.channel ?? null,
    scheduleChannels: schedule.scheduleChannels ?? [],
  };
};

