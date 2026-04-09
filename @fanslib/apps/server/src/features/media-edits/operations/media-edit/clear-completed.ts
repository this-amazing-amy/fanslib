import { db } from "../../../../lib/db";
import { MediaEdit } from "../../entity";

export const clearCompletedEdits = async (): Promise<number> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);
  const result = await repo.delete({ status: "completed" });
  return result.affected ?? 0;
};
