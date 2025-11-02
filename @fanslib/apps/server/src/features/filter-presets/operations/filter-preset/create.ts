import type { CreateFilterPresetRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { FilterPreset } from "../../entity";

export const createFilterPreset = async (
  payload: CreateFilterPresetRequest
): Promise<FilterPreset> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);

  const preset = repository.create({
    name: payload.name,
    filtersJson: JSON.stringify(payload.filters),
  });

  return repository.save(preset);
};

