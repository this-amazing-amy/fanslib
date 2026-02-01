import { z } from "zod";
import { db } from "../../../../lib/db";
import { SkippedScheduleSlot } from "../../entity";

export const RemoveSkippedSlotRequestParamsSchema = z.object({
  id: z.string(),
});

export const RemoveSkippedSlotResponseSchema = z.object({
  success: z.boolean(),
});

export const removeSkippedSlot = async (
  id: string
): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(SkippedScheduleSlot);

  const result = await repository.delete({ id });

  return (result.affected ?? 0) > 0;
};
