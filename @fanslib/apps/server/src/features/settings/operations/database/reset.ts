import { db, uninitialize } from "../../../../lib/db";

export const resetDatabase = async (): Promise<void> => {
  const database = await db();
  await database.dropDatabase();
  await uninitialize();
  await db();
};

