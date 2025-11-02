import { db } from "../../../../lib/db";
import { Shoot } from "../../entity";

export const deleteShoot = async (id: string): Promise<void> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);

  await shootRepository.delete(id);
};

