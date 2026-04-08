import { db } from "../../../../lib/db";
import { Composition } from "../../entity";

export const fetchCompositionById = async (id: string): Promise<Composition | null> => {
  const database = await db();
  const repo = database.getRepository(Composition);
  return repo.findOne({ where: { id } });
};
