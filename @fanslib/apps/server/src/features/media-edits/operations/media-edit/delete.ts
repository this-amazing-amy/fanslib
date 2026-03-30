import { db } from "../../../../lib/db";
import { MediaEdit } from "../../entity";

export const deleteMediaEdit = async (id: string): Promise<boolean> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  const mediaEdit = await repo.findOne({ where: { id } });
  if (!mediaEdit) {
    return false;
  }

  await repo.delete(id);
  return true;
};
