import { db } from "../../../../lib/db";
import { Composition } from "../../entity";

export const deleteComposition = async (id: string): Promise<boolean> => {
  const database = await db();
  const repo = database.getRepository(Composition);
  const composition = await repo.findOne({ where: { id } });
  if (!composition) return false;
  await repo.delete(id);
  return true;
};
