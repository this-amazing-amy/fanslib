import type { ShootWithMedia } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Shoot } from "../../entity";

export const getShoot = async (id: string): Promise<ShootWithMedia | null> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);

  return shootRepository.findOne({
    where: { id },
    relations: ["media"],
  });
};

