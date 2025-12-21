import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { MediaSchema } from "../../../library/schema";
import { Shoot, ShootSchema } from "../../entity";

export const UpdateShootRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateShootRequestBodySchema = t.Object({
  name: t.Optional(t.String()),
  description: t.Optional(t.String()),
  shootDate: t.Optional(t.Date()),
  mediaIds: t.Optional(t.Array(t.String())),
});

export const UpdateShootResponseSchema = t.Composite([
  ShootSchema,
  t.Object({ media: t.Array(MediaSchema) }),
]);

export const updateShoot = async (
  id: string,
  payload: typeof UpdateShootRequestBodySchema.static
): Promise<typeof UpdateShootResponseSchema.static | null> => {
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

