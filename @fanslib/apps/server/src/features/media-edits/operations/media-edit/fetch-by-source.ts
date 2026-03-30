import { db } from "../../../../lib/db";
import { MediaEdit } from "../../entity";

export const fetchMediaEditsBySource = async (sourceMediaId: string): Promise<MediaEdit[]> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  return repo.find({ where: { sourceMediaId } });
};
