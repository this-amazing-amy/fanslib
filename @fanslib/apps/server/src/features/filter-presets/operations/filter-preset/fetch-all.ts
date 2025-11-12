import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FilterPreset, FilterPresetSchema } from "../../entity";

export const FetchAllFilterPresetsResponseSchema = t.Array(FilterPresetSchema);

export const fetchAllFilterPresets = async (): Promise<typeof FetchAllFilterPresetsResponseSchema.static> => {
  const database = await db();
  return database.manager.find(FilterPreset, {
    order: { createdAt: "DESC" },
  });
};

