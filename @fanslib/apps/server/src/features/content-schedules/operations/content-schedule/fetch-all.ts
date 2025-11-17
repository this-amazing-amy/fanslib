import { t } from "elysia";
import { ChannelSchema } from "~/schemas";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema } from "../../entity";

export const FetchAllContentSchedulesResponseSchema = t.Array(t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: ChannelSchema,
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
    },
    order: {
      createdAt: "DESC",
    },
  });
};

