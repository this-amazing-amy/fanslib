import { db } from "../../../../lib/db";
import { MediaEdit } from "../../entity";

export const fetchMediaEditById = async (id: string): Promise<MediaEdit | null> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  return repo.findOne({ where: { id } });
};
