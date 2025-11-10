import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { FilterPreset, FilterPresetSchema } from "../../entity";

export const UpdateFilterPresetRequestBodySchema = t.Object({
  name: t.Optional(t.String()),
  filters: t.Optional(MediaFilterSchema),
});

export const UpdateFilterPresetResponseSchema = t.Union([
  FilterPresetSchema,
  t.Object({ error: t.String() }),
  t.Null(),
]);

export const updateFilterPreset = async (
  id: string,
  payload: typeof UpdateFilterPresetRequestBodySchema.static
): Promise<typeof UpdateFilterPresetResponseSchema.static> => {
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

  return repository.save(preset);
};

