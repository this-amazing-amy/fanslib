import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Shoot } from "../../entity";

export const DeleteShootResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteShoot = async (id: string): Promise<typeof DeleteShootResponseSchema.static> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);

  await shootRepository.delete(id);
  return { success: true };
};

