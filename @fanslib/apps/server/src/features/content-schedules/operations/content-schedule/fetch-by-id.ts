import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema } from "../../entity";

export const FetchContentScheduleByIdResponseSchema = t.Union([
  ContentScheduleSchema,
  t.Object({ error: t.String() }),
  t.Null(),
]);

export const fetchContentScheduleById = async (id: string): Promise<typeof FetchContentScheduleByIdResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  return repository.findOne({
    where: { id },
    relations: {
      channel: true,
    },
  });
};

