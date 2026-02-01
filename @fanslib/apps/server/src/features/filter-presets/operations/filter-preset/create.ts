import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { FilterPreset, FilterPresetSchema } from "../../entity";
import { validateAndCleanFilters } from "../../validation";

export const CreateFilterPresetRequestBodySchema = z.object({
  name: z.string(),
  filters: MediaFilterSchema,
});

export const CreateFilterPresetResponseSchema = FilterPresetSchema.omit({ filtersJson: true }).extend({
  filters: MediaFilterSchema,
});

export const createFilterPreset = async (
  payload: z.infer<typeof CreateFilterPresetRequestBodySchema>
): Promise<z.infer<typeof CreateFilterPresetResponseSchema>> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);

  const preset = repository.create({
    name: payload.name,
    filtersJson: JSON.stringify(payload.filters),
  });

  const savedPreset = await repository.save(preset);

  const validatedFilters = await validateAndCleanFilters(JSON.parse(savedPreset.filtersJson));

  return {
    ...savedPreset,
    filters: validatedFilters,
  };
};

