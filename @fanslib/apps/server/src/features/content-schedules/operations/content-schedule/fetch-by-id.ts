import { z } from "zod";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema, ScheduleChannelSchema, SkippedScheduleSlotSchema } from "../../entity";
import { ChannelSchema } from "../../../channels/entity";

export const FetchContentScheduleByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const ScheduleChannelWithChannelSchema = ScheduleChannelSchema.extend({
  channel: ChannelSchema,
});

export const FetchContentScheduleByIdResponseSchema = ContentScheduleSchema.extend({
  channel: ChannelSchema.nullable(),
  skippedSlots: z.array(SkippedScheduleSlotSchema),
  scheduleChannels: z.array(ScheduleChannelWithChannelSchema),
});

export const fetchContentScheduleById = async (id: string): Promise<z.infer<typeof FetchContentScheduleByIdResponseSchema> | null> => {
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

