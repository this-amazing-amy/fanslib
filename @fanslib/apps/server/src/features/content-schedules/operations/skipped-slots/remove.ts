import { t } from "elysia";
import { db } from "../../../../lib/db";
import { SkippedScheduleSlot } from "../../entity";

export const RemoveSkippedSlotRequestParamsSchema = t.Object({
  id: t.String(),
});

export const RemoveSkippedSlotResponseSchema = t.Object({
  success: t.Boolean(),
});

export const removeSkippedSlot = async (
  id: string
): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(SkippedScheduleSlot);

  const result = await repository.delete({ id });

  return (result.affected ?? 0) > 0;
};
