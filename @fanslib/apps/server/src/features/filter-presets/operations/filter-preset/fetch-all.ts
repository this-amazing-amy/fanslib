import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FilterPreset, FilterPresetSchema } from "../../entity";

export const GetAllFilterPresetsResponseSchema = t.Array(FilterPresetSchema);

export const getAllFilterPresets = async (): Promise<typeof GetAllFilterPresetsResponseSchema.static> => {
  const database = await db();
  return database.manager.find(FilterPreset, {
    order: { createdAt: "DESC" },
  });
};

