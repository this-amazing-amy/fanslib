import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media, MediaSchema } from "../../../library/entity";
import { Shoot, ShootSchema } from "../../entity";

export const CreateShootRequestBodySchema = t.Object({
  name: t.String(),
  description: t.Optional(t.String()),
  shootDate: t.Date(),
  mediaIds: t.Optional(t.Array(t.String())),
});

export const CreateShootResponseSchema = t.Intersect([ShootSchema, t.Object({ media: t.Array(MediaSchema) })]);

export const createShoot = async (payload: typeof CreateShootRequestBodySchema.static): Promise<typeof CreateShootResponseSchema.static> => {
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

