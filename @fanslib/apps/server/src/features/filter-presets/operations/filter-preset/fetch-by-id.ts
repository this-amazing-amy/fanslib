import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FilterPreset, FilterPresetSchema } from "../../entity";
import { validateAndCleanFilters } from "../../validation";

export const GetFilterPresetByIdResponseSchema = t.Union([
  FilterPresetSchema,
  t.Object({ error: t.String() }),
  t.Null(),
]);

export const getFilterPresetById = async (id: string): Promise<typeof GetFilterPresetByIdResponseSchema.static> => {
  try {
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
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch filter preset by id");
  }
};

