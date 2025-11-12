import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { FilterPreset, FilterPresetSchema } from "../../entity";
import { validateAndCleanFilters } from "../../validation";

export const UpdateFilterPresetRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateFilterPresetRequestBodySchema = t.Object({
  name: t.Optional(t.String()),
  filters: t.Optional(MediaFilterSchema),
});

export const UpdateFilterPresetResponseSchema = t.Composite([
  t.Omit(FilterPresetSchema, ["filtersJson"]),
  t.Object({
    filters: MediaFilterSchema,
  }),
]);


export const updateFilterPreset = async (
  id: string,
  payload: typeof UpdateFilterPresetRequestBodySchema.static
): Promise<typeof UpdateFilterPresetResponseSchema.static | null> => {
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

