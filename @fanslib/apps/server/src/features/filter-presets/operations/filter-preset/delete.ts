import { db } from "../../../../lib/db";
import { FilterPreset } from "../../entity";

export const deleteFilterPreset = async (id: string): Promise<void> => {
  const database = await db();
  const repository = database.getRepository(FilterPreset);

  await repository.delete(id);
};

