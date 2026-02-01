import { z } from "zod";
import { db } from "../../../../lib/db";
import { FilterPreset, FilterPresetSchema } from "../../entity";

export const FetchAllFilterPresetsResponseSchema = z.array(FilterPresetSchema);

export const fetchAllFilterPresets = async (): Promise<z.infer<typeof FetchAllFilterPresetsResponseSchema>> => {
  const database = await db();
  return database.manager.find(FilterPreset, {
    order: { createdAt: "DESC" },
  });
};

