import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Shoot } from "../../entity";

export const DeleteShootRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteShootResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteShoot = async (id: string): Promise<boolean> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);
  const shoot = await shootRepository.findOne({ where: { id } });
  if (!shoot) {
    return false;
  }
  await shootRepository.delete(id);
  return true;
};

