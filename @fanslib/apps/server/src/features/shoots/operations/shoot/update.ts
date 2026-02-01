import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { MediaSchema } from "../../../library/schema";
import { Shoot, ShootSchema } from "../../entity";

export const UpdateShootRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateShootRequestBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  shootDate: z.coerce.date().optional(),
  mediaIds: z.array(z.string()).optional(),
});

export const UpdateShootResponseSchema = ShootSchema.extend({
  media: z.array(MediaSchema),
});

export const updateShoot = async (
  id: string,
  payload: z.infer<typeof UpdateShootRequestBodySchema>
): Promise<z.infer<typeof UpdateShootResponseSchema> | null> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);
  const mediaRepository = database.getRepository(Media);

  const shoot = await shootRepository.findOne({
    where: { id },
    relations: ["media"],
  });

  if (!shoot) {
    return null;
  }

  if (payload.mediaIds) {
    const media = await mediaRepository.findBy({
      id: In(payload.mediaIds),
    });
    shoot.media = media;
  }

  Object.assign(shoot, {
    name: payload.name ?? shoot.name,
    description: payload.description ?? shoot.description,
    shootDate: payload.shootDate ?? shoot.shootDate,
  });

  await shootRepository.save(shoot);
  return shoot;
};

