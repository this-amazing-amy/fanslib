import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { MediaSchema } from "../../../library/schema";
import { Shoot, ShootSchema } from "../../entity";

export const CreateShootRequestBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  shootDate: z.coerce.date(),
  mediaIds: z.array(z.string()).optional(),
});

export const CreateShootResponseSchema = ShootSchema.extend({
  media: z.array(MediaSchema),
});

export const createShoot = async (payload: z.infer<typeof CreateShootRequestBodySchema>): Promise<z.infer<typeof CreateShootResponseSchema>> => {
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

