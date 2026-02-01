import { z } from "zod";
import { db } from "../../../../lib/db";
import { FilterPreset } from "../../entity";

export const DeleteFilterPresetRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteFilterPresetResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteFilterPreset = async (id: string): Promise<boolean> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);
  const preset = await repository.findOne({ where: { id } });
  if (!preset) {
    return false;
  }
  await repository.delete(id);
  return true;
};

