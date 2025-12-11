import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { ContentSchedule, ContentScheduleSchema, SkippedScheduleSlotSchema } from "../../entity";

export const FetchAllContentSchedulesResponseSchema = t.Array(t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: ChannelSchema,
    skippedSlots: t.Array(SkippedScheduleSlotSchema),
  }),
]));

export const fetchAllContentSchedules = async (): Promise<typeof FetchAllContentSchedulesResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  return repository.find({
    relations: {
      channel: {
        type: true,
        defaultHashtags: true,
      },
      skippedSlots: true,
    },
    order: {
      createdAt: "DESC",
    },
  });
};

