import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FilterPreset } from "../../entity";

export const DeleteFilterPresetRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteFilterPresetResponseSchema = t.Object({
  success: t.Boolean(),
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

