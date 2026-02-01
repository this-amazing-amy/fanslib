import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { FilterPreset, FilterPresetSchema } from "../../entity";
import { validateAndCleanFilters } from "../../validation";

export const UpdateFilterPresetRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateFilterPresetRequestBodySchema = z.object({
  name: z.string().optional(),
  filters: MediaFilterSchema.optional(),
});

export const UpdateFilterPresetResponseSchema = FilterPresetSchema.omit({ filtersJson: true }).extend({
  filters: MediaFilterSchema,
});


export const updateFilterPreset = async (
  id: string,
  payload: z.infer<typeof UpdateFilterPresetRequestBodySchema>
): Promise<z.infer<typeof UpdateFilterPresetResponseSchema> | null> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);

  const preset = await repository.findOne({ where: { id } });
  if (!preset) return null;

  if (payload.name !== undefined) {
    preset.name = payload.name;
  }
  if (payload.filters !== undefined) {
    preset.filtersJson = JSON.stringify(payload.filters);
  }

  const savedPreset = await repository.save(preset);

  const validatedFilters = await validateAndCleanFilters(JSON.parse(savedPreset.filtersJson));

  return {
    ...savedPreset,
    filters: validatedFilters,
  };
};

