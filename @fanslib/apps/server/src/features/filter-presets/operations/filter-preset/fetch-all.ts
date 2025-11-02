import { db } from "../../../../lib/db";
import { FilterPreset } from "../../entity";

export const getAllFilterPresets = async (): Promise<FilterPreset[]> => {
  const database = await db();
  return database.manager.find(FilterPreset, {
    order: { createdAt: "DESC" },
  });
};

