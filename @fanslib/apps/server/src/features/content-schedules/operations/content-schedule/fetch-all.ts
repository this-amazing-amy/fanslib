import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { ContentSchedule, ContentScheduleSchema, ScheduleChannelSchema, SkippedScheduleSlotSchema } from "../../entity";

export const ScheduleChannelWithChannelSchema = t.Composite([
  ScheduleChannelSchema,
  t.Object({
    channel: ChannelSchema,
  }),
]);

export const FetchAllContentSchedulesResponseSchema = t.Array(t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: t.Nullable(ChannelSchema),
    skippedSlots: t.Array(SkippedScheduleSlotSchema),
    scheduleChannels: t.Array(ScheduleChannelWithChannelSchema),
  }),
]));

export const fetchAllContentSchedules = async (): Promise<typeof FetchAllContentSchedulesResponseSchema.static> => {
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
  }));
};

