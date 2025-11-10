import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema } from "../../entity";

export const FetchAllContentSchedulesResponseSchema = t.Array(ContentScheduleSchema);

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

