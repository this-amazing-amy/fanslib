import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { FilterPreset, FilterPresetSchema } from "../../entity";
import { validateAndCleanFilters } from "../../validation";

export const CreateFilterPresetRequestBodySchema = t.Object({
  name: t.String(),
  filters: MediaFilterSchema,
});

export const CreateFilterPresetResponseSchema = t.Composite([
  t.Omit(FilterPresetSchema, ["filtersJson"]),
  t.Object({
    filters: MediaFilterSchema,
  }),
]);

export const createFilterPreset = async (
  payload: typeof CreateFilterPresetRequestBodySchema.static
): Promise<typeof CreateFilterPresetResponseSchema.static> => {
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

