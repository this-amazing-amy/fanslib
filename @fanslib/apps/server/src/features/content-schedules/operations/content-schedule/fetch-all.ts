import { t } from "elysia";
import type { z } from "zod";
import { db } from "../../../../lib/db";
import { type ChannelSchema } from "../../../channels/entity";
import {
  ContentSchedule,
  ContentScheduleSchema,
  ScheduleChannelSchema,
  SkippedScheduleSlotSchema,
} from "../../entity";

export const ScheduleChannelWithChannelSchema = t.Composite([
  ScheduleChannelSchema,
  t.Object({
    channel: t.Any(), // Channel is now Zod, can't use with TypeBox
  }),
]);

export const FetchAllContentSchedulesResponseSchema = t.Array(
  t.Composite([
    ContentScheduleSchema,
    t.Object({
      channel: t.Nullable(t.Any()), // Channel is now Zod
      skippedSlots: t.Array(SkippedScheduleSlotSchema),
      scheduleChannels: t.Array(ScheduleChannelWithChannelSchema),
    }),
  ]),
);

type ChannelType = z.infer<typeof ChannelSchema>;

export const fetchAllContentSchedules = async (): Promise<
  (Omit<ContentSchedule, "channel" | "scheduleChannels" | "skippedSlots"> & {
    channel: ChannelType | null;
    skippedSlots: typeof SkippedScheduleSlotSchema.static[];
    scheduleChannels: (typeof ScheduleChannelSchema.static & {
      channel: ChannelType;
    })[];
  })[]
> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  const schedules = await repository.find({
    relations: {
      channel: {
        type: true,
        defaultHashtags: true,
      },
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
    channel: schedule.channel ?? null,
    scheduleChannels: schedule.scheduleChannels ?? [],
  })) as never;
};
