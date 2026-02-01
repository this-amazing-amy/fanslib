import { z } from "zod";
import { db } from "../../../../lib/db";
import { FilterPreset, FilterPresetSchema } from "../../entity";
import { validateAndCleanFilters } from "../../validation";

export const FetchFilterPresetByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchFilterPresetByIdResponseSchema = FilterPresetSchema

export const fetchFilterPresetById = async (id: string): Promise<z.infer<typeof FetchFilterPresetByIdResponseSchema> | null> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);

  const preset = await repository.findOne({ where: { id } });
  if (!preset) return null;

  const validatedFilters = await validateAndCleanFilters(JSON.parse(preset.filtersJson));

  if (JSON.stringify(validatedFilters) !== preset.filtersJson) {
    preset.filtersJson = JSON.stringify(validatedFilters);
    await repository.save(preset);
  }

  return preset;
};

