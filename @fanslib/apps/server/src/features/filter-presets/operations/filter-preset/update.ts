import type { UpdateFilterPresetRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { FilterPreset } from "../../entity";

export const updateFilterPreset = async (
  id: string,
  payload: UpdateFilterPresetRequest
): Promise<FilterPreset | null> => {
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

