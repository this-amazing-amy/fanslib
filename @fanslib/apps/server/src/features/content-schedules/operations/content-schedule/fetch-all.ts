import { t } from "elysia";
import { ChannelSchema, ChannelTypeSchema } from "~/schemas";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema } from "../../entity";

export const FetchAllContentSchedulesResponseSchema = t.Array(t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: t.Composite([
      ChannelSchema,
      t.Object({
        type: ChannelTypeSchema,
      }),
    ]),
  }),
]));

export const fetchAllContentSchedules = async (): Promise<typeof FetchAllContentSchedulesResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  return repository.find({
    relations: {
      channel: {
        type: true,
      },
    },
    order: {
      createdAt: "DESC",
    },
  });
};

