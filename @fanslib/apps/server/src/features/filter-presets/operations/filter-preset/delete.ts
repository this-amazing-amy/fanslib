import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FilterPreset } from "../../entity";

export const DeleteFilterPresetResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteFilterPreset = async (id: string): Promise<typeof DeleteFilterPresetResponseSchema.static> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);

  await repository.delete(id);

  return { success: true };
};

