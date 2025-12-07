import { t } from "elysia";
import { db } from "../../../../lib/db";
import { SkippedScheduleSlot, SkippedScheduleSlotSchema } from "../../entity";

export const CreateSkippedSlotRequestBodySchema = t.Object({
  scheduleId: t.String(),
  date: t.String(),
});

export const CreateSkippedSlotResponseSchema = SkippedScheduleSlotSchema;

export const createSkippedSlot = async (
  data: typeof CreateSkippedSlotRequestBodySchema.static
): Promise<typeof CreateSkippedSlotResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(SkippedScheduleSlot);

  const slot = repository.create({
    scheduleId: data.scheduleId,
    date: data.date,
  });

  return repository.save(slot);
};
