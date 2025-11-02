import type { CreateShootRequest, ShootWithMedia } from "@fanslib/types";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { Shoot } from "../../entity";

export const createShoot = async (payload: CreateShootRequest): Promise<ShootWithMedia> => {
  const database = await db();
  const mediaRepository = database.getRepository(Media);
  const shootRepository = database.getRepository(Shoot);

  const media = payload.mediaIds
    ? await mediaRepository.findBy({
        id: In(payload.mediaIds),
      })
    : [];

  const shoot = shootRepository.create({
    name: payload.name,
    description: payload.description,
    shootDate: payload.shootDate,
    media,
  });

  await shootRepository.save(shoot);
  return shoot;
};

