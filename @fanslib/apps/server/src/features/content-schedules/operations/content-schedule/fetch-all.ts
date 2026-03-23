import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import {
  ContentSchedule,
  ContentScheduleSchema,
  ScheduleChannelSchema,
  SkippedScheduleSlotSchema,
} from "../../entity";

export const ScheduleChannelWithChannelSchema = ScheduleChannelSchema.extend({
  channel: ChannelSchema,
});

export const FetchAllContentSchedulesResponseSchema = z.array(
  ContentScheduleSchema.extend({
    skippedSlots: z.array(SkippedScheduleSlotSchema),
    scheduleChannels: z.array(ScheduleChannelWithChannelSchema),
  }),
);

export const fetchAllContentSchedules = async (): Promise<
  z.infer<typeof FetchAllContentSchedulesResponseSchema>
> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  const schedules = await repository.find({
    relations: {
      skippedSlots: true,
      scheduleChannels: {
        channel: {
          type: true,
          defaultHashtags: true,
        },
      },
    },
    order: {
      createdAt: "DESC",
      scheduleChannels: {
        sortOrder: "ASC",
      },
    },
  });

  return schedules.map((schedule) => ({
    ...schedule,
    scheduleChannels: schedule.scheduleChannels ?? [],
  })) as never;
};
