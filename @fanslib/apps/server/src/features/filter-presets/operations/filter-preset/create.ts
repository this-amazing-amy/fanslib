import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaFilterSchema } from "../../../library/schemas/media-filter";
import { FilterPreset, FilterPresetSchema } from "../../entity";

export const CreateFilterPresetRequestBodySchema = t.Object({
  name: t.String(),
  filters: MediaFilterSchema,
});

export const CreateFilterPresetResponseSchema = FilterPresetSchema;

export const createFilterPreset = async (
  payload: typeof CreateFilterPresetRequestBodySchema.static
): Promise<typeof CreateFilterPresetResponseSchema.static> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);

  const preset = repository.create({
    name: payload.name,
    filtersJson: JSON.stringify(payload.filters),
  });

  return repository.save(preset);
};

