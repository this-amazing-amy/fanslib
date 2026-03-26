import { Not } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaEdit } from "../../entity";

export const fetchMediaEditQueue = async (): Promise<MediaEdit[]> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  return repo.find({
    where: { status: Not("draft") },
    order: { updatedAt: "DESC" },
  });
};
