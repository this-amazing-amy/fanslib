import { z } from "zod";
import { db } from "../../../../lib/db";
import { SkippedScheduleSlot, SkippedScheduleSlotSchema } from "../../entity";

export const CreateSkippedSlotRequestBodySchema = z.object({
  scheduleId: z.string(),
  date: z.coerce.date(),
});

export const CreateSkippedSlotResponseSchema = SkippedScheduleSlotSchema;

export const createSkippedSlot = async (
  data: z.infer<typeof CreateSkippedSlotRequestBodySchema>
): Promise<z.infer<typeof CreateSkippedSlotResponseSchema>> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(SkippedScheduleSlot);

  const slot = repository.create({
    scheduleId: data.scheduleId,
    date: data.date,
  });

  return repository.save(slot);
};
