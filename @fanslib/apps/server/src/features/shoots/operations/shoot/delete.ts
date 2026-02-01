import { z } from "zod";
import { db } from "../../../../lib/db";
import { Shoot } from "../../entity";

export const DeleteShootRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteShootResponseSchema = z.object({
  success: z.boolean(),
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

