import { z } from "zod";
import { db } from "../../../../lib/db";
import { ContentSchedule } from "../../entity";

export const DeleteContentScheduleRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteContentScheduleResponseSchema = z.object({
  success: z.boolean(),
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

