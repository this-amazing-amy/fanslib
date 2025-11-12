import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ContentSchedule } from "../../entity";

export const DeleteContentScheduleRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteContentScheduleResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteContentSchedule = async (id: string): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);
  const schedule = await repository.findOne({ where: { id } });
  if (!schedule) {
    return false;
  }
  await repository.delete({ id });
  return true;
};

